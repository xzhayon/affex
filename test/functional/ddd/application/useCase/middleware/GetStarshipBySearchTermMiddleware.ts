import { perform } from 'fx'
import { Starship, StarshipSearchTerm } from '../../../domain/entity/Starship'
import { cacheStarshipSearchTerm } from '../../command/CacheStarshipSearchTermCommand'
import { createStarship } from '../../command/CreateStarshipCommand'
import * as StarshipRepository from '../../persistence/StarshipRepository'
import { getStarshipByName } from '../../query/GetStarshipByNameQuery'

export function* getStarshipBySearchTerm(
  starshipName: StarshipSearchTerm,
  starships: ReadonlyArray<Starship> = [],
) {
  let starship =
    starships.find(({ searchTerms }) => searchTerms.includes(starshipName)) ??
    (yield* perform(StarshipRepository.findOneBySearchTerm(starshipName)))
  if (starship !== undefined) {
    return starship
  }

  let starshipDto = yield* perform(getStarshipByName(starshipName))
  starship =
    starships.find(({ externalId }) => externalId === starshipDto.url) ??
    (yield* perform(StarshipRepository.findOneByExternalId(starshipDto.url))) ??
    (yield* createStarship(starshipDto.url))

  const newStarship = yield* cacheStarshipSearchTerm(starship, starshipName)
  yield* perform(StarshipRepository.upsertOne(newStarship))
  const _starship = yield* perform(
    StarshipRepository.findOneById(newStarship._id),
  )
  if (_starship === undefined) {
    throw new Error(`Cannot find starship "${newStarship._id}"`)
  }

  return _starship
}
