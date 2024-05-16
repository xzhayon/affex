import { fx } from 'affex'
import { CharacterDto } from '../../application/dto/CharacterDto'
import { tag } from '../../application/query/GetCharacterByNameQuery'

export function InMemoryGetCharacterByNameQuery(
  storage: ReadonlyArray<CharacterDto> = [],
) {
  return fx.layer(tag, function* (name) {
    const character = storage.find((character) =>
      new RegExp(name, 'i').test(character.name),
    )
    if (character === undefined) {
      return yield* fx.raise(
        new Error(`Cannot find any character with name "${name}"`),
      )
    }

    return character
  })
}
