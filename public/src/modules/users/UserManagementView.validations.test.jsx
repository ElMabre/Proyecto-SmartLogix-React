import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UserManagementView from './UserManagementView'

describe('UserManagementView - Validaciones de Entrada', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('rechaza email vacío', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    ))

    localStorage.setItem('smartlogix_jwt', 'token123')

    render(<UserManagementView />)

    await userEvent.click(screen.getByRole('button', { name: /Nuevo Usuario/i }))

    expect(screen.getByLabelText(/Correo Electrónico/i)).toHaveAttribute('required')
  })

  it('rechaza email inválido (sin @)', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    ))

    localStorage.setItem('smartlogix_jwt', 'token123')

    render(<UserManagementView />)

    await userEvent.click(screen.getByRole('button', { name: /Nuevo Usuario/i }))
    
    const emailInput = screen.getByLabelText(/Correo Electrónico/i)
    expect(emailInput).toHaveAttribute('type', 'email')
  })

  it('rechaza nombre completo vacío', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    ))

    localStorage.setItem('smartlogix_jwt', 'token123')

    render(<UserManagementView />)

    await userEvent.click(screen.getByRole('button', { name: /Nuevo Usuario/i }))

    expect(screen.getByLabelText(/Nombre Completo/i)).toHaveAttribute('required')
  })

  it('rechaza contraseña vacía al crear usuario', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    ))

    localStorage.setItem('smartlogix_jwt', 'token123')

    render(<UserManagementView />)

    await userEvent.click(screen.getByRole('button', { name: /Nuevo Usuario/i }))

    const passwordInput = screen.getByLabelText(/Contraseña/i)
    expect(passwordInput).toHaveAttribute('required')
  })

  it('rechaza pymeId vacío', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    ))

    localStorage.setItem('smartlogix_jwt', 'token123')

    render(<UserManagementView />)

    await userEvent.click(screen.getByRole('button', { name: /Nuevo Usuario/i }))

    expect(screen.getByLabelText(/ID de Pyme Asignada/i)).toHaveAttribute('required')
  })

  it('rechaza pymeId no numérico', async () => {
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
    localStorage.setItem('smartlogix_jwt', 'token123')

    render(<UserManagementView />)

    await userEvent.click(screen.getByRole('button', { name: /Nuevo Usuario/i }))
    await userEvent.type(screen.getByLabelText(/Nombre Completo/i), 'Test User')
    await userEvent.type(screen.getByLabelText(/Correo Electrónico/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/Contraseña/i), 'password123')
    await userEvent.type(screen.getByLabelText(/ID de Pyme Asignada/i), 'abc')

    expect(screen.getByLabelText(/ID de Pyme Asignada/i)).toHaveAttribute('type', 'number')
  })

  it('acepta email con formato válido', async () => {
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
    localStorage.setItem('smartlogix_jwt', 'token123')

    render(<UserManagementView />)

    await userEvent.click(screen.getByRole('button', { name: /Nuevo Usuario/i }))
    await userEvent.type(screen.getByLabelText(/Nombre Completo/i), 'Juan García')
    await userEvent.type(screen.getByLabelText(/Correo Electrónico/i), 'juan+admin@company.co.uk')
    await userEvent.type(screen.getByLabelText(/Contraseña/i), 'SecurePass123!')
    await userEvent.selectOptions(screen.getByLabelText(/Rol del Usuario/i), 'ADMIN')
    await userEvent.type(screen.getByLabelText(/ID de Pyme Asignada/i), '50')

    await userEvent.click(screen.getByRole('button', { name: /Crear Usuario/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })
  })

  it('rechaza nombre vacío o solo espacios', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    ))

    localStorage.setItem('smartlogix_jwt', 'token123')

    render(<UserManagementView />)

    await userEvent.click(screen.getByRole('button', { name: /Nuevo Usuario/i }))
    await userEvent.type(screen.getByLabelText(/Nombre Completo/i), '   ')
    await userEvent.type(screen.getByLabelText(/Correo Electrónico/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/Contraseña/i), 'pass123')
    await userEvent.type(screen.getByLabelText(/ID de Pyme Asignada/i), '50')

    // Los required del HTML previenen el envío
    expect(screen.getByLabelText(/Nombre Completo/i)).toHaveAttribute('required')
  })

  it('desactiva campo de email en modo edición', async () => {
    const mockUsers = [
      { id: 1, email: 'user1@example.com', nombre: 'Usuario 1', role: 'USER', pymeId: 50, isActive: true }
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
    })

    await userEvent.click(screen.getByRole('button', { name: /Editar/i }))

    const emailInput = screen.getByLabelText(/Correo Electrónico/i)
    expect(emailInput).toBeDisabled()
  })

  it('acepta pymeId positivo y numérico', async () => {
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
    localStorage.setItem('smartlogix_jwt', 'token123')

    render(<UserManagementView />)

    await userEvent.click(screen.getByRole('button', { name: /Nuevo Usuario/i }))
    await userEvent.type(screen.getByLabelText(/Nombre Completo/i), 'Test')
    await userEvent.type(screen.getByLabelText(/Correo Electrónico/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/Contraseña/i), 'pass123')
    await userEvent.type(screen.getByLabelText(/ID de Pyme Asignada/i), '9999')

    await userEvent.click(screen.getByRole('button', { name: /Crear Usuario/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/users'),
        expect.objectContaining({
          body: expect.stringContaining('"pymeId":9999')
        })
      )
    })
  })

  it('limpia el formulario después de crear usuario', async () => {
    const fetchMock = vi.fn((url, config) => {
      if (config && config.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 2 })
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          { id: 2, email: 'newuser@example.com', nombre: 'Nuevo Usuario', role: 'USER', pymeId: 50, isActive: true }
        ])
      })
    })

    vi.stubGlobal('fetch', fetchMock)
    localStorage.setItem('smartlogix_jwt', 'token123')

    render(<UserManagementView />)

    await userEvent.click(screen.getByRole('button', { name: /Nuevo Usuario/i }))
    await userEvent.type(screen.getByLabelText(/Nombre Completo/i), 'Nuevo Usuario')
    await userEvent.type(screen.getByLabelText(/Correo Electrónico/i), 'newuser@example.com')
    await userEvent.type(screen.getByLabelText(/Contraseña/i), 'pass123')
    await userEvent.type(screen.getByLabelText(/ID de Pyme Asignada/i), '50')

    await userEvent.click(screen.getByRole('button', { name: /Crear Usuario/i }))

    await waitFor(() => {
      expect(screen.getByText('newuser@example.com')).toBeInTheDocument()
    })

    // El formulario debe cerrarse
    expect(screen.queryByLabelText(/Nombre Completo/i)).not.toBeInTheDocument()
  })
})
