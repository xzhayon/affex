import { fx } from 'fx'
import { CharaterSearchTerm } from '../../domain/entity/Character'
import { CharacterDto } from '../dto/CharacterDto'

export interface GetCharacterByNameQuery {
  readonly [fx.URI]?: unique symbol
  (name: CharaterSearchTerm): CharacterDto
}

export const tag = fx.tag<GetCharacterByNameQuery>()
export const getCharacterByName = fx.function(tag)
