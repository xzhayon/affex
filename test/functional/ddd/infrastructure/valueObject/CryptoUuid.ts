import crypto from 'crypto'
import { Handler } from 'fx'
import { RandomId } from '../../domain/valueObject/Id'

export const random = crypto.randomUUID satisfies Handler<RandomId>
