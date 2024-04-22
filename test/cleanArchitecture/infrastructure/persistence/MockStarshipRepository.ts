import { fx } from 'fx'
import { Log } from '../../application/log/Log'
import { tag } from '../../application/persistence/StarshipRepository'
import { id } from '../../domain/valueObject/Id'

export function MockStarshipRepository() {
  return fx.layer().with(tag, {
    *findManyById(ids) {
      return yield* fx.all(
        ids.map(function* (_id) {
          return { _id, externalId: yield* id(), searchTerms: [] }
        }),
      )
    },
    *findOneById(_id) {
      return { _id, externalId: yield* id(), searchTerms: [] }
    },
    *findOneByExternalId(externalId) {
      return { _id: yield* id(), externalId, searchTerms: [] }
    },
    *findOneBySearchTerm(searchTerm) {
      return {
        _id: yield* id(),
        externalId: yield* id(),
        searchTerms: [searchTerm],
      }
    },
    *upsertMany(starships) {
      yield* Log.debug('Starships upsertion mocked', {
        starshipCount: starships.length,
      })
    },
    *upsertOne(starship) {
      yield* Log.debug('Starship upsertion mocked', {
        starshipId: starship._id,
      })
    },
  })
}
