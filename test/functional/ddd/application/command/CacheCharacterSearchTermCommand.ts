import { perform } from '../../../../../src/Effect'
import {
  Character,
  CharaterSearchTerm,
  cacheSearchTerm,
} from '../../domain/entity/Character'
import { debug } from '../../kernel/Log'

export function* cacheCharacterSearchTerm(
  character: Character,
  searchTerm: CharaterSearchTerm,
) {
  const _character = cacheSearchTerm(character, searchTerm)
  yield* perform(
    debug('Character search term cached', {
      characterId: _character._id,
      characterSearchTerm: searchTerm,
    }),
  )

  return _character
}
