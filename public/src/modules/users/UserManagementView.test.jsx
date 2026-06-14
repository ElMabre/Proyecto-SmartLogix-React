import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UserManagementView from './UserManagementView'

describe('UserManagementView', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('renderiza el título y botón de nuevo usuario', () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    ))

    render(<UserManagementView />)

    expect(screen.getByText(/Gestión de Usuarios/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Nuevo Usuario/i })).toBeInTheDocument()
  })

  it('carga usuarios desde el servidor', async () => {
    const mockUsers = [
      { id: 1, email: 'user1@example.com', nombre: 'Usuario 1', role: 'USER', pymeId: 50, isActive: true },
      { id: 2, email: 'admin@example.com', nombre: 'Admin', role: 'ADMIN', pymeId: 50, isActive: true }
    ]

    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUsers)
      })
    ))

    localStorage.setItem('smartlogix_jwt', 'token123')

    render(<UserManagementView />)

    await waitFor(() => {
      expect(screen.getByText('Usuario 1')).toBeInTheDocument()
      expect(screen.getByText('Admin')).toBeInTheDocument()
    })
  })

  it('muestra mensaje cuando no hay usuarios', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    ))

    localStorage.setItem('smartlogix_jwt', 'token123')

    render(<UserManagementView />)

    await waitFor(() => {
      expect(screen.getByText(/No hay usuarios registrados/i)).toBeInTheDocument()
    })
  })

  it('abre el formulario de nuevo usuario', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    ))

    localStorage.setItem('smartlogix_jwt', 'token123')

    render(<UserManagementView />)

    await userEvent.click(screen.getByRole('button', { name: /Nuevo Usuario/i }))

    expect(screen.getByLabelText(/Nombre Completo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Correo Electrónico/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Contraseña/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Rol del Usuario/i)).toBeInTheDocument()
  })

  it('crea un nuevo usuario', async () => {
    const fetchMock = vi.fn((url, config) => {
      if (config.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 3, email: 'newuser@example.com' })
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
    await userEvent.type(screen.getByLabelText(/Nombre Completo/i), 'Juan Pérez')
    await userEvent.type(screen.getByLabelText(/Correo Electrónico/i), 'juan@example.com')
    await userEvent.type(screen.getByLabelText(/Contraseña/i), 'password123')
    await userEvent.selectOptions(screen.getByLabelText(/Rol del Usuario/i), 'USER')
    await userEvent.type(screen.getByLabelText(/ID de Pyme Asignada/i), '50')
    await userEvent.click(screen.getByRole('button', { name: /Crear Usuario/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/users'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Juan Pérez')
        })
      )
    })
  })

  it('edita un usuario existente', async () => {
    const mockUsers = [
      { id: 1, email: 'user1@example.com', nombre: 'Usuario 1', role: 'USER', pymeId: 50, isActive: true }
    ]

    const fetchMock = vi.fn((url, config) => {
      if (config.method === 'PUT') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 1, nombre: 'Usuario Actualizado' })
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
    await userEvent.type(nombreInput, 'Usuario Actualizado')

    await userEvent.click(screen.getByRole('button', { name: /Actualizar Usuario/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/users/1'),
        expect.objectContaining({
          method: 'PUT'
        })
      )
    })
  })

  it('cambia el estado activo de un usuario', async () => {
    const mockUsers = [
      { id: 1, email: 'user1@example.com', nombre: 'Usuario 1', role: 'USER', pymeId: 50, isActive: true }
    ]

    const fetchMock = vi.fn((url, config) => {
      if (config.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 1, isActive: false })
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

    await userEvent.click(screen.getByRole('button', { name: /Bloquear/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/status'),
        expect.objectContaining({
          method: 'PATCH'
        })
      )
    })
  })
})
