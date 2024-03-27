import { perform } from 'fx'
import { Handler } from '../../../../../src/Handler'
import { CharacterRepository } from '../../application/persistence/CharacterRepository'
import {
  Character,
  CharaterExternalId,
  CharaterSearchTerm,
} from '../../domain/entity/Character'
import { IdOf } from '../../domain/entity/Entity'
import { debug } from '../../kernel/Log'

interface CharacterStorage {
  byId?: Record<IdOf<Character>, Character | undefined>
  byExternalId?: Record<CharaterExternalId, Character | undefined>
  bySearchTerm?: Record<CharaterSearchTerm, Character | undefined>
}

export function inMemoryCharacterRepository(storage: CharacterStorage = {}) {
  return {
    *findOneById(id) {
      const character = storage.byId?.[id]
      character === undefined
        ? yield* perform(debug('Character not found', { characterId: id }))
        : yield* perform(
            debug('Character found', { characterId: character._id }),
          )

      return character
    },
    *findOneByExternalId(externalId) {
      const character = storage.byExternalId?.[externalId]
      character === undefined
        ? yield* perform(
            debug('Character not found', { characterExternalId: externalId }),
          )
        : yield* perform(
            debug('Character found', {
              characterId: character._id,
              characterExternalId: character.externalId,
            }),
          )

      return character
    },
    *findOneBySearchTerm(searchTerm) {
      const character = storage.bySearchTerm?.[searchTerm]
      character === undefined
        ? yield* perform(
            debug('Character not found', { characterSearchTerm: searchTerm }),
          )
        : yield* perform(
            debug('Character found', {
              characterId: character._id,
              characterSearchTerm: searchTerm,
            }),
          )

      return character
    },
    *upsertOne(character) {
      storage.byId = { ...storage.byId, [character._id]: character }
      storage.byExternalId = {
        ...storage.byExternalId,
        [character.externalId]: character,
      }
      storage.bySearchTerm = {
        ...storage.bySearchTerm,
        ...character.searchTerms.reduce(
          (searchTerms, searchTerm) => ({
            ...searchTerms,
            [searchTerm]: character,
          }),
          {},
        ),
      }
      yield* perform(
        debug('Character upserted', { characterId: character._id }),
      )
    },
  } satisfies Handler<CharacterRepository>
}
