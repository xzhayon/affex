import { fx } from 'fx'
import { Log } from '../../application/log/Log'
import { tag } from '../../application/persistence/StarshipRepository'
import {
  CharaterExternalId,
  CharaterSearchTerm,
} from '../../domain/entity/Character'
import { IdOf } from '../../domain/entity/Entity'
import { Starship } from '../../domain/entity/Starship'

interface StarshipStorage {
  byId?: Record<IdOf<Starship>, Starship | undefined>
  byExternalId?: Record<CharaterExternalId, Starship | undefined>
  bySearchTerm?: Record<CharaterSearchTerm, Starship | undefined>
}

export function InMemoryStarshipRepository(storage: StarshipStorage = {}) {
  return fx.layer().with(tag, {
    *findManyById(ids) {
      const starships = ids
        .map((id) => storage.byId?.[id])
        .filter((starship): starship is Starship => starship !== undefined)
      starships.length === 0
        ? yield* Log.debug('Starships not found', {
            starshipIdCount: ids.length,
          })
        : yield* Log.debug('Starships found', {
            starshipCount: starships.length,
            starshipIdCount: ids.length,
          })

      return starships
    },
    *findOneById(id) {
      const starship = storage.byId?.[id]
      starship === undefined
        ? yield* Log.debug('Starship not found', { starshipId: id })
        : yield* Log.debug('Starship found', { starshipId: starship._id })

      return starship
    },
    *findOneByExternalId(externalId) {
      const starship = storage.byExternalId?.[externalId]
      starship === undefined
        ? yield* Log.debug('Starship not found', {
            starshipExternalId: externalId,
          })
        : yield* Log.debug('Starship found', {
            starshipId: starship._id,
            starshipExternalId: starship.externalId,
          })

      return starship
    },
    *findOneBySearchTerm(searchTerm) {
      const starship = storage.bySearchTerm?.[searchTerm]
      starship === undefined
        ? yield* Log.debug('Starship not found', {
            starshipSearchTerm: searchTerm,
          })
        : yield* Log.debug('Starship found', {
            starshipId: starship._id,
            starshipSearchTerm: searchTerm,
          })

      return starship
    },
    *upsertMany(starships) {
      starships.forEach((starship) => {
        storage.byId = { ...storage.byId, [starship._id]: starship }
        storage.byExternalId = {
          ...storage.byExternalId,
          [starship.externalId]: starship,
        }
        storage.bySearchTerm = {
          ...storage.bySearchTerm,
          ...starship.searchTerms.reduce(
            (searchTerms, searchTerm) => ({
              ...searchTerms,
              [searchTerm]: starship,
            }),
            {},
          ),
        }
      })
      yield* Log.debug('Starships upserted', {
        starshipCount: starships.length,
      })
    },
    *upsertOne(starship) {
      storage.byId = { ...storage.byId, [starship._id]: starship }
      storage.byExternalId = {
        ...storage.byExternalId,
        [starship.externalId]: starship,
      }
      storage.bySearchTerm = {
        ...storage.bySearchTerm,
        ...starship.searchTerms.reduce(
          (searchTerms, searchTerm) => ({
            ...searchTerms,
            [searchTerm]: starship,
          }),
          {},
        ),
      }
      yield* Log.debug('Starship upserted', { starshipId: starship._id })
    },
  })
}
