import * as fx from 'fx'
import { perform } from 'fx'
import { Handler } from '../../../../../src/Handler'
import { StarshipRepository } from '../../application/persistence/StarshipRepository'
import * as Id from '../../domain/valueObject/Id'
import { debug } from '../../kernel/Log'

export const {
  findManyById,
  findOneById,
  findOneByExternalId,
  findOneBySearchTerm,
  upsertMany,
  upsertOne,
} = {
  *findManyById(ids) {
    return yield* fx.all(ids, function* (_id) {
      return {
        _id,
        externalId: yield* perform(Id.random()),
        searchTerms: [],
      }
    })
  },
  *findOneById(_id) {
    return { _id, externalId: yield* perform(Id.random()), searchTerms: [] }
  },
  *findOneByExternalId(externalId) {
    return { _id: yield* perform(Id.random()), externalId, searchTerms: [] }
  },
  *findOneBySearchTerm(searchTerm) {
    return {
      _id: yield* perform(Id.random()),
      externalId: yield* perform(Id.random()),
      searchTerms: [searchTerm],
    }
  },
  *upsertMany(starships) {
    yield* perform(
      debug('Starships upsertion mocked', { starshipCount: starships.length }),
    )
  },
  *upsertOne(starship) {
    yield* perform(
      debug('Starship upsertion mocked', { starshipId: starship._id }),
    )
  },
} satisfies Handler<StarshipRepository>
