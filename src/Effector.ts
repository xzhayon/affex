import * as E from './Effect'
import { Effect } from './Effect'
import * as F from './Fork'
import { Fork } from './Fork'
import * as G from './Generator'
import { Has } from './Has'
import * as I from './Iterator'
import { Layer } from './Layer'

export type Effector<R, A> = Generator<R extends any ? Has<R> : never, A, any>

export type AsyncEffector<R, A> = AsyncGenerator<
  R extends any ? Has<R> : never,
  A,
  any
>

async function _run(
  iterator: Iterator<any> | AsyncIterator<any>,
  layer: Layer<never, any>,
) {
  let next = await iterator.next()
  while (!next.done) {
    if (!E.is(next.value)) {
      next = await iterator.next()

      continue
    }

    const { tag, f }: Effect<any, any> = next.value
    const handler: any = layer.handler(tag)
    if (handler === undefined) {
      throw new Error(
        `Cannot find handler for effect${
          tag.key.description ? ` "${tag.key.description}"` : ''
        }`,
      )
    }

    const a = await (tag.key === F.tag.key
      ? f(
          handler.bind({
            run: (
              effector:
                | Generator
                | AsyncGenerator
                | (() => Generator | AsyncGenerator),
            ) => run(effector, layer),
          }),
        )
      : f(handler))
    next = await iterator.next(I.is(a) ? await _run(a, layer) : a)
  }

  return next.value
}

export async function run<G extends Generator | AsyncGenerator>(
  effector: G | (() => G),
  layer: Layer<
    never,
    Exclude<G.YOf<G> extends infer E extends Has<any> ? E.ROf<E> : never, Fork>
  >,
): Promise<G.ROf<G>> {
  return _run(
    I.is(effector) ? effector : effector(),
    Layer.empty().with(F.tag, F.forkWithContext).with(layer),
  )
}
