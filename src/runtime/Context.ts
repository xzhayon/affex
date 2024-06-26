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

  readonly do = function (this: Context<any>): Context<A, R> {
    return this
  }

  readonly merge = <_A, _R>(context: Context<_A, _R>) => {
    context.layers.forEach((layer, tag) => {
      this.layers.set(tag, layer)
    })

    return this as Context<A | _A, Exclude<R | _R, A | _A>>
  }

  readonly with = <_A, _R>(layer: Layer<_A, _R>) => {
    this.layers.set(layer.tag, layer)

    return this as Context<A | _A, Exclude<R | _R, A | _A>>
  }

  readonly handler = <_A extends A>(tag: Tag<_A>) => {
    const layer = this.layers.get(tag)
    if (layer === undefined) {
      throw new MissingLayerError(tag)
    }

    return layer.handler as Handler<_A>
  }
}

export const context = Context.empty
