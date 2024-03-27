import { Handler } from '../../../../../src/Handler'
import { CharacterDto } from '../../application/dto/CharacterDto'
import { GetCharacterByNameQuery } from '../../application/query/GetCharacterByNameQuery'

export const getCharacterByNameFromMemory = (
  storage: ReadonlyArray<CharacterDto> = [],
) =>
  function* (name) {
    const character = storage.find((character) =>
      new RegExp(name, 'i').test(character.name),
    )
    if (character === undefined) {
      throw new Error(`Cannot find any character with name "${name}"`)
    }

    return character
  } satisfies Handler<GetCharacterByNameQuery>
