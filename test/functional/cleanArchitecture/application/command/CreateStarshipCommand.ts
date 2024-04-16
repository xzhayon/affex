import { StarshipExternalId, starship } from '../../domain/entity/Starship'
import { info } from '../log/Log'

export function* createStarship(externalId: StarshipExternalId) {
  const _starship = yield* starship(externalId)
  yield* info('Starship created', {
    starshipId: _starship._id,
    starshipExternalId: _starship.externalId,
  })

  return _starship
}
