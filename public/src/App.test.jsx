import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

vi.mock('./core/storage/mockDatabase', () => ({
  initMockDB: vi.fn()
}))

import { initMockDB } from './core/storage/mockDatabase'

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('renderiza LoginForm cuando no hay usuario autenticado', () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    ))

    render(<App />)

    expect(screen.getByText(/Ingreso a SmartLogix/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Iniciar Sesión/i })).toBeInTheDocument()
  })

  it('renderiza DashboardLayout cuando el usuario está autenticado', async () => {
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

  it('muestra InventoryView por defecto después del login', async () => {
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

  it('navega a Orders cuando se hace click en Pedidos', async () => {
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

    await userEvent.click(screen.getByRole('button', { name: /Pedidos/i }))

    await waitFor(() => {
      expect(screen.getByText(/Gestión de Pedidos/i)).toBeInTheDocument()
    })
  })

  it('no muestra Gestión de Usuarios para rol USER', async () => {
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
      expect(screen.queryByRole('button', { name: /Gestión de Usuarios/i })).not.toBeInTheDocument()
    })
  })

  it('muestra Gestión de Usuarios para rol ADMIN', async () => {
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
      expect(screen.getByRole('button', { name: /Gestión de Usuarios/i })).toBeInTheDocument()
    })
  })

  it('cierra sesión al hacer click en Cerrar Sesión', async () => {
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
      expect(screen.getByText(/Catálogo de Inventario/i)).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /Cerrar Sesión/i }))

    await waitFor(() => {
      expect(screen.getByText(/Ingreso a SmartLogix/i)).toBeInTheDocument()
    })
  })
})
