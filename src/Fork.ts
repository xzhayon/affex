import * as E from './Effector'
import * as F from './Function'
import * as G from './Generator'
import { Generated } from './Generator'
import { Has } from './Has'
import * as L from './Layer'
import * as S from './Struct'
import * as T from './Tag'
import { URI } from './Type'

export interface Fork {
  readonly [URI]?: unique symbol
  <R = never>(): <
    F extends (
      run: <
        G extends
          | Generator<
              R extends infer _R ? (_R extends never ? never : Has<_R>) : never
            >
          | AsyncGenerator<
              R extends infer _R ? (_R extends never ? never : Has<_R>) : never
            >,
      >(
        effector: G | (() => G),
      ) => Promise<Generated<Awaited<G.ROf<G>>>>,
    ) => any,
  >(
    f: F,
  ) => ReturnType<F> extends infer G extends Generator | AsyncGenerator
    ? Generator<
        | (R extends infer _R ? (_R extends never ? never : Has<_R>) : never)
        | G.YOf<G>,
        Generated<Awaited<G.ROf<G>>>
      >
    : Generator<
        R extends infer _R ? (_R extends never ? never : Has<_R>) : never,
        Generated<Awaited<ReturnType<F>>>
      >
}

export const tag = T.tag<Fork>('Fork')

export function fork<R = never>() {
  return <
    F extends (
      run: <
        G extends
          | Generator<
              R extends infer _R ? (_R extends never ? never : Has<_R>) : never
            >
          | AsyncGenerator<
              R extends infer _R ? (_R extends never ? never : Has<_R>) : never
            >,
      >(
        effector: G | (() => G),
      ) => Promise<Generated<Awaited<G.ROf<G>>>>,
    ) => any,
  >(
    f: F,
  ) => E.functionA(tag)((r) => r<R>()(f))
}

export function ContextAwareFork() {
  return L.layer().with(
    tag,
    function (this: {
      run: <G extends Generator | AsyncGenerator>(
        effector: G | (() => G),
      ) => Promise<Generated<Awaited<G.ROf<G>>>>
    }) {
      const context = this
      if (!S.is(context) || !S.has(context, 'run') || !F.is(context.run)) {
        throw new Error(
          `Cannot access context from "${tag.key.description}" handler`,
        )
      }

      return <
        F extends (
          run: <G extends Generator | AsyncGenerator>(
            effector: G | (() => G),
          ) => Promise<Generated<Awaited<G.ROf<G>>>>,
        ) => any,
      >(
        f: F,
      ) => f(context.run)
    },
  )
}
