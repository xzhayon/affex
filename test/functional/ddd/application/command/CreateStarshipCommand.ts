import { perform } from 'fx'
import { StarshipExternalId, starship } from '../../domain/entity/Starship'
import { info } from '../../kernel/Log'

export function* createStarship(externalId: StarshipExternalId) {
  const _starship = yield* starship(externalId)
  yield* perform(
    info('Starship created', {
      starshipId: _starship._id,
      starshipExternalId: _starship.externalId,
    }),
  )

  return _starship
}
