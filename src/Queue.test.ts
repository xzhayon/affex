import * as $Queue from './Queue'

describe('Queue', () => {
  test('enqueueing and dequeueing', () => {
    const queue = $Queue.queue([0, 1, 2]).enqueue(3).enqueue(4)
    const as = []
    for (const a of queue) {
      as.push(a)
    }

    expect(as).toStrictEqual([0, 1, 2, 3, 4])
  })

  test('requeueing', () => {
    const queue = $Queue.queue().enqueue(0).enqueue(1)
    const as = []
    let requeue = true
    for (const a of queue) {
      as.push(a)
      if (requeue) {
        requeue = false
        queue.enqueue(a)
      }
    }

    expect(as).toStrictEqual([0, 1, 0])
  })
})
