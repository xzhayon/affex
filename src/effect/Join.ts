import { Throw, Use } from '../Effector'
import * as $Fiber from '../fiber/Fiber'
import { Fiber } from '../fiber/Fiber'
import * as $Effect from './Effect'
import { Effect, _Effect, _effect } from './Effect'

export interface Join<A, E, R> extends _Effect<'Join'> {
  readonly fiber: Fiber<
    A,
    (E extends any ? Throw<E> : never) | (R extends any ? Use<R> : never)
  >
}

function _join<F extends Fiber<any, any>>(
  fiber: F,
): Effect<
  $Fiber.TOf<F>,
  $Fiber.SOf<F> extends infer S
    ? S extends Throw<infer E>
      ? E
      : never
    : never,
  $Fiber.SOf<F> extends infer S ? (S extends Use<infer R> ? R : never) : never
> {
  return { ..._effect('Join'), fiber }
}

export function join<F extends Fiber<any, any>>(fiber: F) {
  return $Effect.perform(_join(fiber))
}
