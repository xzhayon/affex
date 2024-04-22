import * as $Type from '../Type'
import * as $Effect from './Effect'
import { Effect, _Effect } from './Effect'

export interface Exception<E> extends _Effect<'Exception'> {
  readonly error: E
}

function exception<E>(error: E): Effect<never, never, E> {
  return { [$Type.uri]: $Effect.uri, [$Type.tag]: 'Exception', error }
}

export function raise<E>(error: E) {
  return $Effect.perform(exception(error))
}
