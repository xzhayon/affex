import { fx } from 'affex'
import { flyStarship } from './application/useCase/FlyStarshipUseCase'
import { InMemoryLog } from './infrastructure/log/InMemoryLog'
import { InMemoryCharacterRepository } from './infrastructure/persistence/InMemoryCharacterRepository'
import { InMemoryStarshipRepository } from './infrastructure/persistence/InMemoryStarshipRepository'
import { MockCharacterRepository } from './infrastructure/persistence/MockCharacterRepository'
import { MockStarshipRepository } from './infrastructure/persistence/MockStarshipRepository'
import { InMemoryGetCharacterByNameQuery } from './infrastructure/query/InMemoryGetCharacterByNameQuery'
import { InMemoryGetStarshipByNameQuery } from './infrastructure/query/InMemoryGetStarshipByNameQuery'
import { MockGetCharacterByNameQuery } from './infrastructure/query/MockGetCharacterByNameQuery'
import { MockGetStarshipByNameQuery } from './infrastructure/query/MockGetStarshipByNameQuery'
import { CryptoUuid } from './infrastructure/valueObject/CryptoUuid'

describe('Clean architecture', () => {
  let log: any[] = []
  let characterStorage: object
  let starshipStorage: object

  beforeEach(() => {
    log = []
    characterStorage = {}
    starshipStorage = {}
  })

  const layer = fx.layer().with(CryptoUuid()).with(InMemoryLog(log))

  test('running use case with mocks', async () => {
    const mockLayer = fx
      .layer()
      .with(MockCharacterRepository())
      .with(MockGetCharacterByNameQuery())
      .with(MockGetStarshipByNameQuery())
      .with(MockStarshipRepository())

    await expect(
      fx.runPromise(flyStarship('luke', 'x-wing'), layer.with(mockLayer)),
    ).rejects.toThrow(/Character "[^"]+" cannot fly starship "[^"]+"/)
  })

  test('running use case with in-memory storage', async () => {
    const inMemoryLayer = fx
      .layer()
      .with(InMemoryCharacterRepository(characterStorage))
      .with(
        InMemoryGetCharacterByNameQuery([
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
      .with(
        InMemoryGetStarshipByNameQuery([
          { name: 'X-wing', url: 'https://swapi.dev/api/starships/12/' },
        ]),
      )
      .with(InMemoryStarshipRepository(starshipStorage))

    await expect(
      fx.runPromise(flyStarship('luke', 'x-wing'), layer.with(inMemoryLayer)),
    ).resolves.toMatchObject({
      character: { searchTerms: ['luke'] },
      starship: { searchTerms: ['x-wing'] },
    })
  })
})
