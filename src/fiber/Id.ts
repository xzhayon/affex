export type Id = string

const _id = (function* () {
  for (let i = 0; true; i++) {
    yield `#${i}`
  }
})()

export function id() {
  return _id.next().value
}
