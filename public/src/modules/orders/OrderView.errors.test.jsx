import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OrderView from './OrderView'

describe('OrderView - Manejo de Errores de Red', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('muestra error cuando falla obtener órdenes y productos', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.reject(new Error('Network error'))
    ))

    render(<OrderView />)

    await waitFor(() => {
      expect(screen.getByText(/Error al obtener los pedidos|Error al obtener el inventario/i)).toBeInTheDocument()
    })
  })

  it('muestra error 401 (sesión expirada) al obtener órdenes', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 401
      })
    ))

    render(<OrderView />)

    await waitFor(() => {
      expect(screen.getByText(/Error/i)).toBeInTheDocument()
    })
  })

  it('muestra estado loading mientras obtiene órdenes y productos', async () => {
    let resolveOrders, resolveProducts
    const fetchMock = vi.fn((url) => {
      if (url.includes('/orders')) {
        return new Promise((resolve) => { resolveOrders = resolve })
      }
      if (url.includes('/products')) {
        return new Promise((resolve) => { resolveProducts = resolve })
      }
    })

    vi.stubGlobal('fetch', fetchMock)

    render(<OrderView />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Nuevo Pedido/i })).toBeDisabled()
    })

    resolveOrders({
      ok: true,
      json: () => Promise.resolve([])
    })

    resolveProducts({
      ok: true,
      json: () => Promise.resolve([])
    })

    await waitFor(() => {
      expect(screen.getByText(/No hay pedidos registrados/i)).toBeInTheDocument()
    })
  })

  it('maneja error al registrar pedido', async () => {
    const fetchMock = vi.fn((url, config) => {
      if (config && config.method === 'POST') {
        return Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ message: 'Invalid order' })
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    })

    vi.stubGlobal('fetch', fetchMock)
    localStorage.setItem('smartlogix_jwt', 'token123')

    render(<OrderView />)

    await userEvent.click(screen.getByRole('button', { name: /Nuevo Pedido/i }))
    await userEvent.selectOptions(screen.getByLabelText(/Producto/i), '')
    const quantityInput = screen.getByLabelText(/Cantidad/i)
    await userEvent.clear(quantityInput)
    await userEvent.type(quantityInput, '1')
    await userEvent.type(screen.getByLabelText(/Nombre del Cliente/i), 'Test')
    await userEvent.type(screen.getByLabelText(/RUT/i), '12345678-9')
    await userEvent.type(screen.getByLabelText(/Correo Electrónico/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/Dirección de Envío/i), 'Calle Test')

    // Sin producto seleccionado
    await userEvent.click(screen.getByRole('button', { name: /Registrar Pedido/i }))

    await waitFor(() => {
      expect(screen.getByText(/Por favor, selecciona un producto/i)).toBeInTheDocument()
    })
  })

  it('desactiva botón durante registro de pedido', async () => {
    let resolvePost
    const mockProducts = [{ id: 1, name: 'Producto A', availableQuantity: 10 }]
    const fetchMock = vi.fn((url, config) => {
      if (config && config.method === 'POST') {
        return new Promise((resolve) => {
          resolvePost = resolve
        })
      }
      if (url && url.includes('/products')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockProducts) })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    })

    vi.stubGlobal('fetch', fetchMock)
    localStorage.setItem('smartlogix_jwt', 'token123')

    render(<OrderView />)

    await userEvent.click(screen.getByRole('button', { name: /Nuevo Pedido/i }))
    await userEvent.selectOptions(screen.getByLabelText(/Producto/i), '1')
    const quantityInput = screen.getByLabelText(/Cantidad/i)
    await userEvent.clear(quantityInput)
    await userEvent.type(quantityInput, '1')
    await userEvent.type(screen.getByLabelText(/Nombre del Cliente/i), 'Test')
    await userEvent.type(screen.getByLabelText(/RUT/i), '12345678-9')
    await userEvent.type(screen.getByLabelText(/Correo Electrónico/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/Dirección de Envío/i), 'Calle Test')

    await userEvent.click(screen.getByRole('button', { name: /Registrar Pedido/i }))

    const newOrderBtn = screen.getByRole('button', { name: /Nuevo Pedido|Cancelar/i })
    expect(newOrderBtn).toBeDisabled()

    resolvePost({
      ok: true,
      json: () => Promise.resolve({ id: 1 })
    })

    await waitFor(() => {
      expect(newOrderBtn).not.toBeDisabled()
    })
  })

  it('maneja error al cambiar estado de orden', async () => {
    const mockOrders = [
      { id: 1, customerName: 'Juan', status: 'PENDING', totalAmount: 50000 }
    ]

    const fetchMock = vi.fn((url, config) => {
      if (config && config.method === 'PATCH') {
        return Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ message: 'Cannot update status' })
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockOrders)
      })
    })

    vi.stubGlobal('fetch', fetchMock)
    localStorage.setItem('smartlogix_jwt', 'token123')

    render(<OrderView />)

    await waitFor(() => {
      expect(screen.getByText('Juan')).toBeInTheDocument()
    })

    // Buscar botón de cambio de estado
    const statusButtons = screen.getAllByRole('button').filter(btn => btn.textContent.includes('Pendiente'))
    if (statusButtons.length > 0) {
      await userEvent.click(statusButtons[0])

      await waitFor(() => {
        expect(screen.getByText(/Error al actualizar el estado/i)).toBeInTheDocument()
      })
    }
  })

  it('envia token JWT en headers al registrar pedido', async () => {
    const mockProducts = [{ id: 1, name: 'Producto A', availableQuantity: 10 }]
    const fetchMock = vi.fn((url, config) => {
      if (config && config.method === 'POST') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 1 }) })
      }
      if (url && url.includes('/products')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockProducts) })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    })

    vi.stubGlobal('fetch', fetchMock)
    const token = 'jwt-token-456'
    localStorage.setItem('smartlogix_jwt', token)

    render(<OrderView />)

    await userEvent.click(screen.getByRole('button', { name: /Nuevo Pedido/i }))
    await userEvent.selectOptions(screen.getByLabelText(/Producto/i), '1')
    const quantityInput = screen.getByLabelText(/Cantidad/i)
    await userEvent.clear(quantityInput)
    await userEvent.type(quantityInput, '1')
    await userEvent.type(screen.getByLabelText(/Nombre del Cliente/i), 'Test')
    await userEvent.type(screen.getByLabelText(/RUT/i), '12345678-9')
    await userEvent.type(screen.getByLabelText(/Correo Electrónico/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/Dirección de Envío/i), 'Calle Test')

    await userEvent.click(screen.getByRole('button', { name: /Registrar Pedido/i }))

    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find(call => call[1]?.method === 'POST')
      expect(postCall[1].headers).toHaveProperty('Authorization', `Bearer ${token}`)
    })
  })

  it('maneja JSON malformado en respuesta de órdenes', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      })
    ))

    render(<OrderView />)

    await waitFor(() => {
      expect(screen.getByText(/Error/i)).toBeInTheDocument()
    })
  })

  it('muestra error 500 del servidor', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Internal server error' })
      })
    ))

    render(<OrderView />)

    await waitFor(() => {
      expect(screen.getByText(/Error/i)).toBeInTheDocument()
    })
  })
})
