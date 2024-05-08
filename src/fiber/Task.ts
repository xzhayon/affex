import * as $Type from '../Type'
import { Variant } from '../Type'
import { Fiber } from './Fiber'

export type Task<F extends Fiber<any, any>> = Attached<F> | Detached<F>

type _Task<T extends string> = Variant<typeof uri, T>

export interface Attached<F extends Fiber<any, any>> extends _Task<'Attached'> {
  readonly fiber: F
}

export interface Detached<F extends Fiber<any, any>> extends _Task<'Detached'> {
  readonly fiber: F
}

const uri = Symbol('Task')
const _task = $Type.variant(uri)

export function attached<F extends Fiber<any, any>>(fiber: F): Task<F> {
  return { ..._task('Attached'), fiber }
}

export function detached<F extends Fiber<any, any>>(fiber: F): Task<F> {
  return { ..._task('Detached'), fiber }
}

export function isAttached<F extends Fiber<any, any>>(
  task: Task<F>,
): task is Attached<F> {
  return task[$Type.tag] === 'Attached'
}

export function isDetached<F extends Fiber<any, any>>(
  task: Task<F>,
): task is Detached<F> {
  return task[$Type.tag] === 'Detached'
}
