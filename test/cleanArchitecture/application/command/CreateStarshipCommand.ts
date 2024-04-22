import { StarshipExternalId, starship } from '../../domain/entity/Starship'
import { Log } from '../log/Log'

export function* createStarship(externalId: StarshipExternalId) {
  const _starship = yield* starship(externalId)
  yield* Log.info('Starship created', {
    starshipId: _starship._id,
    starshipExternalId: _starship.externalId,
  })

  return _starship
}
