import * as Ef from './Effect'
import { Use } from './Effect'
import * as Er from './Error'
import { Raise } from './Error'
import * as F from './Fork'
import { Fork } from './Fork'
import { Function } from './Function'
import { Handler } from './Handler'
import { Struct } from './Struct'
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
    tag: Tag<_R>,
    handler: H,
  ): Layer<
    Exclude<
      | Exclude<R, _R>
      | (H extends Function
          ? ReturnType<H> extends
              | Generator<infer E extends Use<any>>
              | AsyncGenerator<infer E extends Use<any>>
            ? Exclude<Ef.ROf<E>, A>
            : never
          : H extends Struct
          ? {
              [K in keyof H]: H[K] extends Function
                ? ReturnType<H[K]> extends
                    | Generator<infer E extends Use<any>>
                    | AsyncGenerator<infer E extends Use<any>>
                  ? Exclude<Ef.ROf<E>, A>
                  : never
                : H[K] extends
                    | Generator<infer E extends Use<any>>
                    | AsyncGenerator<infer E extends Use<any>>
                ? Exclude<Ef.ROf<E>, A>
                : never
            }[keyof H]
          : H extends
              | Generator<infer E extends Use<any>>
              | AsyncGenerator<infer E extends Use<any>>
          ? Exclude<Ef.ROf<E>, A>
          : never),
      Fork | Raise<any>
    >,
    _R | A
  >
  with<_R, _A>(
    layer: Layer<_R, _A>,
  ): Layer<Exclude<_R | R, _A | A | Fork | Raise<any>>, _A | A>
  with(tagOrLayer: Tag<unknown> | Layer<any, any>, handler?: any) {
    this.handlers = {
      ...this.handlers,
      ...(tagOrLayer instanceof Layer
        ? tagOrLayer.handlers
        : { [tagOrLayer.key]: handler }),
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

export function layer() {
  return Layer.empty()
}

function _default() {
  return layer().with(Er.ExceptionRaise()).with(F.ContextAwareFork())
}
export { _default as default }
