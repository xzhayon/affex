import { perform } from 'fx'
import { Handler } from '../../../../../src/Handler'
import { StarshipRepository } from '../../application/persistence/StarshipRepository'
import {
  CharaterExternalId,
  CharaterSearchTerm,
} from '../../domain/entity/Character'
import { IdOf } from '../../domain/entity/Entity'
import { Starship } from '../../domain/entity/Starship'
import { debug } from '../../kernel/Log'

interface StarshipStorage {
  byId?: Record<IdOf<Starship>, Starship | undefined>
  byExternalId?: Record<CharaterExternalId, Starship | undefined>
  bySearchTerm?: Record<CharaterSearchTerm, Starship | undefined>
}

export function inMemoryStarshipRepository(storage: StarshipStorage = {}) {
  return {
    *findManyById(ids) {
      const starships = ids
        .map((id) => storage.byId?.[id])
        .filter((starship): starship is Starship => starship !== undefined)
      starships.length === 0
        ? yield* perform(
            debug('Starships not found', { starshipIdCount: ids.length }),
          )
        : yield* perform(
            debug('Starships found', {
              starshipCount: starships.length,
              starshipIdCount: ids.length,
            }),
          )

      return starships
    },
    *findOneById(id) {
      const starship = storage.byId?.[id]
      starship === undefined
        ? yield* perform(debug('Starship not found', { starshipId: id }))
        : yield* perform(debug('Starship found', { starshipId: starship._id }))

      return starship
    },
    *findOneByExternalId(externalId) {
      const starship = storage.byExternalId?.[externalId]
      starship === undefined
        ? yield* perform(
            debug('Starship not found', { starshipExternalId: externalId }),
          )
        : yield* perform(
            debug('Starship found', {
              starshipId: starship._id,
              starshipExternalId: starship.externalId,
            }),
          )

      return starship
    },
    *findOneBySearchTerm(searchTerm) {
      const starship = storage.bySearchTerm?.[searchTerm]
      starship === undefined
        ? yield* perform(
            debug('Starship not found', { starshipSearchTerm: searchTerm }),
          )
        : yield* perform(
            debug('Starship found', {
              starshipId: starship._id,
              starshipSearchTerm: searchTerm,
            }),
          )

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
      yield* perform(
        debug('Starships upserted', { starshipCount: starships.length }),
      )
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
      yield* perform(debug('Starship upserted', { starshipId: starship._id }))
    },
  } satisfies Handler<StarshipRepository>
}
