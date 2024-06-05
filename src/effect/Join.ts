import { Fiber } from '../fiber/Fiber'
import * as $Effect from './Effect'
import { Effect, _Effect, _effect } from './Effect'

export interface Join<out A, out E, out R> extends _Effect<'Join'> {
  readonly fiber: Fiber<A, E, R>
}

function _join<A, E, R>(fiber: Fiber<A, E, R>): Effect<A, E, R> {
  return { ..._effect('Join'), fiber }
}

export function join<A, E, R>(fiber: Fiber<A, E, R>) {
  return $Effect.perform(_join(fiber))
}
