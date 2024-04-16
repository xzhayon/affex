import { fx } from 'fx'
import { Character, CharaterSearchTerm } from '../../../domain/entity/Character'
import { Starship } from '../../../domain/entity/Starship'
import { cacheCharacterSearchTerm } from '../../command/CacheCharacterSearchTermCommand'
import { createCharacter } from '../../command/CreateCharacterCommand'
import { createStarship } from '../../command/CreateStarshipCommand'
import { CharacterRepository } from '../../persistence/CharacterRepository'
import { StarshipRepository } from '../../persistence/StarshipRepository'
import { getCharacterByName } from '../../query/GetCharacterByNameQuery'

export function* getCharacterBySearchTerm(
  characterName: CharaterSearchTerm,
  characters: ReadonlyArray<Character> = [],
  starships: ReadonlyArray<Starship> = [],
) {
  let character =
    characters.find(({ searchTerms }) => searchTerms.includes(characterName)) ??
    (yield* CharacterRepository.findOneBySearchTerm(characterName))
  if (character !== undefined) {
    return { character, starships: [] }
  }

  let characterDto = yield* getCharacterByName(characterName)
  character =
    characters.find(({ externalId }) => externalId === characterDto.url) ??
    (yield* CharacterRepository.findOneByExternalId(characterDto.url))

  let newStarships: ReadonlyArray<Starship> = []
  if (character === undefined) {
    newStarships = yield* fx.all(
      characterDto.starshipUrls,
      function* (starshipUrl) {
        return (
          starships.find(({ externalId }) => externalId === starshipUrl) ??
          (yield* StarshipRepository.findOneByExternalId(starshipUrl)) ??
          (yield* createStarship(starshipUrl))
        )
      },
    )
    character = yield* createCharacter(characterDto.url, newStarships)
  }

  const newCharacter = yield* cacheCharacterSearchTerm(character, characterName)
  yield* CharacterRepository.upsertOne(newCharacter)
  yield* StarshipRepository.upsertMany(newStarships)
  const _character = yield* CharacterRepository.findOneById(newCharacter._id)
  if (_character === undefined) {
    throw new Error(`Cannot find character "${newCharacter._id}"`)
  }

  return {
    character: _character,
    starships: yield* StarshipRepository.findManyById(
      newStarships.map(({ _id }) => _id),
    ),
  }
}
