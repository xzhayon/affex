import { fx } from 'fx'
import {
  Character,
  flyStarship as _flyStarship,
} from '../../domain/entity/Character'
import { Starship } from '../../domain/entity/Starship'
import { Log } from '../log/Log'

export function* flyStarship(character: Character, starship: Starship) {
  return yield* fx.tryCatch(
    function* () {
      const _character = yield* _flyStarship(character, starship)
      yield* Log.info('Starship flown', {
        characterId: _character._id,
        starshipId: starship._id,
      })

      return { character: _character, starship }
    },
    function* (error) {
      yield* Log.error('Starship not flown', {
        error,
        characterId: character._id,
        starshipId: starship._id,
      })

      return yield* fx.raise(error)
    },
  )
}
