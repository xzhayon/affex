import { fx } from 'fx'
import { StarshipDto } from '../../application/dto/StarshipDto'
import { tag } from '../../application/query/GetStarshipByNameQuery'

export function InMemoryGetStarshipByNameQuery(
  storage: ReadonlyArray<StarshipDto> = [],
) {
  return fx.layer().with(tag, function* (name) {
    const starship = storage.find((starship) =>
      new RegExp(name, 'i').test(starship.name),
    )
    if (starship === undefined) {
      return yield* fx.raise(
        new Error(`Cannot find any starship with name "${name}"`),
      )
    }

    return starship
  })
}
