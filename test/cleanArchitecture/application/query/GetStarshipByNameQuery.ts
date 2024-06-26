import { fx } from 'affex'
import { StarshipSearchTerm } from '../../domain/entity/Starship'
import { StarshipDto } from '../dto/StarshipDto'

export interface GetStarshipByNameQuery {
  readonly [fx.uri]?: unique symbol
  (name: StarshipSearchTerm): fx.Result<StarshipDto, Error>
}

export const tag = fx.tag<GetStarshipByNameQuery>()
export const getStarshipByName = fx.operation(tag)
