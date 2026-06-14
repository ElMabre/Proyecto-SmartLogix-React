import { loginReal, logoutReal } from './authService'

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('loginReal hace fetch y guarda el token en localStorage', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ token: 'abc123', userId: '1' })
    }
    const fetchMock = vi.fn(() => Promise.resolve(mockResponse))
    vi.stubGlobal('fetch', fetchMock)

    const result = await loginReal({ email: 'test@example.com', password: 'pass' })

    expect(fetchMock).toHaveBeenCalled()
    expect(result).toEqual({ token: 'abc123', userId: '1' })
    expect(localStorage.getItem('smartlogix_jwt')).toBe('abc123')
  })

  it('loginReal lanza error cuando la respuesta no es ok', async () => {
    const fetchMock = vi.fn(() => Promise.resolve({ ok: false }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(loginReal({ email: 'test@example.com', password: 'wrong' })).rejects.toThrow()
  })

  it('logoutReal elimina el token del localStorage', () => {
    localStorage.setItem('smartlogix_jwt', 'abc123')
    logoutReal()
    expect(localStorage.getItem('smartlogix_jwt')).toBeNull()
  })
})
