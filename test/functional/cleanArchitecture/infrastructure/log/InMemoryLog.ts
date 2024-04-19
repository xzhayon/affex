import { fx } from 'fx'
import { Severity, tag } from '../../application/log/Log'

function _log(
  severity: Severity,
  log: {
    readonly severity: Severity
    readonly message: string
    readonly context?: Readonly<Record<string, unknown>>
  }[],
) {
  return (message: string, context?: Readonly<Record<string, unknown>>) => {
    log.push({ severity, message, context })
  }
}

export function InMemoryLog(
  log: {
    readonly severity: Severity
    readonly message: string
    readonly context?: Readonly<Record<string, unknown>>
  }[] = [],
) {
  return fx.layer().with(tag, {
    debug: _log('debug', log),
    info: _log('info', log),
    notice: _log('notice', log),
    warning: _log('warning', log),
    error: _log('error', log),
    critical: _log('critical', log),
    alert: _log('alert', log),
    emergency: _log('emergency', log),
  })
}
