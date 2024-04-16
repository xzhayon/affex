import * as E from './Effect'
import { Effect } from './Effect'
import * as F from './Fork'
import { Fork } from './Fork'
import { Function } from './Function'
import * as G from './Generator'
import { Generated } from './Generator'
import { Has } from './Has'
import * as I from './Iterator'
import * as L from './Layer'
import { Layer } from './Layer'
import { NonEmptyArray } from './NonEmptyArray'
import { Struct } from './Struct'
import { Tag } from './Tag'

export type Effector<R, A> = Generator<R extends any ? Has<R> : never, A, any>

export type AsyncEffector<R, A> = AsyncGenerator<
  R extends any ? Has<R> : never,
  A,
  any
>

export function functionA<R extends Function>(tag: Tag<R>) {
  return <A>(f: (r: R) => A) => E.perform(E.effect(tag, f))
}

function _function<R extends Function>(tag: Tag<R>) {
  return (...args: Parameters<R>) =>
    functionA(tag)((f): ReturnType<R> => f(...args))
}
export { _function as function }

export function structA<R extends Struct>(tag: Tag<R>) {
  return <
    K extends { [K in keyof R]: R[K] extends Function ? K : never }[keyof R],
  >(
    ...keys: NonEmptyArray<K>
  ) =>
    keys.reduce(
      (effects, key) => ({
        ...effects,
        [key]: <A>(f: (r: R[K]) => A) =>
          E.perform(E.effect(tag, (r) => f(r[key]))),
      }),
      {},
    ) as {
      [_K in K]: <A>(
        f: (r: R[_K]) => A,
      ) => Effector<
        | R
        | (A extends Generator | AsyncGenerator
            ? G.YOf<A> extends infer E extends Has<any>
              ? E.ROf<E>
              : never
            : never),
        Generated<Awaited<A>>
      >
    }
}

export function struct<R extends Struct>(tag: Tag<R>) {
  return <
    K extends { [K in keyof R]: R[K] extends Function ? K : never }[keyof R],
  >(
    ...keys: NonEmptyArray<K>
  ) =>
    keys.reduce(
      (effects, key) => ({
        ...effects,
        [key]: (...args: any) =>
          E.perform(E.effect(tag, (r: any) => r[key](...args))),
      }),
      {},
    ) as {
      [_K in K]: R[_K] extends Function
        ? (
            ...args: Parameters<R[_K]>
          ) => Effector<
            | R
            | (ReturnType<R[_K]> extends Generator | AsyncGenerator
                ? G.YOf<ReturnType<R[_K]>> extends infer E extends Has<any>
                  ? E.ROf<E>
                  : never
                : never),
            Generated<Awaited<ReturnType<R[_K]>>>
          >
        : never
    }
}

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
    L.layer().with(F.ContextAwareFork()).with(layer),
  )
}
