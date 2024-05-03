import * as $Type from '../Type'
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

  test('running concurrent fibers', async () => {
    function* g() {
      yield 'a'
      yield 'b'
      yield 'c'
      yield 'd'

      return 'e'
    }

    const fibers = [$Fiber.fiber(f), $Fiber.fiber(g)]
    const as = []
    while (fibers.length > 0) {
      for (let i = 0; i < fibers.length; i++) {
        const fiber = fibers[i]
        switch (fiber.status[$Type.tag]) {
          case 'Idle':
            as.push(await fiber.start())
            break
          case 'Suspended':
            as.push(await fiber.resume())
            break
          case 'Failed':
          case 'Terminated':
            fibers.splice(i, 1)
            break
        }
      }
    }

    expect(as).toStrictEqual([
      $Status.suspended(0),
      $Status.suspended('a'),
      $Status.suspended(1),
      $Status.suspended('b'),
      $Status.suspended(2),
      $Status.suspended('c'),
      $Status.suspended(3),
      $Status.suspended('d'),
      $Status.terminated(4),
      $Status.terminated('e'),
    ])
  })

  describe('start', () => {
    test('starting fiber', async () => {
      const fiber = $Fiber.fiber(f)

      await expect(fiber.start()).resolves.toStrictEqual($Status.suspended(0))
    })

    test('failing starting suspended fiber', async () => {
      const fiber = $Fiber.fiber(f)
      await fiber.start()

      await expect(fiber.start()).rejects.toThrow(
        'Cannot start fiber in status "Suspended"',
      )
    })

    test('failing starting failed fiber', async () => {
      const fiber = $Fiber.fiber(f)
      await fiber.start()
      await fiber.throw(new Error('foo'))

      await expect(fiber.start()).rejects.toThrow(
        'Cannot start fiber in status "Failed"',
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
        'Cannot start fiber in status "Terminated"',
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
        'Cannot resume fiber in status "Idle"',
      )
    })

    test('failing resuming failed fiber', async () => {
      const fiber = $Fiber.fiber(f)
      await fiber.start()
      await fiber.throw(new Error('foo'))

      await expect(fiber.resume()).rejects.toThrow(
        'Cannot resume fiber in status "Failed"',
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
        'Cannot resume fiber in status "Terminated"',
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
        'Cannot throw fiber in status "Idle"',
      )
    })

    test('failing throwing failed fiber', async () => {
      const fiber = $Fiber.fiber(f)
      await fiber.start()
      await fiber.throw(new Error('foo'))

      await expect(fiber.throw(new Error('foo'))).rejects.toThrow(
        'Cannot throw fiber in status "Failed"',
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
        'Cannot throw fiber in status "Terminated"',
      )
    })
  })
})
