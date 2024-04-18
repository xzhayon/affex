import * as E from './Effect'
import { Use } from './Effect'
import * as F from './Fork'
import { Fork } from './Fork'
import { Function } from './Function'
import { Handler } from './Handler'
import * as Ra from './Raise'
import { Raise } from './Raise'
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

  with<_A, H extends Handler<_A>>(
    tag: Tag<_A>,
    handler: H,
  ): Layer<
    Exclude<
      | R
      | (H extends Function
          ? ReturnType<H> extends
              | Generator<infer U extends Use<any>>
              | AsyncGenerator<infer U extends Use<any>>
            ? E.ROf<U>
            : never
          : H extends Struct
          ? {
              [K in keyof H]: H[K] extends Function
                ? ReturnType<H[K]> extends
                    | Generator<infer U extends Use<any>>
                    | AsyncGenerator<infer U extends Use<any>>
                  ? E.ROf<U>
                  : never
                : never
            }[keyof H]
          : never),
      AOf<DefaultLayer> | A | _A
    >,
    A | _A
  >
  with<_R, _A>(
    layer: Layer<_R, _A>,
  ): Layer<Exclude<R | _R, AOf<DefaultLayer> | A | _A>, A | _A>
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

  handler<_A extends A>({ key }: Tag<_A>): Handler<_A> {
    return this.handlers[key] as any
  }
}

export type DefaultLayer = Layer<never, Fork | Raise<any>>

export type AOf<L extends Layer<any, any>> = L extends Layer<any, infer A>
  ? A
  : never

export function layer() {
  return Layer.empty()
}

function _default(): DefaultLayer {
  return layer().with(Ra.ExceptionRaise()).with(F.ContextAwareFork())
}
export { _default as default }
