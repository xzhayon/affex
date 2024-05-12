import { AnyEffector } from './Effector'
import * as $Generator from './Generator'
import { OrLazy } from './Type'
import * as $Fork from './effect/Fork'
import * as $Join from './effect/Join'

export function* all<G extends AnyEffector<any, any, any>>(
  effectors: ReadonlyArray<OrLazy<G>>,
) {
  return yield* $Generator.traverse(
    yield* $Generator.traverse(effectors, $Fork.fork),
    $Join.join,
  )
}
