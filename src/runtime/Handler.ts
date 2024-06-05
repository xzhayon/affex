import { AnyEffector, ErrorOf } from '../Effector'
import { Function } from '../Function'
import { AnyGenerator, Generated } from '../Generator'
import { Struct } from '../Struct'

export type Handler<A> = A extends Function
  ? FunctionHandler<A>
  : A extends Struct
  ? StructHandler<A>
  : never

type FunctionHandler<A extends Function> = (
  ...args: Parameters<A>
) => Awaited<Generated<ReturnType<A>>> extends infer _A
  ?
      | _A
      | Promise<_A>
      | AnyEffector<
          _A,
          ReturnType<A> extends infer G extends AnyGenerator
            ? ErrorOf<G>
            : never,
          any
        >
  : never

type StructHandler<A extends Struct> = {
  [K in keyof A as A[K] extends Function ? K : never]: A[K] extends Function
    ? FunctionHandler<A[K]>
    : never
}
