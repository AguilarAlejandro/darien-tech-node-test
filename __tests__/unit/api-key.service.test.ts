import { validateApiKey, invalidateApiKeyCache } from '../../src/services/api-key.service'

jest.mock('../../src/database/prisma', () => ({
  prisma: {
    apiKey: {
      findUnique: jest.fn(),
    },
  },
}))

import { prisma } from '../../src/database/prisma'

const mockFindUnique = prisma.apiKey.findUnique as jest.Mock

describe('api-key.service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    invalidateApiKeyCache('test-key')
  })

  it('returns null when key not found in DB', async () => {
    mockFindUnique.mockResolvedValue(null)
    const result = await validateApiKey('invalid-key')
    expect(result).toBeNull()
  })

  it('returns role and id when key is valid', async () => {
    mockFindUnique.mockResolvedValue({ id: 'uuid-1', role: 'ADMIN' })
    const result = await validateApiKey('valid-key')
    expect(result).toEqual({ apiKeyId: 'uuid-1', role: 'ADMIN' })
  })

  it('uses in-memory cache on second call', async () => {
    mockFindUnique.mockResolvedValue({ id: 'uuid-2', role: 'USER' })
    await validateApiKey('cached-key')
    await validateApiKey('cached-key')
    expect(mockFindUnique).toHaveBeenCalledTimes(1)
  })

  it('invalidateApiKeyCache clears the cache so next call hits DB', async () => {
    mockFindUnique.mockResolvedValue({ id: 'uuid-3', role: 'USER' })
    await validateApiKey('test-key')
    invalidateApiKeyCache('test-key')
    await validateApiKey('test-key')
    expect(mockFindUnique).toHaveBeenCalledTimes(2)
  })
})
