import * as $Effect from './Effect'
import { Effect, _Effect, _effect } from './Effect'

export interface Suspension extends _Effect<'Suspension'> {}

export function suspension(): Effect<void, never, never> {
  return _effect('Suspension')
}

export function suspend() {
  return $Effect.perform(suspension())
}
