import { ContextOf } from './Effector'
import { Function } from './Function'
import { AnyGenerator } from './Generator'
import { Handler } from './Handler'
import { Struct } from './Struct'
import { Tag } from './Tag'
import { Contravariant, Covariant } from './Type'

const R = Symbol()
const A = Symbol()
export class Layer<R, A> {
  readonly [R]!: Covariant<R>;
  readonly [A]!: Contravariant<A>
  private handlers: Readonly<Record<symbol, Handler<any>>> = {}

  static readonly empty = () => new Layer<never, never>()

  private constructor() {}

  with<_A, H extends Handler<_A>>(
    tag: Tag<_A>,
    handler: H,
  ): Layer<
    Exclude<
      | R
      | (H extends Function
          ? ReturnType<H> extends infer G extends AnyGenerator
            ? ContextOf<G>
            : never
          : H extends Struct
          ? {
              [K in keyof H]: H[K] extends Function
                ? ReturnType<H[K]> extends infer G extends AnyGenerator
                  ? ContextOf<G>
                  : never
                : never
            }[keyof H]
          : never),
      A | _A
    >,
    A | _A
  >
  with<_R, _A>(layer: Layer<_R, _A>): Layer<Exclude<R | _R, A | _A>, A | _A>
  with(tagOrLayer: Tag<any> | Layer<any, any>, handler?: any) {
    this.handlers = {
      ...this.handlers,
      ...(is(tagOrLayer) ? tagOrLayer.handlers : { [tagOrLayer.key]: handler }),
    }

    return this as any
  }

  readonly do = function (this: Layer<never, A>) {
    return this
  }

  readonly handler = <_A extends A>({ key }: Tag<_A>): Handler<_A> => {
    const handler = this.handlers[key]
    if (handler === undefined) {
      throw new Error(
        `Cannot find handler for effect${
          key.description ? ` "${key.description}"` : ''
        }`,
      )
    }

    return handler as any
  }
}

export function layer() {
  return Layer.empty()
}

export function is(u: unknown): u is Layer<unknown, unknown> {
  return u instanceof Layer
}
