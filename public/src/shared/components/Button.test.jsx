import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Button from './Button'

describe('Button', () => {
  it('renderiza el texto correcto', () => {
    render(<Button>Enviar</Button>)
    expect(screen.getByRole('button', { name: /Enviar/i })).toBeInTheDocument()
  })

  it('llama onClick cuando se hace click', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Enviar</Button>)

    await userEvent.click(screen.getByRole('button', { name: /Enviar/i }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('deshabilita el botón cuando disabled es true', () => {
    render(<Button disabled>Enviar</Button>)
    expect(screen.getByRole('button', { name: /Enviar/i })).toBeDisabled()
  })

  it('aplica la clase de la variante secondary', () => {
    render(<Button variant="secondary">Enviar</Button>)
    expect(screen.getByRole('button', { name: /Enviar/i })).toHaveClass('bg-gray-200')
  })
})
