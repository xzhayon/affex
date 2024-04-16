import { CharaterSearchTerm } from '../../domain/entity/Character'
import { StarshipSearchTerm } from '../../domain/entity/Starship'
import { flyStarship as _flyStarship } from '../command/FlyStarshipCommand'
import { CharacterRepository } from '../persistence/CharacterRepository'
import { getCharacterBySearchTerm } from './middleware/GetCharacterBySearchTermMiddleware'
import { getStarshipBySearchTerm } from './middleware/GetStarshipBySearchTermMiddleware'

export function* flyStarship(
  characterName: CharaterSearchTerm,
  starshipName: StarshipSearchTerm,
) {
  const { character, starships } = yield* getCharacterBySearchTerm(
    characterName,
  )
  const starship = yield* getStarshipBySearchTerm(starshipName, starships)
  const { character: _character, starship: _starship } = yield* _flyStarship(
    character,
    starship,
  )
  yield* CharacterRepository.upsertOne(_character)

  return { character: _character, starship: _starship }
}
