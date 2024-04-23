import { Equal } from '@type-challenges/utils'
import { Proxy } from './effect/Proxy'

export type Effector<R, A, E = never> = Generator<
  R extends any ? Use<R> : never,
  A,
  Equal<E, never> extends false ? Throw<E> : unknown
>

export type AsyncEffector<R, A, E = never> = AsyncGenerator<
  R extends any ? Use<R> : never,
  A,
  Equal<E, never> extends false ? Throw<E> : unknown
>

export type Use<R> = Proxy<R, any, any>

export type Throw<E> = (e: E) => E
