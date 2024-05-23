import * as $Effect from './Effect'
import { Effect, _Effect, _effect } from './Effect'

export interface Interruption extends _Effect<'Interruption'> {}

function interruption(): Effect<never> {
  return _effect('Interruption')
}

export function interrupt() {
  return $Effect.perform(interruption())
}
