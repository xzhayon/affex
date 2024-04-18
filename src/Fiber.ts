import * as E from './Effect'
import { Effect, Use } from './Effect'
import * as F from './Function'
import * as G from './Generator'
import * as I from './Iterator'
import * as L from './Layer'
import { DefaultLayer, Layer } from './Layer'

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

    const { tag, f }: Effect<any, any, any> = next.value
    const handler: any = layer.handler(tag)
    if (handler === undefined) {
      throw new Error(
        `Cannot find handler for effect${
          tag.key.description ? ` "${tag.key.description}"` : ''
        }`,
      )
    }

    try {
      const a = await f(
        F.is(handler)
          ? handler.bind({
              run: (
                effector:
                  | Generator
                  | AsyncGenerator
                  | (() => Generator | AsyncGenerator),
              ) => run(effector, layer),
            })
          : handler,
      )
      next = await iterator.next(I.is(a) ? await _run(a, layer) : a)
    } catch (error) {
      if (iterator.throw === undefined) {
        throw error
      }

      next = await iterator.throw(
        I.is(error) ? await _run(error, layer) : error,
      )
    }
  }

  return next.value
}

export async function run<G extends Generator | AsyncGenerator>(
  effector: G | (() => G),
  layer: Layer<
    never,
    Exclude<
      G.YOf<G> extends infer U extends Use<any> ? E.ROf<U> : never,
      L.AOf<DefaultLayer>
    >
  >,
): Promise<G.ROf<G>> {
  return _run(I.is(effector) ? effector : effector(), L.default().with(layer))
}
