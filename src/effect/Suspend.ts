import * as $Effect from './Effect'
import { Effect, _Effect, _effect } from './Effect'

export interface Suspend extends _Effect<'Suspend'> {}

export function suspension(): Effect<void, never, never> {
  return _effect('Suspend')
}

export function suspend() {
  return $Effect.perform(suspension())
}
