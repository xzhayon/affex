import { Entity, entity } from './Entity'

export interface Starship extends Entity {
  readonly externalId: StarshipExternalId
  readonly searchTerms: ReadonlyArray<StarshipSearchTerm>
}

export type StarshipExternalId = string
export type StarshipSearchTerm = string

export function* starship(externalId: StarshipExternalId) {
  return {
    ...(yield* entity()),
    externalId,
    searchTerms: [],
  } satisfies Starship
}

export function cacheSearchTerm(
  starship: Starship,
  searchTerm: StarshipSearchTerm,
): Starship {
  return {
    ...starship,
    searchTerms: [...new Set(starship.searchTerms.concat(searchTerm))],
  }
}
