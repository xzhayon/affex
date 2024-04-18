import { Equal } from '@type-challenges/utils'
import * as X from './Effect'
import { Use } from './Effect'
import * as Ef from './Effector'
import { Effector } from './Effector'
import * as Er from './Error'
import { NullError, Throw } from './Error'
import * as F from './Function'
import * as G from './Generator'
import { Generated } from './Generator'
import * as L from './Layer'
import * as S from './Struct'
import * as T from './Tag'
import { URI } from './Type'

export interface Fork {
  readonly [URI]?: unique symbol
  <R = never, E = never>(): <
    F extends (
      run: <
        G extends
          | Generator<
              R extends any
                ? Equal<R, never> extends true
                  ? never
                  : Use<R>
                : never,
              any,
              Equal<E, never> extends true ? Throw<NullError> : Throw<E>
            >
          | AsyncGenerator<
              R extends any
                ? Equal<R, never> extends true
                  ? never
                  : Use<R>
                : never,
              any,
              Equal<E, never> extends true ? Throw<NullError> : Throw<E>
            >,
      >(
        effector: G | (() => G),
      ) => Promise<Generated<Awaited<G.ROf<G>>>>,
    ) => any,
  >(
    f: F,
  ) => ReturnType<F> extends infer G extends Generator | AsyncGenerator
    ? Generator<
        | (R extends any
            ? Equal<R, never> extends true
              ? never
              : Use<R>
            : never)
        | G.YOf<G>,
        Generated<Awaited<G.ROf<G>>>,
        (Equal<E, never> extends true ? Throw<NullError> : Throw<E>) | G.NOf<G>
      >
    : Generator<
        R extends any ? (Equal<R, never> extends true ? never : Use<R>) : never,
        Generated<Awaited<ReturnType<F>>>,
        Equal<E, never> extends true ? Throw<NullError> : Throw<E>
      >
}

export const tag = T.tag<Fork>('Fork')

export function fork<R = never, E = never>() {
  return <
    F extends (
      run: <
        G extends
          | Generator<
              R extends any
                ? Equal<R, never> extends true
                  ? never
                  : Use<R>
                : never,
              any,
              Equal<E, never> extends true ? Throw<NullError> : Throw<E>
            >
          | AsyncGenerator<
              R extends any
                ? Equal<R, never> extends true
                  ? never
                  : Use<R>
                : never,
              any,
              Equal<E, never> extends true ? Throw<NullError> : Throw<E>
            >,
      >(
        effector: G | (() => G),
      ) => Promise<Generated<Awaited<G.ROf<G>>>>,
    ) => any,
  >(
    f: F,
  ): ReturnType<F> extends infer G extends Generator | AsyncGenerator
    ? Effector<
        R | G.YOf<G> extends infer U extends Use<any> ? X.ROf<U> : never,
        Generated<Awaited<G.ROf<G>>>,
        E | (G.NOf<G> extends infer T extends Throw<any> ? Er.EOf<T> : never)
      >
    : Effector<R, Generated<Awaited<ReturnType<F>>>, E> =>
    Ef.functionA(tag)((r) => r<R>()(f as any)) as any
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
