function _yield(): IteratorYieldResult<void>
function _yield<A>(value: A): IteratorYieldResult<A>
function _yield<A>(value?: A): IteratorYieldResult<A | void> {
  return { value }
}
export { _yield as yield }

function _return(): IteratorReturnResult<void>
function _return<A>(value: A): IteratorReturnResult<A>
function _return<A>(value?: A): IteratorReturnResult<A | void> {
  return { done: true, value }
}
export { _return as return }
