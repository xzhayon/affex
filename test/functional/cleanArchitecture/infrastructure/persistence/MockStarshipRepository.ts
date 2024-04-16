import * as fx from 'fx'
import { Handler } from '../../../../../src/Handler'
import { debug } from '../../application/log/Log'
import { StarshipRepository } from '../../application/persistence/StarshipRepository'
import * as Id from '../../domain/valueObject/Id'

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
      return { _id, externalId: yield* Id.random(), searchTerms: [] }
    })
  },
  *findOneById(_id) {
    return { _id, externalId: yield* Id.random(), searchTerms: [] }
  },
  *findOneByExternalId(externalId) {
    return { _id: yield* Id.random(), externalId, searchTerms: [] }
  },
  *findOneBySearchTerm(searchTerm) {
    return {
      _id: yield* Id.random(),
      externalId: yield* Id.random(),
      searchTerms: [searchTerm],
    }
  },
  *upsertMany(starships) {
    yield* debug('Starships upsertion mocked', {
      starshipCount: starships.length,
    })
  },
  *upsertOne(starship) {
    yield* debug('Starship upsertion mocked', { starshipId: starship._id })
  },
} satisfies Handler<StarshipRepository>
