export function skipTick() {
  return new Promise<void>((resolve) =>
    setImmediate !== undefined ? setImmediate(resolve) : setTimeout(resolve, 0),
  )
}
