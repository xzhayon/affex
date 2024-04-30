import { AnyEffector } from './Effector'
import { Function } from './Function'
import { Generated } from './Generator'
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
) => ReturnHandler<Awaited<Generated<ReturnType<R>>>>

type StructHandler<R extends Struct> = {
  [K in keyof R as R[K] extends Function ? K : never]: R[K] extends Function
    ? FunctionHandler<R[K]>
    : never
}

type ReturnHandler<A> =
  | Resulted<A>
  | Promise<Resulted<A>>
  | AnyEffector<
      Resulted<A>,
      A extends Result<any, any> ? $Result.EOf<A> : never,
      any
    >
