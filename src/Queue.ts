import * as $Iterator from './Iterator'

export class Queue<A> implements Iterator<A, void> {
  static readonly create = <A>(as?: A[]) => new Queue<A>(as)

  private constructor(private readonly as: A[] = []) {}

  readonly enqueue = (a: A) => {
    this.as.push(a)

    return this
  }

  readonly dequeue = () => this.as.shift()

  readonly next = () =>
    this.as.length > 0
      ? $Iterator.yield(this.dequeue() as A)
      : $Iterator.return();

  readonly [Symbol.iterator] = () => this

  readonly toArray = () => this.as
}

export const queue = Queue.create
