import { AsyncEffector, Effector } from '../Effector'
import * as $Effect from './Effect'
import { Effect, _Effect, _effect } from './Effect'

export interface Exception<E> extends _Effect<'Exception'> {
  readonly error: E
}

function exception<E>(error: E): Effect<never, E, never> {
  return { ..._effect('Exception'), error }
}

export function raise<E>(error: E) {
  return $Effect.perform(exception(error))
}

export function* wrap<A, E>(
  f: () => A,
  onError: (error: unknown) => E,
): Effector<A, E, never> {
  try {
    return f()
  } catch (error) {
    return yield* raise(onError(error))
  }
}

export async function* wrapAsync<A, E>(
  f: () => Promise<A>,
  onError: (error: unknown) => E,
): AsyncEffector<A, E, never> {
  try {
    return await f()
  } catch (error) {
    return yield* raise(onError(error))
  }
}
