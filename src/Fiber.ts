import * as $Effect from './Effect'
import { Effect, Use } from './Effect'
import * as $Function from './Function'
import * as $Generator from './Generator'
import * as $Iterator from './Iterator'
import { Layer } from './Layer'

async function _run(
  iterator: Iterator<any> | AsyncIterator<any>,
  layer: Layer<never, any>,
) {
  let next = await iterator.next()
  while (!next.done) {
    if (!$Effect.is(next.value)) {
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
        $Function.is(handler)
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
      next = await iterator.next($Iterator.is(a) ? await _run(a, layer) : a)
    } catch (error) {
      if (iterator.throw === undefined) {
        throw error
      }

      next = await iterator.throw(
        $Iterator.is(error) ? await _run(error, layer) : error,
      )
    }
  }

  return next.value
}

export async function run<G extends Generator | AsyncGenerator>(
  effector: G | (() => G),
  layer: Layer<
    never,
    $Generator.YOf<G> extends infer U extends Use<any> ? $Effect.ROf<U> : never
  >,
): Promise<$Generator.ROf<G>> {
  return _run($Iterator.is(effector) ? effector : effector(), layer)
}
