import { Handler, perform } from 'fx'
import { GetCharacterByNameQuery } from '../../application/query/GetCharacterByNameQuery'
import * as Id from '../../domain/valueObject/Id'

export const getMockCharacterByName = function* (name) {
  return {
    name,
    starshipUrls: [yield* perform(Id.random())],
    url: yield* perform(Id.random()),
  }
} satisfies Handler<GetCharacterByNameQuery>
