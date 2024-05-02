import { fx } from 'affex'
import { tag } from '../../application/query/GetCharacterByNameQuery'
import { id } from '../../domain/valueObject/Id'

export function MockGetCharacterByNameQuery() {
  return fx.layer().with(tag, function* (name) {
    return { name, starshipUrls: [yield* id()], url: yield* id() }
  })
}
