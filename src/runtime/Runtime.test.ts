import * as $Cause from '../Cause'
import * as $Exit from '../Exit'
import * as $Tag from '../Tag'
import { uri } from '../Type'
import * as $Backdoor from '../effect/Backdoor'
import * as $Exception from '../effect/Exception'
import * as $Interruption from '../effect/Interruption'
import * as $Proxy from '../effect/Proxy'
import { InterruptError } from '../error/InterruptError'
import { MissingLayerError } from '../error/MissingLayerError'
import * as $Context from './Context'
import * as $Layer from './Layer'
import * as $Runtime from './Runtime'

describe('Runtime', () => {
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
          $Exit.failure($Cause.die(new MissingLayerError(tag))),
        )
      },
    )

    test('throwing error from effector', async () => {
      await expect(
        $Runtime.runExit(function* () {
          throw new Error('foo')
        }, $Context.context()),
      ).resolves.toMatchObject($Exit.failure($Cause.die(new Error('foo'))))
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
        $Exit.failure($Cause.die(new Error('Cannot divide by zero'))),
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
      ).resolves.toMatchObject($Exit.failure($Cause.die(new Error('bar'))))
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
      ).resolves.toMatchObject($Exit.failure($Cause.die(new Error('bar'))))
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
      ).resolves.toMatchObject($Exit.failure($Cause.die(new Error('foo'))))
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
      ).resolves.toMatchObject($Exit.failure($Cause.fail(new Error('foo'))))
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
  })

  describe('runPromise', () => {
    test('interrupting fiber', async () => {
      await expect(
        $Runtime.runPromise(function* () {
          return yield* $Interruption.interrupt()
        }, $Context.context()),
      ).rejects.toThrow(InterruptError)
    })
  })
})
