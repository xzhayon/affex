import { fx } from 'affex'
import { CharaterSearchTerm } from '../../domain/entity/Character'
import { CharacterDto } from '../dto/CharacterDto'

export interface GetCharacterByNameQuery {
  readonly [fx.uri]?: unique symbol
  (name: CharaterSearchTerm): fx.Result<CharacterDto, Error>
}

export const tag = fx.tag<GetCharacterByNameQuery>()
export const getCharacterByName = fx.function(tag)
