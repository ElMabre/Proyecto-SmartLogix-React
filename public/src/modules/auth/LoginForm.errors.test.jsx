import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginForm from './LoginForm'

describe('LoginForm - Manejo de Errores de Red', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('muestra error cuando falla la conexión (NetworkError)', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.reject(new Error('Network error'))
    ))

    render(<LoginForm onLogin={() => {}} />)

    await userEvent.type(screen.getByLabelText(/Correo Electrónico/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/Contraseña/i), 'password')
    await userEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }))

    await waitFor(() => {
      expect(screen.getByText(/Error al conectar con el servidor/i)).toBeInTheDocument()
    })
  })

  it('muestra error 401 (Credenciales inválidas)', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Invalid credentials' })
      })
    ))

    render(<LoginForm onLogin={() => {}} />)

    await userEvent.type(screen.getByLabelText(/Correo Electrónico/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/Contraseña/i), 'wrongpassword')
    await userEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }))

    await waitFor(() => {
      expect(screen.getByText(/Credenciales inválidas o error de conexión/i)).toBeInTheDocument()
    })
  })

  it('muestra error 500 (Error del servidor)', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Internal server error' })
      })
    ))

    render(<LoginForm onLogin={() => {}} />)

    await userEvent.type(screen.getByLabelText(/Correo Electrónico/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/Contraseña/i), 'password')
    await userEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }))

    await waitFor(() => {
      expect(screen.getByText(/Credenciales inválidas o error de conexión/i)).toBeInTheDocument()
    })
  })

  it('muestra estado loading durante el fetch', async () => {
    let resolveLogin
    vi.stubGlobal('fetch', vi.fn(() =>
      new Promise((resolve) => {
        resolveLogin = resolve
      })
    ))

    render(<LoginForm onLogin={() => {}} />)

    await userEvent.type(screen.getByLabelText(/Correo Electrónico/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/Contraseña/i), 'password')
    await userEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Conectando/i })).toBeInTheDocument()
    })

    resolveLogin({
      ok: true,
      json: () => Promise.resolve({ token: 'token123', role: 'USER', pymeId: '50', userId: '1' })
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Iniciar Sesión/i })).toBeInTheDocument()
    })
  })

  it('desactiva botón durante el envío', async () => {
    let resolveLogin
    vi.stubGlobal('fetch', vi.fn(() =>
      new Promise((resolve) => {
        resolveLogin = resolve
      })
    ))

    render(<LoginForm onLogin={() => {}} />)

    await userEvent.type(screen.getByLabelText(/Correo Electrónico/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/Contraseña/i), 'password')
    await userEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }))

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()

    resolveLogin({
      ok: true,
      json: () => Promise.resolve({ token: 'token123', role: 'USER', pymeId: '50', userId: '1' })
    })

    await waitFor(() => {
      expect(button).not.toBeDisabled()
    })
  })

  it('maneja timeout del servidor', async () => {
    // Simular timeout como rechazo inmediato para evitar fragilidad con timers falsos
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('Request timeout'))))

    render(<LoginForm onLogin={() => {}} />)

    await userEvent.type(screen.getByLabelText(/Correo Electrónico/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/Contraseña/i), 'password')
    await userEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }))

    await waitFor(() => {
      expect(screen.getByText(/Error al conectar/i)).toBeInTheDocument()
    })
  })

  it('permite reintentar después de error', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ token: 'token123', role: 'USER', pymeId: '50', userId: '1' })
      })

    vi.stubGlobal('fetch', fetchMock)

    const onLogin = vi.fn()
    render(<LoginForm onLogin={onLogin} />)

    // Primer intento fallido
    await userEvent.type(screen.getByLabelText(/Correo Electrónico/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/Contraseña/i), 'password')
    await userEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }))

    await waitFor(() => {
      expect(screen.getByText(/Credenciales inválidas/i)).toBeInTheDocument()
    })

    // Reintentar
    await userEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }))

    await waitFor(() => {
      expect(onLogin).toHaveBeenCalled()
    })
  })
})
