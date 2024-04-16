import {
  Character,
  CharaterSearchTerm,
  cacheSearchTerm,
} from '../../domain/entity/Character'
import { debug } from '../log/Log'

export function* cacheCharacterSearchTerm(
  character: Character,
  searchTerm: CharaterSearchTerm,
) {
  const _character = cacheSearchTerm(character, searchTerm)
  yield* debug('Character search term cached', {
    characterId: _character._id,
    characterSearchTerm: searchTerm,
  })

  return _character
}
