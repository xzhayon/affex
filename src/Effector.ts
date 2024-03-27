import { Has } from './Has'

export type Effector<R, A> = Generator<R extends any ? Has<R> : never, A, any>
