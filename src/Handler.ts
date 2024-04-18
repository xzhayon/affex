import { NullError, Throw } from './Error'
import { Function } from './Function'
import { Generated } from './Generator'
import { Struct } from './Struct'

type ConstantHandler<A> =
  | Exclude<A, Error>
  | Promise<Exclude<A, Error>>
  | Generator<
      unknown,
      Exclude<A, Error>,
      A extends Error ? Throw<A> : Throw<NullError>
    >
  | AsyncGenerator<
      unknown,
      Exclude<A, Error>,
      A extends Error ? Throw<A> : Throw<NullError>
    >
type FunctionHandler<R extends Function> = (
  ...args: Parameters<R>
) => ConstantHandler<Generated<Awaited<ReturnType<R>>>>
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
