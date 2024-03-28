import * as E from './Effect'
import { Effect } from './Effect'
import * as G from './Generator'
import { Has } from './Has'
import * as I from './Iterator'
import { Layer } from './Layer'
import * as T from './Tag'

export type Effector<R, A> = Generator<R extends any ? Has<R> : never, A, any>

async function _run(iterator: Iterator<any>, layer: Layer<any, any>) {
  let next = iterator.next()
  while (!next.done) {
    if (!E.is(next.value)) {
      next = iterator.next()

      continue
    }

    const { key, f }: Effect<any, any> = next.value
    const handler = layer.handler(T.tag(key))
    if (handler === undefined) {
      throw new Error(
        `Cannot find handler for effect${
          key.description ? ` "${key.description}"` : ''
        }`,
      )
    }

    const a = await f(handler)
    next = iterator.next(I.is(a) ? await _run(a, layer) : a)
  }

  return next.value
}

export async function run<G extends Generator>(
  effector: G,
  layer: Layer<
    never,
    G.YOf<G> extends infer E
      ? E extends Effect<any, any>
        ? E.ROf<E>
        : never
      : never
  >,
): Promise<G.ROf<G>> {
  return _run(effector, layer)
}
