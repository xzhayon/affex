import * as E from './Effect'
import { Effect } from './Effect'
import { Function } from './Function'
import * as G from './Generator'
import { Handler } from './Handler'
import * as I from './Iterator'
import { Struct } from './Struct'
import { Tag } from './Tag'

const R = Symbol()
export class Builder<R, A, S = never> {
  private readonly [R]!: R
  private readonly handlers: Record<symbol, Handler<any>> = {}

  static create<G extends Generator>(generator: G) {
    return new Builder<
      G.YOf<G> extends infer E
        ? E extends Effect<any, any>
          ? E.ROf<E>
          : never
        : never,
      G.ROf<G>
    >(generator)
  }

  private constructor(private readonly generator: Generator) {}

  with<_R, H extends Handler<_R>>(
    { key }: Tag<_R>,
    handler: H,
  ): Builder<
    | Exclude<R, _R>
    | (H extends Function
        ? ReturnType<H> extends Generator<infer E extends Effect<any, any>>
          ? Exclude<E.ROf<E>, S>
          : never
        : H extends Struct
        ? {
            [K in keyof H]: H[K] extends Function
              ? ReturnType<H[K]> extends Generator<
                  infer E extends Effect<any, any>
                >
                ? Exclude<E.ROf<E>, S>
                : never
              : H[K] extends Generator<infer E extends Effect<any, any>>
              ? Exclude<E.ROf<E>, S>
              : never
          }[keyof H]
        : H extends Generator<infer E extends Effect<any, any>>
        ? Exclude<E.ROf<E>, S>
        : never),
    A,
    _R | S
  > {
    this.handlers[key] = handler

    return this as any
  }

  async build(this: Builder<never, A, S>): Promise<A> {
    return this._build(this.generator)
  }

  private async _build(
    this: Builder<never, A, S>,
    iterator: Iterator<any>,
  ): Promise<any> {
    let next = iterator.next()
    while (!next.done) {
      if (!E.is(next.value)) {
        next = iterator.next()

        continue
      }

      const effect: Effect<any, any> = next.value
      if (!(effect.key in this.handlers)) {
        throw new Error(
          `Cannot find handler for effect${
            effect.key.description ? ` "${effect.key.description}"` : ''
          }`,
        )
      }

      const handler = this.handlers[effect.key]
      const a = await effect.f(handler)
      next = iterator.next(I.is(a) ? await this._build(a) : a)
    }

    return next.value
  }
}
