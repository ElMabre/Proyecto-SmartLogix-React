import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UserManagementView from './UserManagementView'

describe('UserManagementView - Manejo de Errores de Red', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('muestra error cuando falla obtener usuarios', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.reject(new Error('Network error'))
    ))

    localStorage.setItem('smartlogix_jwt', 'token123')

    render(<UserManagementView />)

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument()
    })
  })

  it('muestra error 401 (sesión expirada)', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 401
      })
    ))

    localStorage.setItem('smartlogix_jwt', 'token123')

    render(<UserManagementView />)

    await waitFor(() => {
      expect(screen.getByText(/Sesión expirada/i)).toBeInTheDocument()
    })
  })

  it('muestra error 403 (acceso denegado)', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 403
      })
    ))

    localStorage.setItem('smartlogix_jwt', 'token123')

    render(<UserManagementView />)

    await waitFor(() => {
      expect(screen.getByText(/Sesión expirada/i)).toBeInTheDocument()
    })
  })

  it('muestra estado loading mientras obtiene usuarios', async () => {
    let resolveUsers
    vi.stubGlobal('fetch', vi.fn(() =>
      new Promise((resolve) => {
        resolveUsers = resolve
      })
    ))

    localStorage.setItem('smartlogix_jwt', 'token123')

    render(<UserManagementView />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Nuevo Usuario/i })).toBeDisabled()
    })

    resolveUsers({
      ok: true,
      json: () => Promise.resolve([])
    })

    await waitFor(() => {
      expect(screen.getByText(/No hay usuarios registrados/i)).toBeInTheDocument()
    })
  })

  it('maneja error al crear usuario', async () => {
    const fetchMock = vi.fn((url, config) => {
      if (config && config.method === 'POST') {
        return Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ message: 'Invalid user data' })
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    })

    vi.stubGlobal('fetch', fetchMock)
    localStorage.setItem('smartlogix_jwt', 'token123')

    render(<UserManagementView />)

    await userEvent.click(screen.getByRole('button', { name: /Nuevo Usuario/i }))
    await userEvent.type(screen.getByLabelText(/Nombre Completo/i), 'Test User')
    await userEvent.type(screen.getByLabelText(/Correo Electrónico/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/Contraseña/i), 'pass123')
    await userEvent.type(screen.getByLabelText(/ID de Pyme Asignada/i), '50')

    await userEvent.click(screen.getByRole('button', { name: /Crear Usuario/i }))

    await waitFor(() => {
      expect(screen.getByText(/Error al guardar el usuario en el servidor/i)).toBeInTheDocument()
    })
  })

  it('desactiva botón durante creación de usuario', async () => {
    let resolvePost
    const fetchMock = vi.fn((url, config) => {
      if (config && config.method === 'POST') {
        return new Promise((resolve) => {
          resolvePost = resolve
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    })

    vi.stubGlobal('fetch', fetchMock)
    localStorage.setItem('smartlogix_jwt', 'token123')

    render(<UserManagementView />)

    await userEvent.click(screen.getByRole('button', { name: /Nuevo Usuario/i }))
    await userEvent.type(screen.getByLabelText(/Nombre Completo/i), 'Test User')
    await userEvent.type(screen.getByLabelText(/Correo Electrónico/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/Contraseña/i), 'pass123')
    await userEvent.type(screen.getByLabelText(/ID de Pyme Asignada/i), '50')

    await userEvent.click(screen.getByRole('button', { name: /Crear Usuario/i }))

    const cancelButtons = screen.getAllByRole('button', { name: /Cancelar/i })
    const disabledCancelBtn = cancelButtons.find(button => button.disabled)
    expect(disabledCancelBtn).toBeDefined()
    expect(disabledCancelBtn).toBeDisabled()

    resolvePost({
      ok: true,
      json: () => Promise.resolve({ id: 1 })
    })

    await waitFor(() => {
      expect(disabledCancelBtn).not.toBeDisabled()
    })
  })

  it('maneja error al activar/desactivar usuario', async () => {
    const mockUsers = [
      { id: 1, email: 'user1@example.com', nombre: 'Usuario 1', role: 'USER', pymeId: 50, isActive: true }
    ]

    const fetchMock = vi.fn((url, config) => {
      if (config && config.method === 'PATCH') {
        return Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ message: 'Cannot change status' })
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUsers)
      })
    })

    vi.stubGlobal('fetch', fetchMock)
    localStorage.setItem('smartlogix_jwt', 'token123')

    render(<UserManagementView />)

    await waitFor(() => {
      expect(screen.getByText('Usuario 1')).toBeInTheDocument()
    })

    const toggleBtn = screen.getByRole('button', { name: /Habilitar|Bloquear/i })
    await userEvent.click(toggleBtn)

    await waitFor(() => {
      expect(screen.getByText(/Error al cambiar el estado del usuario/i)).toBeInTheDocument()
    })
  })

  it('envia token JWT en headers al crear usuario', async () => {
    const fetchMock = vi.fn((url, config) => {
      if (config && config.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 1 })
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    })

    vi.stubGlobal('fetch', fetchMock)
    const token = 'jwt-token-789'
    localStorage.setItem('smartlogix_jwt', token)

    render(<UserManagementView />)

    await userEvent.click(screen.getByRole('button', { name: /Nuevo Usuario/i }))
    await userEvent.type(screen.getByLabelText(/Nombre Completo/i), 'Test User')
    await userEvent.type(screen.getByLabelText(/Correo Electrónico/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/Contraseña/i), 'pass123')
    await userEvent.type(screen.getByLabelText(/ID de Pyme Asignada/i), '50')

    await userEvent.click(screen.getByRole('button', { name: /Crear Usuario/i }))

    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find(call => call[1]?.method === 'POST')
      expect(postCall[1].headers).toHaveProperty('Authorization', `Bearer ${token}`)
    })
  })

  it('maneja JSON malformado en respuesta', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      })
    ))

    localStorage.setItem('smartlogix_jwt', 'token123')

    render(<UserManagementView />)

    await waitFor(() => {
      expect(screen.getByText(/Invalid JSON/i)).toBeInTheDocument()
    })
  })

  it('muestra error 500 del servidor', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Internal server error' })
      })
    ))

    localStorage.setItem('smartlogix_jwt', 'token123')

    render(<UserManagementView />)

    await waitFor(() => {
      expect(screen.getByText(/Error/i)).toBeInTheDocument()
    })
  })

  it('maneja error al editar usuario', async () => {
    const mockUsers = [
      { id: 1, email: 'user1@example.com', nombre: 'Usuario 1', role: 'USER', pymeId: 50, isActive: true }
    ]

    const fetchMock = vi.fn((url, config) => {
      if (config && config.method === 'PUT') {
        return Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ message: 'Invalid update' })
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUsers)
      })
    })

    vi.stubGlobal('fetch', fetchMock)
    localStorage.setItem('smartlogix_jwt', 'token123')

    render(<UserManagementView />)

    await waitFor(() => {
      expect(screen.getByText('Usuario 1')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /Editar/i }))

    const nombreInput = screen.getByLabelText(/Nombre Completo/i)
    await userEvent.clear(nombreInput)
    await userEvent.type(nombreInput, 'Usuario Editado')

    await userEvent.click(screen.getByRole('button', { name: /Actualizar Usuario/i }))

    await waitFor(() => {
      expect(screen.getByText(/Error al guardar el usuario/i)).toBeInTheDocument()
    })
  })
})
