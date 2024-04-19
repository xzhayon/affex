import * as $Cause from './Cause'
import * as $Effect from './Effect'
import { Effect, Use } from './Effect'
import * as $Error from './Error'
import { Throw, UnexpectedError } from './Error'
import * as $Exit from './Exit'
import { Exit } from './Exit'
import * as $Function from './Function'
import * as $Generator from './Generator'
import * as $Iterator from './Iterator'
import { Layer } from './Layer'

class Fiber {
  async run(
    iterator: Iterator<any> | AsyncIterator<any>,
    layer: Layer<never, any>,
  ): Promise<Exit<any, any>> {
    let next: IteratorResult<any, any> = { value: undefined }
    while (!next.done) {
      try {
        if (!$Effect.is(next.value)) {
          next = await iterator.next()

          continue
        }

        const { tag, f }: Effect<any, any, any> = next.value
        const handler: any = layer.handler(tag)
        if (handler === undefined) {
          throw new UnexpectedError(
            `Cannot find handler for effect${
              tag.key.description ? ` "${tag.key.description}"` : ''
            }`,
          )
        }

        let a = await f(
          $Function.is(handler)
            ? handler.bind({
                run: <G extends Generator | AsyncGenerator>(
                  effector: G | (() => G),
                ) => run<G>(effector, layer),
              })
            : handler,
        )
        if ($Iterator.is(a)) {
          const exit = await this.run(a, layer)
          if ($Exit.isFailure(exit)) {
            if ($Cause.isUnexpected(exit.cause)) {
              return exit
            }

            throw exit.cause.error
          }

          a = exit.value
        }

        next = await iterator.next(a)
      } catch (error) {
        try {
          if (error instanceof UnexpectedError) {
            throw error
          }

          if (iterator.throw === undefined) {
            throw new UnexpectedError('Cannot recover from error', {
              cause: error,
            })
          }

          next = await iterator.throw(error)
        } catch (_error) {
          if (_error instanceof UnexpectedError) {
            return $Exit.failure($Cause.unexpected(_error))
          }

          return $Exit.failure($Cause.expected(_error))
        }
      }
    }

    return $Exit.success(next.value)
  }
}

export async function run<G extends Generator | AsyncGenerator>(
  effector: G | (() => G),
  layer: Layer<
    never,
    $Generator.YOf<G> extends infer U extends Use<any> ? $Effect.ROf<U> : never
  >,
): Promise<
  Exit<
    $Generator.ROf<G>,
    $Generator.NOf<G> extends infer T extends Throw<any> ? $Error.EOf<T> : never
  >
> {
  return new Fiber().run($Iterator.is(effector) ? effector : effector(), layer)
}
