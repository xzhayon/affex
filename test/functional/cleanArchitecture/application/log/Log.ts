import { fx } from 'fx'

export type Severity =
  | 'debug'
  | 'info'
  | 'notice'
  | 'warning'
  | 'error'
  | 'critical'
  | 'alert'
  | 'emergency'

export type Log = {
  readonly [K in Severity]: (
    message: string,
    context?: Readonly<Record<string, unknown>>,
  ) => void
}

export const tag = fx.tag<Log>()
export const Log = fx.struct(tag)(
  'debug',
  'info',
  'notice',
  'warning',
  'error',
  'critical',
  'alert',
  'emergency',
)
