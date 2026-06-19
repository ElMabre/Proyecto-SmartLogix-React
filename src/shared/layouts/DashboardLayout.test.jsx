import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DashboardLayout from './DashboardLayout'

describe('DashboardLayout', () => {
  const renderLayout = (props) => render(
    <DashboardLayout {...props}>
      <div>Contenido principal</div>
    </DashboardLayout>
  )

  it('muestra las opciones de menú básicas y lanza onNavigate', async () => {
    const onNavigate = vi.fn()
    renderLayout({ onNavigate, currentPath: 'inventory', userRole: 'USER' })

    expect(screen.getByRole('button', { name: /Inventario/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Pedidos/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Gestión de Usuarios/i })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Pedidos/i }))
    expect(onNavigate).toHaveBeenCalledWith('orders')
  })

  it('incluye el menú de gestión de usuarios para ADMIN', () => {
    renderLayout({ onNavigate: () => {}, currentPath: 'users', userRole: 'ADMIN' })

    expect(screen.getByRole('button', { name: /Gestión de Usuarios/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cerrar Sesión/i })).toBeInTheDocument()
  })

  it('marca el item activo con la clase de estilo correspondiente', () => {
    renderLayout({ onNavigate: () => {}, currentPath: 'orders', userRole: 'ADMIN' })

    expect(screen.getByRole('button', { name: /Pedidos/i })).toHaveClass('bg-blue-600')
  })
})
