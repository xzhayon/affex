import { Handler } from '../../../../../src/Handler'
import { Log, Severity } from '../../application/log/Log'

function _log(
  severity: Severity,
  log: Array<{
    readonly severity: Severity
    readonly message: string
    readonly context?: Readonly<Record<string, unknown>>
  }>,
) {
  return (message: string, context?: Readonly<Record<string, unknown>>) => {
    log.push({ severity, message, context })
  }
}

export function inMemoryLog(
  log: Array<{
    readonly severity: Severity
    readonly message: string
    readonly context?: Readonly<Record<string, unknown>>
  }> = [],
) {
  return {
    debug: _log('debug', log),
    info: _log('info', log),
    notice: _log('notice', log),
    warning: _log('warning', log),
    error: _log('error', log),
    critical: _log('critical', log),
    alert: _log('alert', log),
    emergency: _log('emergency', log),
  } satisfies Handler<Log>
}
