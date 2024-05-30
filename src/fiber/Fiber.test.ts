import * as $Cause from '../Cause'
import * as $Exit from '../Exit'
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

      await expect(fiber.start()).resolves.toStrictEqual($Status.suspended())
    })

    test('failing starting fiber', async () => {
      const fiber = $Fiber.fiber(() => {
        throw new Error('foo')
      })

      await expect(fiber.start()).resolves.toStrictEqual(
        $Status.terminated($Exit.failure($Cause.die(new Error('foo')))),
      )
    })

    test('failing starting suspended fiber', async () => {
      const fiber = $Fiber.fiber(f)
      await fiber.start()

      await expect(fiber.start()).rejects.toThrow(
        /Cannot start fiber [^ ]+ in status "Suspended"/,
      )
    })

    test('failing starting terminated fiber', async () => {
      const fiber = $Fiber.fiber(f)
      await fiber.start()
      await fiber.resume($Exit.failure($Cause.die(new Error('foo'))))

      await expect(fiber.start()).rejects.toThrow(
        /Cannot start fiber [^ ]+ in status "Terminated"/,
      )
    })
  })

  describe('resume', () => {
    test('resuming fiber', async () => {
      const fiber = $Fiber.fiber(f)
      await fiber.start()

      await expect(fiber.resume()).resolves.toStrictEqual(
        $Status.terminated($Exit.success(42)),
      )
    })

    test('failing resuming ready fiber', async () => {
      const fiber = $Fiber.fiber(f)

      await expect(fiber.resume()).rejects.toThrow(
        /Cannot resume fiber [^ ]+ in status "Ready"/,
      )
    })

    test('failing resuming terminated fiber', async () => {
      const fiber = $Fiber.fiber(f)
      await fiber.start()
      await fiber.resume($Exit.failure($Cause.die(new Error('foo'))))

      await expect(fiber.resume()).rejects.toThrow(
        /Cannot resume fiber [^ ]+ in status "Terminated"/,
      )
    })
  })

  describe('interrupt', () => {
    test('interrupting ready fiber', async () => {
      const fiber = $Fiber.fiber(f)

      await expect(fiber.interrupt()).resolves.toStrictEqual(
        $Status.terminated($Exit.failure($Cause.interrupt())),
      )
    })

    test('interrupting suspended fiber', async () => {
      const fiber = $Fiber.fiber(f)
      await fiber.start()

      await expect(fiber.interrupt()).resolves.toStrictEqual(
        $Status.terminated($Exit.failure($Cause.interrupt())),
      )
    })

    test('interrupting interrupted fiber', async () => {
      const fiber = $Fiber.fiber(f)
      await fiber.start()
      await fiber.interrupt()

      await expect(fiber.interrupt()).resolves.toStrictEqual(
        $Status.terminated($Exit.failure($Cause.interrupt())),
      )
    })

    test('interrupting terminated fiber', async () => {
      const fiber = $Fiber.fiber(f)
      await fiber.start()
      await fiber.resume($Exit.failure($Cause.die(new Error('foo'))))

      await expect(fiber.interrupt()).resolves.toStrictEqual(
        $Status.terminated($Exit.failure($Cause.die(new Error('foo')))),
      )
    })
  })

  describe('fromPromise', () => {
    test('creating fiber from lazy promise', async () => {
      const fiber = $Fiber.fromPromise(
        () => new Promise((resolve) => setTimeout(() => resolve(42), 0)),
      )

      await expect(fiber.start()).resolves.toStrictEqual(
        $Status.terminated($Exit.success(42)),
      )
    })
  })
})
