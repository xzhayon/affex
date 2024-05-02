import { fx } from 'affex'
import {
  Character,
  CharaterExternalId,
  CharaterSearchTerm,
} from '../../domain/entity/Character'
import { IdOf } from '../../domain/entity/Entity'

export interface CharacterRepository {
  readonly [fx.uri]?: unique symbol
  findOneById(id: IdOf<Character>): Character | undefined
  findOneByExternalId(externalId: CharaterExternalId): Character | undefined
  findOneBySearchTerm(searchTerm: CharaterSearchTerm): Character | undefined
  upsertOne(character: Character): void
}

export const tag = fx.tag<CharacterRepository>()
export const CharacterRepository = fx.struct(tag)(
  'findOneById',
  'findOneByExternalId',
  'findOneBySearchTerm',
  'upsertOne',
)
