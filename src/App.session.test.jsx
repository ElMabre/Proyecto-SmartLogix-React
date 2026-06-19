import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

vi.mock('./core/storage/mockDatabase', () => ({
  initMockDB: vi.fn()
}))

import { initMockDB } from './core/storage/mockDatabase'

describe('App - Persistencia de Sesión', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('inicializa mockDB al montar', () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    ))

    render(<App />)

    expect(initMockDB).toHaveBeenCalled()
  })

  it('mantiene usuario autenticado si existe token en localStorage', async () => {
    const mockUser = {
      token: 'token123',
      role: 'USER',
      pymeId: '50',
      userId: '1'
    }

    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUser)
      })
    ))

    // Simular usuario ya autenticado
    localStorage.setItem('smartlogix_jwt', 'token123')
    localStorage.setItem('smartlogix_role', 'USER')

    render(<App />)

    // Debería mostrar el dashboard, no el login
    await waitFor(() => {
      expect(screen.queryByText(/Ingreso a SmartLogix/i)).not.toBeInTheDocument()
    })
  })

  it('limpia todos los datos de sesión al hacer logout', async () => {
    const mockUser = {
      token: 'token123',
      role: 'ADMIN',
      pymeId: '50',
      userId: '1'
    }

    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUser)
      })
    ))

    localStorage.setItem('smartlogix_jwt', 'token123')
    localStorage.setItem('smartlogix_role', 'ADMIN')

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/Gestión de Usuarios/i)).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /Cerrar Sesión/i }))

    await waitFor(() => {
      expect(screen.getByText(/Ingreso a SmartLogix/i)).toBeInTheDocument()
    })

    expect(localStorage.getItem('smartlogix_jwt')).toBeNull()
    expect(localStorage.getItem('smartlogix_role')).toBeNull()
  })

  it('renderiza login si no hay token en localStorage', () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    ))

    render(<App />)

    expect(screen.getByText(/Ingreso a SmartLogix/i)).toBeInTheDocument()
  })

  it('guarda rol correctamente después del login', async () => {
    const mockUser = {
      token: 'token123',
      role: 'ADMIN',
      pymeId: '50',
      userId: '1'
    }

    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUser)
      })
    ))

    render(<App />)

    await userEvent.type(screen.getByLabelText(/Correo Electrónico/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/Contraseña/i), 'password')
    await userEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }))

    await waitFor(() => {
      expect(localStorage.getItem('smartlogix_role')).toBe('ADMIN')
    })
  })

  it('guarda pymeId correctamente después del login', async () => {
    const mockUser = {
      token: 'token123',
      role: 'USER',
      pymeId: '99',
      userId: '5'
    }

    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUser)
      })
    ))

    render(<App />)

    await userEvent.type(screen.getByLabelText(/Correo Electrónico/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/Contraseña/i), 'password')
    await userEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }))

    await waitFor(() => {
      expect(localStorage.getItem('smartlogix_pyme_id')).toBe('99')
      expect(localStorage.getItem('smartlogix_user_id')).toBe('5')
    })
  })

  it('navega a inventory al login y se mantiene la ruta', async () => {
    const mockUser = {
      token: 'token123',
      role: 'USER',
      pymeId: '50',
      userId: '1'
    }

    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUser)
      })
    ))

    render(<App />)

    await userEvent.type(screen.getByLabelText(/Correo Electrónico/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/Contraseña/i), 'password')
    await userEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }))

    await waitFor(() => {
      expect(screen.getByText(/Catálogo de Inventario/i)).toBeInTheDocument()
    })
  })

  it('restaura ruta correcta si cambia de vista antes de logout', async () => {
    const mockUser = {
      token: 'token123',
      role: 'USER',
      pymeId: '50',
      userId: '1'
    }

    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUser)
      })
    ))

    render(<App />)

    await userEvent.type(screen.getByLabelText(/Correo Electrónico/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/Contraseña/i), 'password')
    await userEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }))

    await waitFor(() => {
      expect(screen.getByText(/Catálogo de Inventario/i)).toBeInTheDocument()
    })

    // Cambiar a Orders
    await userEvent.click(screen.getByRole('button', { name: /Pedidos/i }))

    await waitFor(() => {
      expect(screen.getByText(/Gestión de Pedidos/i)).toBeInTheDocument()
    })

    // Logout
    await userEvent.click(screen.getByRole('button', { name: /Cerrar Sesión/i }))

    // Login nuevamente
    await userEvent.type(screen.getByLabelText(/Correo Electrónico/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/Contraseña/i), 'password')
    await userEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }))

    // Debería volver a Inventory por defecto
    await waitFor(() => {
      expect(screen.getByText(/Catálogo de Inventario/i)).toBeInTheDocument()
    })
  })

  it('error de login no afecta localStorage', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 401
      })
    ))

    // Preexistente en localStorage
    localStorage.setItem('smartlogix_jwt', 'old-token')

    render(<App />)

    await userEvent.type(screen.getByLabelText(/Correo Electrónico/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/Contraseña/i), 'wrongpassword')
    await userEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }))

    await waitFor(() => {
      expect(screen.getByText(/Credenciales inválidas/i)).toBeInTheDocument()
    })

    // Token anterior debe seguir intacto
    expect(localStorage.getItem('smartlogix_jwt')).toBe('old-token')
  })

  it('mostrará menú de usuarios solo si role es ADMIN', async () => {
    const mockUser = {
      token: 'token123',
      role: 'USER',
      pymeId: '50',
      userId: '1'
    }

    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUser)
      })
    ))

    render(<App />)

    await userEvent.type(screen.getByLabelText(/Correo Electrónico/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/Contraseña/i), 'password')
    await userEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }))

    await waitFor(() => {
      expect(screen.getByText(/Catálogo de Inventario/i)).toBeInTheDocument()
    })

    expect(screen.queryByRole('button', { name: /Gestión de Usuarios/i })).not.toBeInTheDocument()
  })
})
