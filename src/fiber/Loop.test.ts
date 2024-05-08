import * as $Fiber from './Fiber'
import * as $Loop from './Loop'
import * as $Status from './Status'

describe('Loop', () => {
  function* f() {
    yield 0
    yield 1

    return 2
  }

  function* g() {
    yield 'a'
    yield 'b'
    yield 'c'
    yield 'd'

    return 'e'
  }

  test('attaching all fibers', async () => {
    const as: any[] = []
    await $Loop
      .loop()
      .attach($Fiber.fiber(f))
      .attach($Fiber.fiber(g))
      .run({
        onSuspended: async (task) => {
          as.push(task.fiber.status)
          await task.fiber.resume()
        },
        onTerminated: async (task) => {
          as.push(task.fiber.status)
        },
      })

    expect(as).toStrictEqual([
      $Status.suspended(0),
      $Status.suspended('a'),
      $Status.suspended(1),
      $Status.suspended('b'),
      $Status.terminated(2),
      $Status.suspended('c'),
      $Status.suspended('d'),
      $Status.terminated('e'),
    ])
  })

  test('detaching some fibers', async () => {
    const as: any[] = []
    await $Loop
      .loop()
      .attach($Fiber.fiber(f))
      .detach($Fiber.fiber(g))
      .run({
        onSuspended: async (task) => {
          as.push(task.fiber.status)
          await task.fiber.resume()
        },
        onTerminated: async (task) => {
          as.push(task.fiber.status)
        },
      })

    expect(as).toStrictEqual([
      $Status.suspended(0),
      $Status.suspended('a'),
      $Status.suspended(1),
      $Status.suspended('b'),
      $Status.terminated(2),
    ])
  })

  test('detaching all fibers', async () => {
    const as: any[] = []
    await $Loop
      .loop()
      .detach($Fiber.fiber(f))
      .detach($Fiber.fiber(g))
      .run({
        onSuspended: async (task) => {
          as.push(task.fiber.status)
          await task.fiber.resume()
        },
        onTerminated: async (task) => {
          as.push(task.fiber.status)
        },
      })

    expect(as).toStrictEqual([])
  })
})
