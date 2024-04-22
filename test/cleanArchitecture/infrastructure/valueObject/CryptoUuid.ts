import crypto from 'crypto'
import { fx } from 'fx'
import { tag } from '../../domain/valueObject/Id'

export function CryptoUuid() {
  return fx.layer().with(tag, crypto.randomUUID)
}
