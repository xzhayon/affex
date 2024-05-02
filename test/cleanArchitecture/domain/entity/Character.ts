import { fx } from 'affex'
import { Entity, IdOf, entity } from './Entity'
import { Starship } from './Starship'

export interface Character extends Entity {
  readonly externalId: CharaterExternalId
  readonly starshipIds: ReadonlyArray<IdOf<Starship>>
  readonly searchTerms: ReadonlyArray<CharaterSearchTerm>
}

export type CharaterExternalId = string
export type CharaterSearchTerm = string

export function* character(
  externalId: CharaterExternalId,
  starships: ReadonlyArray<Starship>,
) {
  return {
    ...(yield* entity()),
    externalId,
    starshipIds: starships.map(({ _id }) => _id),
    searchTerms: [],
  } satisfies Character
}

export function* flyStarship(character: Character, starship: Starship) {
  if (!character.starshipIds.includes(starship._id)) {
    return yield* fx.raise(
      new Error(
        `Character "${character._id}" cannot fly starship "${starship._id}"`,
      ),
    )
  }

  return character
}

export function cacheSearchTerm(
  character: Character,
  searchTerm: CharaterSearchTerm,
): Character {
  return {
    ...character,
    searchTerms: [...new Set(character.searchTerms.concat(searchTerm))],
  }
}
