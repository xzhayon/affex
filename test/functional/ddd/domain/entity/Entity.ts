import { perform } from 'fx'
import * as Id from '../valueObject/Id'

export interface Entity {
  readonly _id: Id.Id
}

export type IdOf<A extends Entity> = A['_id']

export function* entity() {
  return { _id: yield* perform(Id.random()) }
}
