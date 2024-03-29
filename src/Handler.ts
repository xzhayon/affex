import { Function } from './Function'
import { Layer } from './Layer'
import { Struct } from './Struct'

type ConstantHandler<R> = R | Promise<R> | Generator<any, R, any>
type FunctionHandler<R extends Function> = (
  ...args: Parameters<R>
) => ConstantHandler<Awaited<ReturnType<R>>>
type StructHandler<R extends Struct> = {
  [K in keyof R as R[K] extends Function ? K : never]: R[K] extends Function
    ? FunctionHandler<R[K]>
    : never
}

export type Handler<R> = R extends Function
  ? FunctionHandler<R>
  : R extends Struct
  ? StructHandler<R>
  : never

export function layer() {
  return Layer.empty()
}
