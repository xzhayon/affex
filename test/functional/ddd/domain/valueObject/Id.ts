import * as fx from 'fx'

export type Id = string

export interface RandomId {
  readonly [fx.URI]?: unique symbol
  (): Id
}

export const tag = fx.tag<RandomId>()
export const random = fx.function(tag)
