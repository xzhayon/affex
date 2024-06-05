import { fx } from 'affex'
import { IdOf } from '../../domain/entity/Entity'
import {
  Starship,
  StarshipExternalId,
  StarshipSearchTerm,
} from '../../domain/entity/Starship'

export interface StarshipRepository {
  readonly [fx.uri]?: unique symbol
  findManyById(ids: ReadonlyArray<IdOf<Starship>>): ReadonlyArray<Starship>
  findOneById(id: IdOf<Starship>): Starship | undefined
  findOneByExternalId(externalId: StarshipExternalId): Starship | undefined
  findOneBySearchTerm(searchTerm: StarshipSearchTerm): Starship | undefined
  upsertMany(starships: ReadonlyArray<Starship>): void
  upsertOne(starship: Starship): void
}

export const tag = fx.tag<StarshipRepository>()
export const StarshipRepository = fx.service(tag)(
  'findManyById',
  'findOneById',
  'findOneByExternalId',
  'findOneBySearchTerm',
  'upsertMany',
  'upsertOne',
)
