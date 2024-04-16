import {
  Character,
  flyStarship as _flyStarship,
} from '../../domain/entity/Character'
import { Starship } from '../../domain/entity/Starship'
import { Log } from '../log/Log'

export function* flyStarship(character: Character, starship: Starship) {
  try {
    const _character = _flyStarship(character, starship)
    yield* Log.info('Starship flown', {
      characterId: _character._id,
      starshipId: starship._id,
    })

    return { character: _character, starship }
  } catch (_error) {
    yield* Log.error('Starship not flown', {
      error: _error,
      characterId: character._id,
      starshipId: starship._id,
    })

    throw _error
  }
}
