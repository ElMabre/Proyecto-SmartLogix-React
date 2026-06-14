import { render, screen } from '@testing-library/react'
import Card from './Card'

describe('Card', () => {
  it('muestra el título cuando se pasa la prop title', () => {
    render(
      <Card title="Mi tarjeta">
        <p>Contenido</p>
      </Card>
    )

    expect(screen.getByText('Mi tarjeta')).toBeInTheDocument()
    expect(screen.getByText('Contenido')).toBeInTheDocument()
  })

  it('renderiza solo children cuando no se pasa title', () => {
    render(
      <Card>
        <p>Solo contenido</p>
      </Card>
    )

    expect(screen.queryByText('Mi tarjeta')).not.toBeInTheDocument()
    expect(screen.getByText('Solo contenido')).toBeInTheDocument()
  })
})
