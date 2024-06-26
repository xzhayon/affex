import { fx } from 'affex'
import crypto from 'crypto'
import { tag } from '../../domain/valueObject/Id'

export function CryptoUuid() {
  return fx.layer(tag, crypto.randomUUID)
}
