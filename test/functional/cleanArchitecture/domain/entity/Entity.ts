import { Id, id } from '../valueObject/Id'

export interface Entity {
  readonly _id: Id
}

export type IdOf<A extends Entity> = A['_id']

export function* entity() {
  return { _id: yield* id() }
}
