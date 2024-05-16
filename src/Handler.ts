import { AnyEffector } from './Effector'
import { Function } from './Function'
import { Generated } from './Generator'
import * as $Result from './Result'
import { Result, Resulted } from './Result'
import { Struct } from './Struct'

export type Handler<A> = A extends Function
  ? FunctionHandler<A>
  : A extends Struct
  ? StructHandler<A>
  : never

type FunctionHandler<A extends Function> = (
  ...args: Parameters<A>
) => ReturnHandler<Awaited<Generated<ReturnType<A>>>>

type StructHandler<A extends Struct> = {
  [K in keyof A as A[K] extends Function ? K : never]: A[K] extends Function
    ? FunctionHandler<A[K]>
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
