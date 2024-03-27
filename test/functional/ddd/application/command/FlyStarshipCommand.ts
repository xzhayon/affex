import { perform } from 'fx'
import {
  Character,
  flyStarship as _flyStarship,
} from '../../domain/entity/Character'
import { Starship } from '../../domain/entity/Starship'
import { error, info } from '../../kernel/Log'

export function* flyStarship(character: Character, starship: Starship) {
  try {
    const _character = _flyStarship(character, starship)
    yield* perform(
      info('Starship flown', {
        characterId: _character._id,
        starshipId: starship._id,
      }),
    )

    return { character: _character, starship }
  } catch (_error) {
    yield* perform(
      error('Starship not flown', {
        error: _error,
        characterId: character._id,
        starshipId: starship._id,
      }),
    )

    throw _error
  }
}
