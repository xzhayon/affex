import { fx } from 'affex'
import { tag } from '../../application/query/GetStarshipByNameQuery'
import { id } from '../../domain/valueObject/Id'

export function MockGetStarshipByNameQuery() {
  return fx.layer(tag, function* (name) {
    return { name, url: yield* id() }
  })
}
