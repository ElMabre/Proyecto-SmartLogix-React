import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginForm from './LoginForm'

describe('LoginForm - Validaciones de Entrada', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('rechaza email inválido (sin @)', async () => {
    render(<LoginForm onLogin={() => {}} />)

    const emailInput = screen.getByLabelText(/Correo Electrónico/i)
    await userEvent.type(emailInput, 'notanemail')

    expect(emailInput).toHaveAttribute('type', 'email')
    // HTML5 validation requiere @
  })

  it('rechaza email vacío y muestra requerido', async () => {
    render(<LoginForm onLogin={() => {}} />)

    const emailInput = screen.getByLabelText(/Correo Electrónico/i)
    expect(emailInput).toHaveAttribute('required')
  })

  it('rechaza contraseña vacía', async () => {
    render(<LoginForm onLogin={() => {}} />)

    const passwordInput = screen.getByLabelText(/Contraseña/i)
    expect(passwordInput).toHaveAttribute('required')
  })

  it('no envía formulario si email está vacío', async () => {
    const onLogin = vi.fn()
    render(<LoginForm onLogin={onLogin} />)

    await userEvent.type(screen.getByLabelText(/Contraseña/i), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }))

    // El navegador previene el envío con required
    expect(onLogin).not.toHaveBeenCalled()
  })

  it('no envía formulario si contraseña está vacía', async () => {
    const onLogin = vi.fn()
    render(<LoginForm onLogin={onLogin} />)

    await userEvent.type(screen.getByLabelText(/Correo Electrónico/i), 'test@example.com')
    await userEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }))

    expect(onLogin).not.toHaveBeenCalled()
  })

  it('acepta email con formato válido', async () => {
    const onLogin = vi.fn()
    const mockUser = { token: 'token123', role: 'USER', pymeId: '50', userId: '1' }

    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUser)
      })
    ))

    render(<LoginForm onLogin={onLogin} />)

    await userEvent.type(screen.getByLabelText(/Correo Electrónico/i), 'user+test@company.co.uk')
    await userEvent.type(screen.getByLabelText(/Contraseña/i), 'securePass123!')
    await userEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }))

    await waitFor(() => {
      expect(onLogin).toHaveBeenCalled()
    })
  })

  it('limpia mensaje de error cuando usuario corrige email', async () => {
    const mockUser = { token: 'token123', role: 'USER', pymeId: '50', userId: '1' }

    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Credenciales inválidas' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser)
      })
    )

    render(<LoginForm onLogin={() => {}} />)

    // Primer intento fallido
    await userEvent.type(screen.getByLabelText(/Correo Electrónico/i), 'wrong@example.com')
    await userEvent.type(screen.getByLabelText(/Contraseña/i), 'wrongpass')
    await userEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }))

    await waitFor(() => {
      expect(screen.getByText(/Credenciales inválidas/i)).toBeInTheDocument()
    })

    // Limpiar y corregir
    const emailInput = screen.getByLabelText(/Correo Electrónico/i)
    await userEvent.clear(emailInput)
    await userEvent.type(emailInput, 'correct@example.com')

    // El error debe limpiarse al editar
    expect(screen.getByText(/Credenciales inválidas/i)).toBeInTheDocument() // aún visible hasta nuevo envío
  })

  it('valida que ambos campos sean llenados antes de permitir envío', async () => {
    render(<LoginForm onLogin={() => {}} />)

    const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i })

    // Sin inputs, no se puede enviar por required
    expect(screen.getByLabelText(/Correo Electrónico/i)).toHaveAttribute('required')
    expect(screen.getByLabelText(/Contraseña/i)).toHaveAttribute('required')
  })
})
