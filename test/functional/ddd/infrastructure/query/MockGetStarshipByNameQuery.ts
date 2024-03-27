import { Handler, perform } from 'fx'
import { GetStarshipByNameQuery } from '../../application/query/GetStarshipByNameQuery'
import * as Id from '../../domain/valueObject/Id'

export const getMockStarshipByName = function* (name) {
  return { name, url: yield* perform(Id.random()) }
} satisfies Handler<GetStarshipByNameQuery>
