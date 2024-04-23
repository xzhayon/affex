import { Equal } from '@type-challenges/utils'
import { Throw } from './Effector'
import { NullError } from './Error'
import { Function } from './Function'
import { AnyGenerator, Generated } from './Generator'
import * as $Result from './Result'
import { Result, Resulted } from './Result'
import { Struct } from './Struct'

export type Handler<R> = R extends Function
  ? FunctionHandler<R>
  : R extends Struct
  ? StructHandler<R>
  : never

type FunctionHandler<R extends Function> = (
  ...args: Parameters<R>
) => ReturnTypeHandler<Awaited<Generated<ReturnType<R>>>>

type StructHandler<R extends Struct> = {
  [K in keyof R as R[K] extends Function ? K : never]: R[K] extends Function
    ? FunctionHandler<R[K]>
    : never
}

type ReturnTypeHandler<A> =
  | Resulted<A>
  | Promise<Resulted<A>>
  | AnyGenerator<
      any,
      Resulted<A>,
      A extends Result<any, any>
        ? $Result.EOf<A> extends infer E
          ? Equal<E, never> extends false
            ? Throw<E>
            : Throw<NullError>
          : never
        : Throw<NullError>
    >
