import * as E from './Effect'
import { Effect } from './Effect'
import { Function } from './Function'
import { Handler } from './Handler'
import { Struct } from './Struct'
import * as T from './Tag'
import { Tag } from './Tag'

const R = Symbol()
const A = Symbol()
export class Layer<R, A> {
  readonly [R]!: R;
  readonly [A]!: (a: A) => any
  private handlers: Readonly<Record<symbol, Handler<any>>> = {}

  static empty() {
    return new Layer<never, never>()
  }

  private constructor() {}

  with<_R, H extends Handler<_R>>(
    tag: Tag<_R> | { tag: Tag<_R> },
    handler: H,
  ): Layer<
    | Exclude<R, _R>
    | (H extends Function
        ? ReturnType<H> extends Generator<infer E extends Effect<any, any>>
          ? Exclude<E.ROf<E>, A>
          : never
        : H extends Struct
        ? {
            [K in keyof H]: H[K] extends Function
              ? ReturnType<H[K]> extends Generator<
                  infer E extends Effect<any, any>
                >
                ? Exclude<E.ROf<E>, A>
                : never
              : H[K] extends Generator<infer E extends Effect<any, any>>
              ? Exclude<E.ROf<E>, A>
              : never
          }[keyof H]
        : H extends Generator<infer E extends Effect<any, any>>
        ? Exclude<E.ROf<E>, A>
        : never),
    _R | A
  >
  with<_R, _A>(layer: Layer<_R, _A>): Layer<Exclude<_R | R, _A | A>, _A | A>
  with(
    tagOrLayer: Tag<unknown> | { tag: Tag<any> } | Layer<any, any>,
    handler?: any,
  ) {
    this.handlers = {
      ...this.handlers,
      ...(tagOrLayer instanceof Layer
        ? tagOrLayer.handlers
        : {
            [T.is(tagOrLayer) ? tagOrLayer.key : tagOrLayer.tag.key]: handler,
          }),
    }

    return this as any
  }

  do(this: Layer<never, A>) {
    return this
  }

  handler<_R extends A>({ key }: Tag<_R>): Handler<_R> {
    return this.handlers[key] as any
  }
}
