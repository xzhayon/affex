import {
  Character,
  CharaterSearchTerm,
  cacheSearchTerm,
} from '../../domain/entity/Character'
import { Log } from '../log/Log'

export function* cacheCharacterSearchTerm(
  character: Character,
  searchTerm: CharaterSearchTerm,
) {
  const _character = cacheSearchTerm(character, searchTerm)
  yield* Log.debug('Character search term cached', {
    characterId: _character._id,
    characterSearchTerm: searchTerm,
  })

  return _character
}
