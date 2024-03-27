import { perform } from 'fx'
import { Handler } from '../../../../../src/Handler'
import { CharacterRepository } from '../../application/persistence/CharacterRepository'
import * as Id from '../../domain/valueObject/Id'
import { debug } from '../../kernel/Log'

export const {
  findOneById,
  findOneByExternalId,
  findOneBySearchTerm,
  upsertOne,
} = {
  *findOneById(_id) {
    return {
      _id,
      externalId: yield* perform(Id.random()),
      starshipIds: [yield* perform(Id.random())],
      searchTerms: [],
    }
  },
  *findOneByExternalId(externalId) {
    return {
      _id: yield* perform(Id.random()),
      externalId,
      starshipIds: [yield* perform(Id.random())],
      searchTerms: [],
    }
  },
  *findOneBySearchTerm(searchTerm) {
    return {
      _id: yield* perform(Id.random()),
      externalId: yield* perform(Id.random()),
      starshipIds: [yield* perform(Id.random())],
      searchTerms: [searchTerm],
    }
  },
  *upsertOne(character) {
    yield* perform(
      debug('Character upsertion mocked', { characterId: character._id }),
    )
  },
} satisfies Handler<CharacterRepository>
