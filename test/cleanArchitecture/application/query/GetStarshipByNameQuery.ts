import { fx } from 'fx'
import { StarshipSearchTerm } from '../../domain/entity/Starship'
import { StarshipDto } from '../dto/StarshipDto'

export interface GetStarshipByNameQuery {
  readonly [fx.uri]?: unique symbol
  (name: StarshipSearchTerm): fx.Result<StarshipDto, Error>
}

export const tag = fx.tag<GetStarshipByNameQuery>()
export const getStarshipByName = fx.function(tag)
