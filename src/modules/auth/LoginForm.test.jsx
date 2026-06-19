import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginForm from './LoginForm'

describe('LoginForm', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renderiza el formulario de ingreso', () => {
    render(<LoginForm onLogin={() => {}} />)

    expect(screen.getByLabelText(/Correo Electrónico/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Iniciar Sesión/i })).toBeInTheDocument()
  })

  it('envía el formulario y guarda los datos en localStorage', async () => {
    const onLogin = vi.fn()
    const mockUser = {
      token: 'token-123',
      pymeId: '99',
      role: 'USER',
      userId: '5'
    }

    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUser)
      })
    ))

    render(<LoginForm onLogin={onLogin} />)

    await userEvent.type(screen.getByLabelText(/Correo Electrónico/i), 'test@smartlogix.com')
    await userEvent.type(screen.getByLabelText(/Contraseña/i), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }))

    await waitFor(() => {
      expect(onLogin).toHaveBeenCalledWith(mockUser)
    })

    expect(localStorage.getItem('smartlogix_jwt')).toBe('token-123')
    expect(localStorage.getItem('smartlogix_pyme_id')).toBe('99')
    expect(localStorage.getItem('smartlogix_role')).toBe('USER')
    expect(localStorage.getItem('smartlogix_user_id')).toBe('5')
  })

  it('muestra un mensaje de error cuando el login falla', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Credenciales inválidas' })
      })
    ))

    render(<LoginForm onLogin={() => {}} />)

    await userEvent.type(screen.getByLabelText(/Correo Electrónico/i), 'wrong@smartlogix.com')
    await userEvent.type(screen.getByLabelText(/Contraseña/i), 'wrongpass')
    await userEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }))

    await waitFor(() => {
      expect(screen.getByText(/Credenciales inválidas o error de conexión con SmartLogix./i)).toBeInTheDocument()
    })
  })
})
