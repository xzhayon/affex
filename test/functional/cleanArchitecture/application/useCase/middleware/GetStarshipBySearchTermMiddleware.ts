import { Starship, StarshipSearchTerm } from '../../../domain/entity/Starship'
import { cacheStarshipSearchTerm } from '../../command/CacheStarshipSearchTermCommand'
import { createStarship } from '../../command/CreateStarshipCommand'
import { StarshipRepository } from '../../persistence/StarshipRepository'
import { getStarshipByName } from '../../query/GetStarshipByNameQuery'

export function* getStarshipBySearchTerm(
  starshipName: StarshipSearchTerm,
  starships: ReadonlyArray<Starship> = [],
) {
  let starship =
    starships.find(({ searchTerms }) => searchTerms.includes(starshipName)) ??
    (yield* StarshipRepository.findOneBySearchTerm(starshipName))
  if (starship !== undefined) {
    return starship
  }

  let starshipDto = yield* getStarshipByName(starshipName)
  starship =
    starships.find(({ externalId }) => externalId === starshipDto.url) ??
    (yield* StarshipRepository.findOneByExternalId(starshipDto.url)) ??
    (yield* createStarship(starshipDto.url))

  const newStarship = yield* cacheStarshipSearchTerm(starship, starshipName)
  yield* StarshipRepository.upsertOne(newStarship)
  const _starship = yield* StarshipRepository.findOneById(newStarship._id)
  if (_starship === undefined) {
    throw new Error(`Cannot find starship "${newStarship._id}"`)
  }

  return _starship
}
