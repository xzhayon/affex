import * as $Fiber from '../fiber/Fiber'
import * as $Status from '../fiber/Status'
import * as $Type from '../Type'
import * as $Scheduler from './Scheduler'

describe('Scheduler', () => {
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
    const scheduler = $Scheduler
      .scheduler()
      .attach($Fiber.fiber(f))
      .attach($Fiber.fiber(g))

    const as = []
    for await (const task of scheduler) {
      switch (task.fiber.status[$Type.tag]) {
        case 'Suspended':
          as.push(task.fiber.status)
          await task.fiber.resume()

          break
        case 'Terminated':
          as.push(task.fiber.status)

          break
      }
    }

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

  test('detaching one fiber', async () => {
    const scheduler = $Scheduler
      .scheduler()
      .attach($Fiber.fiber(f))
      .detach($Fiber.fiber(g))

    const as = []
    for await (const task of scheduler) {
      switch (task.fiber.status[$Type.tag]) {
        case 'Suspended':
          as.push(task.fiber.status)
          await task.fiber.resume()

          break
        case 'Terminated':
          as.push(task.fiber.status)

          break
      }
    }

    expect(as).toStrictEqual([
      $Status.suspended(0),
      $Status.suspended('a'),
      $Status.suspended(1),
      $Status.suspended('b'),
      $Status.terminated(2),
    ])
  })

  test('detaching all fibers', async () => {
    const scheduler = $Scheduler
      .scheduler()
      .detach($Fiber.fiber(f))
      .detach($Fiber.fiber(g))

    const as = []
    for await (const task of scheduler) {
      switch (task.fiber.status[$Type.tag]) {
        case 'Suspended':
          as.push(task.fiber.status)
          await task.fiber.resume()

          break
        case 'Terminated':
          as.push(task.fiber.status)

          break
      }
    }

    expect(as).toStrictEqual([])
  })
})
