import * as $Struct from './Struct'
import { Struct } from './Struct'
import { Id } from './fiber/Id'

let _tracing = false
const timestamp = new Date().valueOf()
const pad = ''

export function tracing(enabled: boolean) {
  _tracing = enabled
}

export function trace(module: string) {
  return (message: string, fiberId: Id, context?: Struct) => {
    if (!_tracing) {
      return
    }

    const elapsedTime = new Date().valueOf() - timestamp
    const _context = Object.entries(context ?? {}).filter(
      ([_, value]) => value !== undefined,
    )

    _context.length > 0
      ? console.debug(
          elapsedTime.toString().padStart(7),
          pad,
          module.padEnd(7),
          pad,
          `#${fiberId}`.padEnd(7),
          pad,
          message,
          pad,
          Object.fromEntries(
            _context.map(([key, value]) => [
              key,
              $Struct.is(value) ? value.toString() : value,
            ]),
          ),
        )
      : console.debug(
          elapsedTime.toString().padStart(7),
          pad,
          module.padEnd(7),
          pad,
          `#${fiberId}`.padEnd(7),
          pad,
          message,
        )
  }
}
