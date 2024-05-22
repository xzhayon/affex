import * as $Cause from './Cause'
import * as $Context from './Context'
import * as $Exit from './Exit'
import * as $Layer from './Layer'
import { Result } from './Result'
import * as $Runtime from './Runtime'
import * as $Tag from './Tag'
import { uri } from './Type'
import * as $Backdoor from './effect/Backdoor'
import * as $Exception from './effect/Exception'
import * as $Interruption from './effect/Interruption'
import * as $Proxy from './effect/Proxy'
import * as $FiberId from './fiber/Id'

describe('Runtime', () => {
  beforeEach(() => {
    $FiberId.Id.reset()
  })

  describe('runExit', () => {
    test('running effector with no effects', async () => {
      await expect(
        $Runtime.runExit(function* () {
          yield 42
          yield 1337

          return 42 + 1337
        }, $Context.context()),
      ).resolves.toStrictEqual($Exit.success(42 + 1337))
    })

    test.each([undefined, 'Add'])(
      'running proxy effect without providing handler',
      async (description) => {
        interface Add {
          readonly [uri]?: unique symbol
          (a: number, b: number): number
        }

        const tag = $Tag.tag<Add>(description)
        const add = $Proxy.function(tag)

        await expect(
          // @ts-expect-error
          $Runtime.runExit(add(42, 1337), $Context.context()),
        ).resolves.toMatchObject(
          $Exit.failure(
            $Cause.die(
              new Error(
                `Cannot find layer for effect${
                  description ? ` "${description}"` : ''
                }`,
              ),
              {} as any,
            ),
          ),
        )
      },
    )

    test('throwing error from effector', async () => {
      await expect(
        $Runtime.runExit(function* () {
          throw new Error('foo')
        }, $Context.context()),
      ).resolves.toMatchObject(
        $Exit.failure($Cause.die(new Error('foo'), {} as any)),
      )
    })

    test('throwing error from effect handler', async () => {
      interface Divide {
        readonly [uri]?: unique symbol
        (a: number, b: number): number
      }

      const tag = $Tag.tag<Divide>()
      const divide = $Proxy.function(tag)

      await expect(
        $Runtime.runExit(
          divide(42, 0),
          $Context.context().with(
            $Layer.layer(tag, (a, b) => {
              if (b === 0) {
                throw new Error('Cannot divide by zero')
              }

              return a / b
            }),
          ),
        ),
      ).resolves.toMatchObject(
        $Exit.failure(
          $Cause.die(new Error('Cannot divide by zero'), {} as any),
        ),
      )
    })

    test('throwing error after catching exception', async () => {
      await expect(
        $Runtime.runExit(function* () {
          try {
            return yield* $Exception.raise(new Error('foo'))
          } catch {
            throw new Error('bar')
          }
        }, $Context.context()),
      ).resolves.toMatchObject(
        $Exit.failure($Cause.die(new Error('bar'), {} as any)),
      )
    })

    test('throwing error after catching exception in nested fiber', async () => {
      await expect(
        $Runtime.runExit(function* () {
          try {
            return yield* $Exception.raise(new Error('foo'))
          } catch {
            throw new Error('bar')
          }
        }, $Context.context()),
      ).resolves.toMatchObject(
        $Exit.failure($Cause.die(new Error('bar'), {} as any)),
      )
    })

    test('catching error from nested generator', async () => {
      await expect(
        $Runtime.runExit(function* () {
          try {
            return yield* $Backdoor.exploit()(function* () {
              throw new Error('foo')
            })
          } catch {
            return 'bar'
          }
        }, $Context.context()),
      ).resolves.toStrictEqual($Exit.success('bar'))
    })

    test('rethrowing error from nested effector', async () => {
      await expect(
        $Runtime.runExit(function* () {
          try {
            return yield* $Backdoor.exploit()(function* () {
              throw new Error('foo')
            })
          } catch (error) {
            throw error
          }
        }, $Context.context()),
      ).resolves.toMatchObject(
        $Exit.failure($Cause.die(new Error('foo'), {} as any)),
      )
    })

    test('rethrowing exception from nested effector', async () => {
      await expect(
        $Runtime.runExit(function* () {
          try {
            return yield* $Backdoor.exploit()(function* () {
              return yield* $Exception.raise(new Error('foo'))
            })
          } catch (error) {
            throw error
          }
        }, $Context.context()),
      ).resolves.toMatchObject(
        $Exit.failure($Cause.fail(new Error('foo'), {} as any)),
      )
    })

    test('catching error from handler', async () => {
      interface Foo {
        readonly [uri]?: unique symbol
        (): string
      }

      const tag = $Tag.tag<Foo>()
      const foo = $Proxy.function(tag)

      await expect(
        $Runtime.runExit(
          function* () {
            try {
              return yield* foo()
            } catch {
              return 'bar'
            }
          },
          $Context.context().with(
            $Layer.layer(tag, () => {
              throw new Error()
            }),
          ),
        ),
      ).resolves.toStrictEqual($Exit.success('bar'))
    })

    test('recording fiber ID in Die cause', async () => {
      interface Foo {
        readonly [uri]?: unique symbol
        (): string
      }

      interface Bar {
        readonly [uri]?: unique symbol
        (): string
      }

      interface Qux {
        readonly [uri]?: unique symbol
        (): string
      }

      const tagFoo = $Tag.tag<Foo>()
      const foo = $Proxy.function(tagFoo)

      const tagBar = $Tag.tag<Bar>()
      const bar = $Proxy.function(tagBar)

      const tagQux = $Tag.tag<Qux>()
      const qux = $Proxy.function(tagQux)

      const exit = await $Runtime.runExit(
        function* () {
          return yield* foo()
        },
        $Context
          .context()
          .with(
            $Layer.layer(tagFoo, function* () {
              return yield* bar()
            }),
          )
          .with(
            $Layer.layer(tagBar, function* () {
              return yield* qux()
            }),
          )
          .with(
            $Layer.layer(tagQux, () => {
              throw new Error()
            }),
          ),
      )

      // @ts-ignore
      expect($Cause.isDie(exit.cause)).toStrictEqual(true)
      // @ts-ignore
      expect(`${exit.cause.fiberId}`).toStrictEqual('2')
    })

    test('recording fiber ID in Fail cause', async () => {
      interface Foo {
        readonly [uri]?: unique symbol
        (): Result<string, Error>
      }

      interface Bar {
        readonly [uri]?: unique symbol
        (): Result<string, Error>
      }

      interface Qux {
        readonly [uri]?: unique symbol
        (): Result<string, Error>
      }

      const tagFoo = $Tag.tag<Foo>()
      const foo = $Proxy.function(tagFoo)

      const tagBar = $Tag.tag<Bar>()
      const bar = $Proxy.function(tagBar)

      const tagQux = $Tag.tag<Qux>()
      const qux = $Proxy.function(tagQux)

      const exit = await $Runtime.runExit(
        function* () {
          return yield* foo()
        },
        $Context
          .context()
          .with(
            $Layer.layer(tagFoo, function* () {
              return yield* bar()
            }),
          )
          .with(
            $Layer.layer(tagBar, function* () {
              return yield* qux()
            }),
          )
          .with(
            $Layer.layer(tagQux, function* () {
              return yield* $Exception.raise(new Error())
            }),
          ),
      )

      // @ts-ignore
      expect($Cause.isFail(exit.cause)).toStrictEqual(true)
      // @ts-ignore
      expect(`${exit.cause.fiberId}`).toStrictEqual('3')
    })

    test('recording fiber ID in Interrupt cause', async () => {
      interface Foo {
        readonly [uri]?: unique symbol
        (): string
      }

      interface Bar {
        readonly [uri]?: unique symbol
        (): string
      }

      interface Qux {
        readonly [uri]?: unique symbol
        (): string
      }

      const tagFoo = $Tag.tag<Foo>()
      const foo = $Proxy.function(tagFoo)

      const tagBar = $Tag.tag<Bar>()
      const bar = $Proxy.function(tagBar)

      const tagQux = $Tag.tag<Qux>()
      const qux = $Proxy.function(tagQux)

      const exit = await $Runtime.runExit(
        function* () {
          return yield* foo()
        },
        $Context
          .context()
          .with(
            $Layer.layer(tagFoo, function* () {
              return yield* bar()
            }),
          )
          .with(
            $Layer.layer(tagBar, function* () {
              return yield* qux()
            }),
          )
          .with(
            $Layer.layer(tagQux, function* () {
              return yield* $Interruption.interrupt()
            }),
          ),
      )

      // @ts-ignore
      expect($Cause.isInterrupt(exit.cause)).toStrictEqual(true)
      // @ts-ignore
      expect(`${exit.cause.fiberId}`).toStrictEqual('3')
    })
  })
})
