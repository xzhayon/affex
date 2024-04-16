import { Handler } from 'fx'
import { GetCharacterByNameQuery } from '../../application/query/GetCharacterByNameQuery'
import * as Id from '../../domain/valueObject/Id'

export const getMockCharacterByName = function* (name) {
  return {
    name,
    starshipUrls: [yield* Id.random()],
    url: yield* Id.random(),
  }
} satisfies Handler<GetCharacterByNameQuery>
