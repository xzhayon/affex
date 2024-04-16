import { CharaterExternalId, character } from '../../domain/entity/Character'
import { Starship } from '../../domain/entity/Starship'
import { Log } from '../log/Log'

export function* createCharacter(
  externalId: CharaterExternalId,
  starships: ReadonlyArray<Starship>,
) {
  const _character = yield* character(externalId, starships)
  yield* Log.info('Character created', {
    characterId: _character._id,
    characterExternalId: _character.externalId,
  })

  return _character
}
