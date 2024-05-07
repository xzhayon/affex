import * as $Effect from './Effect'
import { Effect, _Effect, _effect } from './Effect'

export interface Interrupt extends _Effect<'Interrupt'> {}

export function _interrupt(): Effect<never, never, never> {
  return _effect('Interrupt')
}

export function interrupt() {
  return $Effect.perform(_interrupt())
}
