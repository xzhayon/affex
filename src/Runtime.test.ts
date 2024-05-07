import * as $Cause from './Cause'
import * as $Exit from './Exit'
import * as $Layer from './Layer'
import * as $Runtime from './Runtime'
import * as $Tag from './Tag'
import { uri } from './Type'
import * as $Exception from './effect/Exception'
import * as $Fork from './effect/Fork'
import * as $Proxy from './effect/Proxy'

describe('Runtime', () => {
  describe('runExit', () => {
    test('running effector with no effects', async () => {
      await expect(
        $Runtime.runExit(function* () {
          yield 42
          yield 1337

          return 42 + 1337
        }, $Layer.layer()),
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
          $Runtime.runExit(add(42, 1337), $Layer.layer()),
        ).resolves.toMatchObject(
          $Exit.failure(
            $Cause.die(
              new Error(
                `Cannot find handler for effect${
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
        }, $Layer.layer()),
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
          $Layer.layer().with(tag, (a, b) => {
            if (b === 0) {
              throw new Error('Cannot divide by zero')
            }

            return a / b
          }),
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
        }, $Layer.layer()),
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
        }, $Layer.layer()),
      ).resolves.toMatchObject(
        $Exit.failure($Cause.die(new Error('bar'), {} as any)),
      )
    })

    test('catching error from nested generator', async () => {
      await expect(
        $Runtime.runExit(function* () {
          try {
            return yield* $Fork.fork()(function* () {
              throw new Error('foo')
            })
          } catch {
            return 'bar'
          }
        }, $Layer.layer()),
      ).resolves.toStrictEqual($Exit.success('bar'))
    })

    test('rethrowing error from nested effector', async () => {
      await expect(
        $Runtime.runExit(function* () {
          try {
            return yield* $Fork.fork()(function* () {
              throw new Error('foo')
            })
          } catch (error) {
            throw error
          }
        }, $Layer.layer()),
      ).resolves.toMatchObject(
        $Exit.failure($Cause.die(new Error('foo'), {} as any)),
      )
    })

    test('rethrowing exception from nested effector', async () => {
      await expect(
        $Runtime.runExit(function* () {
          try {
            return yield* $Fork.fork()(function* () {
              return yield* $Exception.raise(new Error('foo'))
            })
          } catch (error) {
            throw error
          }
        }, $Layer.layer()),
      ).resolves.toMatchObject(
        $Exit.failure($Cause.fail(new Error('foo'), {} as any)),
      )
    })
  })
})
