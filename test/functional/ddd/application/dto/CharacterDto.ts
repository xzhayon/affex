import { Url } from './Url'

export interface CharacterDto {
  readonly name: string
  readonly starshipUrls: ReadonlyArray<Url>
  readonly url: Url
}
