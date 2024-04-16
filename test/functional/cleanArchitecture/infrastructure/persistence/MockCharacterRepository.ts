import { Handler } from '../../../../../src/Handler'
import { debug } from '../../application/log/Log'
import { CharacterRepository } from '../../application/persistence/CharacterRepository'
import * as Id from '../../domain/valueObject/Id'

export const {
  findOneById,
  findOneByExternalId,
  findOneBySearchTerm,
  upsertOne,
} = {
  *findOneById(_id) {
    return {
      _id,
      externalId: yield* Id.random(),
      starshipIds: [yield* Id.random()],
      searchTerms: [],
    }
  },
  *findOneByExternalId(externalId) {
    return {
      _id: yield* Id.random(),
      externalId,
      starshipIds: [yield* Id.random()],
      searchTerms: [],
    }
  },
  *findOneBySearchTerm(searchTerm) {
    return {
      _id: yield* Id.random(),
      externalId: yield* Id.random(),
      starshipIds: [yield* Id.random()],
      searchTerms: [searchTerm],
    }
  },
  *upsertOne(character) {
    yield* debug('Character upsertion mocked', { characterId: character._id })
  },
} satisfies Handler<CharacterRepository>
