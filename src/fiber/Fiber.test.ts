import * as $Cause from '../Cause'
import * as $Exit from '../Exit'
import * as $Tag from '../Tag'
import { uri } from '../Type'
import * as $Proxy from '../effect/Proxy'
import * as $Context from '../runtime/Context'
import * as $Layer from '../runtime/Layer'
import * as $Runtime from '../runtime/Runtime'
import * as $Fiber from './Fiber'
import * as $Status from './Status'

describe('Fiber', () => {
  function* f() {
    yield

    return 42
  }

  describe('start', () => {
    test('starting fiber', async () => {
      const fiber = $Fiber.fiber(f)

      await expect($Fiber.start(fiber)).resolves.toStrictEqual(
        $Status.suspended(),
      )
    })

    test('failing starting fiber', async () => {
      const fiber = $Fiber.fiber(() => {
        throw new Error('foo')
      })

      await expect($Fiber.start(fiber)).resolves.toStrictEqual(
        $Status.terminated($Exit.failure($Cause.die(new Error('foo')))),
      )
    })

    test('failing starting suspended fiber', async () => {
      const fiber = $Fiber.fiber(f)
      await $Fiber.start(fiber)

      await expect($Fiber.start(fiber)).rejects.toThrow(
        /Cannot start fiber [^ ]+ in status "Suspended"/,
      )
    })

    test('failing starting terminated fiber', async () => {
      const fiber = $Fiber.fiber(f)
      await $Fiber.start(fiber)
      await $Fiber.resume(fiber, $Exit.failure($Cause.die(new Error('foo'))))

      await expect($Fiber.start(fiber)).rejects.toThrow(
        /Cannot start fiber [^ ]+ in status "Terminated"/,
      )
    })
  })

  describe('resume', () => {
    test('resuming fiber', async () => {
      const fiber = $Fiber.fiber(f)
      await $Fiber.start(fiber)

      await expect($Fiber.resume(fiber)).resolves.toStrictEqual(
        $Status.terminated($Exit.success(42)),
      )
    })

    test('failing resuming ready fiber', async () => {
      const fiber = $Fiber.fiber(f)

      await expect($Fiber.resume(fiber)).rejects.toThrow(
        /Cannot resume fiber [^ ]+ in status "Ready"/,
      )
    })

    test('failing resuming terminated fiber', async () => {
      const fiber = $Fiber.fiber(f)
      await $Fiber.start(fiber)
      await $Fiber.resume(fiber, $Exit.failure($Cause.die(new Error('foo'))))

      await expect($Fiber.resume(fiber)).rejects.toThrow(
        /Cannot resume fiber [^ ]+ in status "Terminated"/,
      )
    })
  })

  describe('interrupt', () => {
    test('interrupting ready fiber', async () => {
      const fiber = $Fiber.fiber(f)

      await expect($Fiber.interrupt(fiber)).resolves.toStrictEqual(
        $Status.terminated($Exit.failure($Cause.interrupt())),
      )
    })

    test('interrupting running fiber', async () => {
      const fiber = $Fiber.fromPromise(
        new Promise((resolve) => setTimeout(resolve, 100)),
      )
      const start = $Fiber.start(fiber)
      const interrupt = $Fiber.interrupt(fiber)
      await Promise.all([start, interrupt])

      expect(fiber.status).toStrictEqual(
        $Status.terminated($Exit.failure($Cause.interrupt())),
      )
    })

    test('interrupting suspended fiber', async () => {
      const fiber = $Fiber.fiber(f)
      await $Fiber.start(fiber)

      await expect($Fiber.interrupt(fiber)).resolves.toStrictEqual(
        $Status.terminated($Exit.failure($Cause.interrupt())),
      )
    })

    test('interrupting interrupted fiber', async () => {
      const fiber = $Fiber.fiber(f)
      await $Fiber.start(fiber)
      await $Fiber.interrupt(fiber)

      await expect($Fiber.interrupt(fiber)).resolves.toStrictEqual(
        $Status.terminated($Exit.failure($Cause.interrupt())),
      )
    })

    test('interrupting terminated fiber', async () => {
      const fiber = $Fiber.fiber(f)
      await $Fiber.start(fiber)
      await $Fiber.resume(fiber, $Exit.failure($Cause.die(new Error('foo'))))

      await expect($Fiber.interrupt(fiber)).resolves.toStrictEqual(
        $Status.terminated($Exit.failure($Cause.die(new Error('foo')))),
      )
    })
  })

  describe('fromPromise', () => {
    test('creating fiber from lazy promise', async () => {
      const fiber = $Fiber.fromPromise(
        () => new Promise((resolve) => setTimeout(() => resolve(42), 0)),
      )

      await expect($Fiber.start(fiber)).resolves.toStrictEqual(
        $Status.terminated($Exit.success(42)),
      )
    })
  })

  describe('suspend', () => {
    test('suspending root fiber', async () => {
      await expect(
        $Runtime.runPromise(function* () {
          yield* $Fiber.suspend()

          return 42
        }),
      ).resolves.toStrictEqual(42)
    })

    test('suspending child fiber', async () => {
      interface Random {
        readonly [uri]?: unique symbol
        (): number
      }

      const tag = $Tag.tag<Random>()
      const random = $Proxy.operation(tag)

      await expect(
        $Runtime.runPromise(
          random,
          $Context.context().with(
            $Layer.layer(tag, function* () {
              yield* $Fiber.suspend()

              return 42
            }),
          ),
        ),
      ).resolves.toStrictEqual(42)
    })
  })
})
