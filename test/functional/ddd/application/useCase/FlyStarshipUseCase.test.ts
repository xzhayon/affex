import * as fx from 'fx'
import * as CharacterRepository from '../../application/persistence/CharacterRepository'
import * as StarshipRepository from '../../application/persistence/StarshipRepository'
import * as GetCharacterByNameQuery from '../../application/query/GetCharacterByNameQuery'
import * as GetStarshipByNameQuery from '../../application/query/GetStarshipByNameQuery'
import * as Id from '../../domain/valueObject/Id'
import { inMemoryLog } from '../../infrastructure/log/InMemoryLog'
import { inMemoryCharacterRepository } from '../../infrastructure/persistence/InMemoryCharacterRepository'
import { inMemoryStarshipRepository } from '../../infrastructure/persistence/InMemoryStarshipRepository'
import * as MockCharacterRepository from '../../infrastructure/persistence/MockCharacterRepository'
import * as MockStarshipRepository from '../../infrastructure/persistence/MockStarshipRepository'
import { getCharacterByNameFromMemory } from '../../infrastructure/query/InMemoryGetCharacterByNameQuery'
import { getStarshipByNameFromMemory } from '../../infrastructure/query/InMemoryGetStarshipByNameQuery'
import { getMockCharacterByName } from '../../infrastructure/query/MockGetCharacterByNameQuery'
import { getMockStarshipByName } from '../../infrastructure/query/MockGetStarshipByNameQuery'
import * as CryptoUuid from '../../infrastructure/valueObject/CryptoUuid'
import * as Log from '../../kernel/Log'
import { flyStarship } from './FlyStarshipUseCase'

describe('FlyStarshipUseCase', () => {
  let log: any[]
  let characterStorage: object
  let starshipStorage: object

  beforeEach(() => {
    log = []
    characterStorage = {}
    starshipStorage = {}
  })

  test('running use case with mocks', async () => {
    await expect(
      fx
        .run(flyStarship('luke', 'x-wing'))
        .with(CharacterRepository.tag, MockCharacterRepository)
        .with(GetCharacterByNameQuery.tag, getMockCharacterByName)
        .with(Id.tag, CryptoUuid.random)
        .with(Log.tag, inMemoryLog(log))
        .with(GetStarshipByNameQuery.tag, getMockStarshipByName)
        .with(StarshipRepository.tag, MockStarshipRepository)
        .build(),
    ).rejects.toThrow(/Character "[^"]+" cannot fly starship "[^"]+"/)
  })
  test('running use case with in-memory storage', async () => {
    await expect(
      fx
        .run(flyStarship('luke', 'x-wing'))
        .with(
          CharacterRepository.tag,
          inMemoryCharacterRepository(characterStorage),
        )
        .with(
          GetCharacterByNameQuery.tag,
          getCharacterByNameFromMemory([
            {
              name: 'Luke Skywalker',
              starshipUrls: [
                'https://swapi.dev/api/starships/12/',
                'https://swapi.dev/api/starships/22/',
              ],
              url: 'https://swapi.dev/api/people/1/',
            },
          ]),
        )
        .with(Id.tag, CryptoUuid.random)
        .with(Log.tag, inMemoryLog(log))
        .with(
          GetStarshipByNameQuery.tag,
          getStarshipByNameFromMemory([
            { name: 'X-wing', url: 'https://swapi.dev/api/starships/12/' },
          ]),
        )
        .with(
          StarshipRepository.tag,
          inMemoryStarshipRepository(starshipStorage),
        )
        .build(),
    ).resolves.toMatchObject({
      character: { searchTerms: ['luke'] },
      starship: { searchTerms: ['x-wing'] },
    })
  })
})
