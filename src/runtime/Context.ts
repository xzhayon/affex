import { Tag } from '../Tag'
import { Contravariant, Covariant } from '../Type'
import { MissingLayerError } from '../error/MissingLayerError'
import { Handler } from './Handler'
import { Layer } from './Layer'

const A = Symbol()
const R = Symbol()
export class Context<in A, out R = never> {
  readonly [A]!: Contravariant<A>;
  readonly [R]!: Covariant<R>
  private layers = new Map<Tag<any>, Layer<any, any>>()

  static readonly empty = () => new Context<never>()

  private constructor() {}

  readonly do = function (this: Context<any>): Context<A> {
    return this
  }

  readonly merge = <_A, _R>(
    context: Context<_A, _R>,
  ): Context<A | _A, Exclude<R | _R, A | _A>> => {
    context.layers.forEach((layer, tag) => {
      this.layers.set(tag, layer)
    })

    return this as any
  }

  readonly with = <_A, _R>(
    layer: Layer<_A, _R>,
  ): Context<A | _A, Exclude<R | _R, A | _A>> => {
    this.layers.set(layer.tag, layer)

    return this as any
  }

  readonly handler = <_A extends A>(tag: Tag<_A>): Handler<_A> => {
    const layer = this.layers.get(tag)
    if (layer === undefined) {
      throw new MissingLayerError(tag)
    }

    return layer.handler as any
  }
}

export const context = Context.empty
