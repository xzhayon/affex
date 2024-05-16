import { fx } from 'affex'
import { Log } from '../../application/log/Log'
import { tag } from '../../application/persistence/CharacterRepository'
import { id } from '../../domain/valueObject/Id'

export function MockCharacterRepository() {
  return fx.layer(tag, {
    *findOneById(_id) {
      return {
        _id,
        externalId: yield* id(),
        starshipIds: [yield* id()],
        searchTerms: [],
      }
    },
    *findOneByExternalId(externalId) {
      return {
        _id: yield* id(),
        externalId,
        starshipIds: [yield* id()],
        searchTerms: [],
      }
    },
    *findOneBySearchTerm(searchTerm) {
      return {
        _id: yield* id(),
        externalId: yield* id(),
        starshipIds: [yield* id()],
        searchTerms: [searchTerm],
      }
    },
    *upsertOne(character) {
      yield* Log.debug('Character upsertion mocked', {
        characterId: character._id,
      })
    },
  })
}
