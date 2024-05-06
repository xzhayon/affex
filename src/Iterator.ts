function _yield(): IteratorResult<void, never>
function _yield<A>(value: A): IteratorResult<A, never>
function _yield<A>(value?: A): IteratorResult<A | void, never> {
  return { value }
}
export { _yield as yield }

function _return(): IteratorResult<never, void>
function _return<A>(value: A): IteratorResult<never, A>
function _return<A>(value?: A): IteratorResult<never, A | void> {
  return { done: true, value }
}
export { _return as return }
