import { Handler } from '../../../../../src/Handler'
import { StarshipDto } from '../../application/dto/StarshipDto'
import { GetStarshipByNameQuery } from '../../application/query/GetStarshipByNameQuery'

export const getStarshipByNameFromMemory = (
  storage: ReadonlyArray<StarshipDto> = [],
) =>
  function* (name) {
    const starship = storage.find((starship) =>
      new RegExp(name, 'i').test(starship.name),
    )
    if (starship === undefined) {
      throw new Error(`Cannot find any starship with name "${name}"`)
    }

    return starship
  } satisfies Handler<GetStarshipByNameQuery>
