import * as $Function from './Function'
import * as $Struct from './Struct'

export function is(
  u: unknown,
): u is Iterator<unknown> | AsyncIterator<unknown> {
  return $Struct.is(u) && $Struct.has(u, 'next') && $Function.is(u.next)
}
