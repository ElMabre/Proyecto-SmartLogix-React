import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OrderView from './OrderView'

describe('OrderView', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('renderiza el título y botón de nuevo pedido', () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    ))

    render(<OrderView />)

    expect(screen.getByText(/Gestión de Pedidos/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Nuevo Pedido/i })).toBeInTheDocument()
  })

  it('carga pedidos y productos desde el servidor', async () => {
    const mockOrders = [
      { id: 1, customerName: 'Juan', status: 'CONFIRMED', totalAmount: 50000 },
      { id: 2, customerName: 'María', status: 'PENDING', totalAmount: 75000 }
    ]
    const mockProducts = [
      { id: 1, name: 'Producto A' },
      { id: 2, name: 'Producto B' }
    ]

    let callCount = 0
    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url.includes('/orders')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockOrders)
        })
      }
      if (url.includes('/products')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProducts)
        })
      }
    }))

    render(<OrderView />)

    await waitFor(() => {
      expect(screen.getByText('Juan')).toBeInTheDocument()
      expect(screen.getByText('María')).toBeInTheDocument()
    })
  })

  it('muestra mensaje cuando no hay pedidos', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    ))

    render(<OrderView />)

    await waitFor(() => {
      expect(screen.getByText(/No hay pedidos registrados actualmente/i)).toBeInTheDocument()
    })
  })

  it('abre el formulario de nuevo pedido', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    ))

    render(<OrderView />)

    await userEvent.click(screen.getByRole('button', { name: /Nuevo Pedido/i }))

    expect(screen.getByLabelText(/Nombre del Cliente/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/RUT/i)).toBeInTheDocument()
  })

  it('valida campos requeridos del formulario de pedido', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    ))

    render(<OrderView />)

    await userEvent.click(screen.getByRole('button', { name: /Nuevo Pedido/i }))
    await userEvent.click(screen.getByRole('button', { name: /Registrar Pedido/i }))

    await waitFor(() => {
      expect(screen.getByText(/Por favor, selecciona un producto y una cantidad válida/i)).toBeInTheDocument()
    })
  })

  it('calcula subtotal, IVA y total correctamente', async () => {
    const mockOrders = []
    const mockProducts = [{ id: 1, name: 'Producto Test' }]

    const fetchMock = vi.fn((url) => {
      if (url.includes('/orders')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockOrders)
        })
      }
      if (url.includes('/products')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProducts)
        })
      }
    })

    vi.stubGlobal('fetch', fetchMock)
    localStorage.setItem('smartlogix_jwt', 'token123')

    render(<OrderView />)

    await userEvent.click(screen.getByRole('button', { name: /Nuevo Pedido/i }))
    await userEvent.selectOptions(screen.getByLabelText(/Producto/i), '1')
    const quantityInput = screen.getByLabelText(/Cantidad/i)
    await userEvent.clear(quantityInput)
    await userEvent.type(quantityInput, '2')

    // Verificar que el cálculo es correcto: 15000 * 2 = 30000, IVA 19% = 5700, total = 35700
    expect(screen.getByText(/\$35.700/)).toBeInTheDocument()
  })

  it('traduce estados correctamente', async () => {
    const mockOrders = [
      { id: 1, customerName: 'Cliente', status: 'CONFIRMED', totalAmount: 50000 },
      { id: 2, customerName: 'Cliente 2', status: 'PENDING', totalAmount: 75000 }
    ]

    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockOrders)
      })
    ))

    render(<OrderView />)

    await waitFor(() => {
      expect(screen.getByText('Confirmado')).toBeInTheDocument()
      expect(screen.getByText('Pendiente')).toBeInTheDocument()
    })
  })
})
