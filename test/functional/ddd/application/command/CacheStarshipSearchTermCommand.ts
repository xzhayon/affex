import { perform } from 'fx'
import {
  Starship,
  StarshipSearchTerm,
  cacheSearchTerm,
} from '../../domain/entity/Starship'
import { debug } from '../../kernel/Log'

export function* cacheStarshipSearchTerm(
  starship: Starship,
  searchTerm: StarshipSearchTerm,
) {
  const _starship = cacheSearchTerm(starship, searchTerm)
  yield* perform(
    debug('Starship search term cached', {
      starshipId: _starship._id,
      starshipSearchTerm: searchTerm,
    }),
  )

  return _starship
}
