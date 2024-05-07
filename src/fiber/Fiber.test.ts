import * as $Fiber from './Fiber'
import * as $Status from './Status'

describe('Fiber', () => {
  function* f() {
    yield 0
    yield 1
    yield 2
    yield 3

    return 4
  }

  describe('start', () => {
    test('starting fiber', async () => {
      const fiber = $Fiber.fiber(f)

      await expect(fiber.start()).resolves.toStrictEqual($Status.suspended(0))
    })

    test('failing starting suspended fiber', async () => {
      const fiber = $Fiber.fiber(f)
      await fiber.start()

      await expect(fiber.start()).rejects.toThrow(
        /Cannot start fiber [^ ]+ in status "Suspended"/,
      )
    })

    test('failing starting failed fiber', async () => {
      const fiber = $Fiber.fiber(f)
      await fiber.start()
      await fiber.throw(new Error('foo'))

      await expect(fiber.start()).rejects.toThrow(
        /Cannot start fiber [^ ]+ in status "Failed"/,
      )
    })

    test('failing starting terminated fiber', async () => {
      const fiber = $Fiber.fiber(f)
      await fiber.start()
      await fiber.resume()
      await fiber.resume()
      await fiber.resume()
      await fiber.resume()

      await expect(fiber.start()).rejects.toThrow(
        /Cannot start fiber [^ ]+ in status "Terminated"/,
      )
    })
  })

  describe('resume', () => {
    test('resuming fiber', async () => {
      const fiber = $Fiber.fiber(f)
      await fiber.start()

      await expect(fiber.resume()).resolves.toStrictEqual($Status.suspended(1))
    })

    test('failing resuming idle fiber', async () => {
      const fiber = $Fiber.fiber(f)

      await expect(fiber.resume()).rejects.toThrow(
        /Cannot resume fiber [^ ]+ in status "Ready"/,
      )
    })

    test('failing resuming failed fiber', async () => {
      const fiber = $Fiber.fiber(f)
      await fiber.start()
      await fiber.throw(new Error('foo'))

      await expect(fiber.resume()).rejects.toThrow(
        /Cannot resume fiber [^ ]+ in status "Failed"/,
      )
    })

    test('failing resuming terminated fiber', async () => {
      const fiber = $Fiber.fiber(f)
      await fiber.start()
      await fiber.resume()
      await fiber.resume()
      await fiber.resume()
      await fiber.resume()

      await expect(fiber.resume()).rejects.toThrow(
        /Cannot resume fiber [^ ]+ in status "Terminated"/,
      )
    })
  })

  describe('throw', () => {
    test('throwing fiber', async () => {
      const fiber = $Fiber.fiber(f)
      await fiber.start()

      await expect(fiber.throw(new Error('foo'))).resolves.toStrictEqual(
        $Status.failed(new Error('foo')),
      )
    })

    test('failing throwing idle fiber', async () => {
      const fiber = $Fiber.fiber(f)

      await expect(fiber.throw(new Error('foo'))).rejects.toThrow(
        /Cannot throw fiber [^ ]+ in status "Ready"/,
      )
    })

    test('failing throwing failed fiber', async () => {
      const fiber = $Fiber.fiber(f)
      await fiber.start()
      await fiber.throw(new Error('foo'))

      await expect(fiber.throw(new Error('foo'))).rejects.toThrow(
        /Cannot throw fiber [^ ]+ in status "Failed"/,
      )
    })

    test('failing throwing terminated fiber', async () => {
      const fiber = $Fiber.fiber(f)
      await fiber.start()
      await fiber.resume()
      await fiber.resume()
      await fiber.resume()
      await fiber.resume()

      await expect(fiber.throw(new Error('foo'))).rejects.toThrow(
        /Cannot throw fiber [^ ]+ in status "Terminated"/,
      )
    })
  })

  describe('interrupt', () => {
    test('interrupting idle fiber', async () => {
      const fiber = $Fiber.fiber(f)

      await expect(fiber.interrupt()).resolves.toStrictEqual(
        $Status.interrupted(),
      )
    })

    test('interrupting suspended fiber', async () => {
      const fiber = $Fiber.fiber(f)
      await fiber.start()

      await expect(fiber.interrupt()).resolves.toStrictEqual(
        $Status.interrupted(),
      )
    })

    test('interrupting interrupted fiber', async () => {
      const fiber = $Fiber.fiber(f)
      await fiber.start()
      await fiber.interrupt()

      await expect(fiber.interrupt()).resolves.toStrictEqual(
        $Status.interrupted(),
      )
    })

    test('interrupting failed fiber', async () => {
      const fiber = $Fiber.fiber(f)
      await fiber.start()
      await fiber.throw(new Error('foo'))

      await expect(fiber.interrupt()).resolves.toStrictEqual(
        $Status.failed(new Error('foo')),
      )
    })

    test('interrupting terminated fiber', async () => {
      const fiber = $Fiber.fiber(f)
      await fiber.start()
      await fiber.resume()
      await fiber.resume()
      await fiber.resume()
      await fiber.resume()

      await expect(fiber.interrupt()).resolves.toStrictEqual(
        $Status.terminated(4),
      )
    })
  })
})
