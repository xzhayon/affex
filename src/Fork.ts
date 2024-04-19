import { Equal } from '@type-challenges/utils'
import * as $Effect from './Effect'
import { Use } from './Effect'
import * as $Effector from './Effector'
import { Effector } from './Effector'
import * as $Error from './Error'
import { NullError, Throw } from './Error'
import * as $Function from './Function'
import * as $Generator from './Generator'
import { Generated } from './Generator'
import * as $Layer from './Layer'
import * as $Struct from './Struct'
import * as $Tag from './Tag'
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
      ) => Promise<Generated<Awaited<$Generator.ROf<G>>>>,
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
        | $Generator.YOf<G>,
        Generated<Awaited<$Generator.ROf<G>>>,
        | (Equal<E, never> extends true ? Throw<NullError> : Throw<E>)
        | $Generator.NOf<G>
      >
    : Generator<
        R extends any ? (Equal<R, never> extends true ? never : Use<R>) : never,
        Generated<Awaited<ReturnType<F>>>,
        Equal<E, never> extends true ? Throw<NullError> : Throw<E>
      >
}

export const tag = $Tag.tag<Fork>('Fork')

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
      ) => Promise<Generated<Awaited<$Generator.ROf<G>>>>,
    ) => any,
  >(
    f: F,
  ): ReturnType<F> extends infer G extends Generator | AsyncGenerator
    ? Effector<
        R | $Generator.YOf<G> extends infer U extends Use<any>
          ? $Effect.ROf<U>
          : never,
        Generated<Awaited<$Generator.ROf<G>>>,
        | E
        | ($Generator.NOf<G> extends infer T extends Throw<any>
            ? $Error.EOf<T>
            : never)
      >
    : Effector<R, Generated<Awaited<ReturnType<F>>>, E> =>
    $Effector.functionA(tag)((r) => r<R>()(f as any)) as any
}

export function ContextAwareFork() {
  return $Layer
    .layer()
    .with(
      tag,
      function (this: {
        run: <G extends Generator | AsyncGenerator>(
          effector: G | (() => G),
        ) => Promise<Generated<Awaited<$Generator.ROf<G>>>>
      }) {
        const context = this
        if (
          !$Struct.is(context) ||
          !$Struct.has(context, 'run') ||
          !$Function.is(context.run)
        ) {
          throw new Error(
            `Cannot access context from "${tag.key.description}" handler`,
          )
        }

        return <
          F extends (
            run: <G extends Generator | AsyncGenerator>(
              effector: G | (() => G),
            ) => Promise<Generated<Awaited<$Generator.ROf<G>>>>,
          ) => any,
        >(
          f: F,
        ) => f(context.run)
      },
    )
}
