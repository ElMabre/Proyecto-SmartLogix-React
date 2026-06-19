import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OrderView from './OrderView'

describe('OrderView - Validaciones de Entrada', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('rechaza cantidad menor a 1', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    ))

    render(<OrderView />)

    await userEvent.click(screen.getByRole('button', { name: /Nuevo Pedido/i }))
    const quantityInput = screen.getByLabelText(/Cantidad/i)
    await userEvent.clear(quantityInput)
    await userEvent.type(quantityInput, '0')
    await userEvent.click(screen.getByRole('button', { name: /Registrar Pedido/i }))

    await waitFor(() => {
      expect(screen.getByText(/Por favor, selecciona un producto y una cantidad válida/i)).toBeInTheDocument()
    })
  })

  it('rechaza cantidad negativa', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    ))

    render(<OrderView />)

    await userEvent.click(screen.getByRole('button', { name: /Nuevo Pedido/i }))
    const quantityInput = screen.getByLabelText(/Cantidad/i)
    await userEvent.clear(quantityInput)
    await userEvent.type(quantityInput, '-10')
    await userEvent.click(screen.getByRole('button', { name: /Registrar Pedido/i }))

    await waitFor(() => {
      expect(screen.getByText(/Por favor, selecciona un producto y una cantidad válida/i)).toBeInTheDocument()
    })
  })

  it('rechaza cuando no se selecciona producto', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    ))

    render(<OrderView />)

    await userEvent.click(screen.getByRole('button', { name: /Nuevo Pedido/i }))
    const quantityInput = screen.getByLabelText(/Cantidad/i)
    await userEvent.clear(quantityInput)
    await userEvent.type(quantityInput, '5')
    await userEvent.click(screen.getByRole('button', { name: /Registrar Pedido/i }))

    await waitFor(() => {
      expect(screen.getByText(/Por favor, selecciona un producto/i)).toBeInTheDocument()
    })
  })

  it('rechaza nombre de cliente vacío', async () => {
    const mockProducts = [{ id: 1, name: 'Producto A' }]

    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url.includes('/products')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProducts)
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    }))

    render(<OrderView />)

    await userEvent.click(screen.getByRole('button', { name: /Nuevo Pedido/i }))
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Producto A/i })).toBeInTheDocument()
    })

    await userEvent.selectOptions(screen.getByLabelText(/Producto/i), '1')
    const quantityInput = screen.getByLabelText(/Cantidad/i)
    await userEvent.clear(quantityInput)
    await userEvent.type(quantityInput, '5')
    // Dejar nombre vacío
    await userEvent.click(screen.getByRole('button', { name: /Registrar Pedido/i }))

    // Validación debe rechazarse
    expect(screen.getByLabelText(/Nombre del Cliente/i)).toHaveAttribute('required')
  })

  it('rechaza RUT vacío', async () => {
    const mockProducts = [{ id: 1, name: 'Producto A' }]

    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url.includes('/products')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProducts)
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    }))

    render(<OrderView />)

    await userEvent.click(screen.getByRole('button', { name: /Nuevo Pedido/i }))
    await waitFor(() => {
      expect(screen.getByLabelText(/Producto/i)).toBeInTheDocument()
    })
    await userEvent.type(screen.getByLabelText(/Nombre del Cliente/i), 'Juan')
    // Dejar RUT vacío
    expect(screen.getByLabelText(/RUT/i)).toHaveAttribute('required')
  })

  it('rechaza email inválido', async () => {
    const mockProducts = [{ id: 1, name: 'Producto A' }]

    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url.includes('/products')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProducts)
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    }))

    render(<OrderView />)

    await userEvent.click(screen.getByRole('button', { name: /Nuevo Pedido/i }))
    await waitFor(() => {
      expect(screen.getByLabelText(/Producto/i)).toBeInTheDocument()
    })
    await userEvent.type(screen.getByLabelText(/Correo Electrónico/i), 'notanemail')

    // Email debe ser tipo email
    expect(screen.getByLabelText(/Correo Electrónico/i)).toHaveAttribute('type', 'email')
  })

  it('acepta datos válidos y calcula correctamente', async () => {
    const mockProducts = [{ id: 1, name: 'Producto A' }]

    const fetchMock = vi.fn((url, config) => {
      if (config && config.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 1 })
        })
      }
      if (url.includes('/products')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProducts)
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
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Producto A/i })).toBeInTheDocument()
    })
    await userEvent.selectOptions(screen.getByLabelText(/Producto/i), '1')
    const quantityInput = screen.getByLabelText(/Cantidad/i)
    await userEvent.clear(quantityInput)
    await userEvent.type(quantityInput, '3')
    await userEvent.type(screen.getByLabelText(/Nombre del Cliente/i), 'Carlos López')
    await userEvent.type(screen.getByLabelText(/RUT/i), '12345678-9')
    await userEvent.type(screen.getByLabelText(/Correo Electrónico/i), 'carlos@example.com')
    await userEvent.type(screen.getByLabelText(/Dirección de Envío/i), 'Calle Principal 123')

    await userEvent.click(screen.getByRole('button', { name: /Registrar Pedido/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/orders'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Carlos López')
        })
      )
    })
  })

  it('convierte cantidad a número entero', async () => {
    const mockProducts = [{ id: 1, name: 'Producto A' }]

    const fetchMock = vi.fn((url, config) => {
      if (config && config.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 1 })
        })
      }
      if (url.includes('/products')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProducts)
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
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Producto A/i })).toBeInTheDocument()
    })
    const productSelect = screen.getByLabelText(/Producto/i)
    await userEvent.selectOptions(productSelect, '1')
    expect(productSelect).toHaveValue('1')
    const quantityInput = screen.getByLabelText(/Cantidad/i)
    await userEvent.clear(quantityInput)
    await userEvent.type(quantityInput, '2.7')
    await userEvent.type(screen.getByLabelText(/Nombre del Cliente/i), 'Test')
    await userEvent.type(screen.getByLabelText(/RUT/i), '12345678-9')
    await userEvent.type(screen.getByLabelText(/Correo Electrónico/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/Dirección de Envío/i), 'Calle Test')

    await userEvent.click(screen.getByRole('button', { name: /Registrar Pedido/i }))

    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find(call => call[1]?.method === 'POST')
      expect(postCall).toBeDefined()
      const payload = JSON.parse(postCall[1].body)
      expect(payload.items[0].quantity).toBe(2)
    })
  })

  it('limpia el formulario después de registrar pedido', async () => {
    const mockProducts = [{ id: 1, name: 'Producto A' }]

    const fetchMock = vi.fn((url, config) => {
      if (config && config.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 1 })
        })
      }
      if (url.includes('/products')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProducts)
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ id: 1, customerName: 'Pedido Registrado', status: 'PENDING' }])
      })
    })

    vi.stubGlobal('fetch', fetchMock)
    localStorage.setItem('smartlogix_jwt', 'token123')

    render(<OrderView />)

    await userEvent.click(screen.getByRole('button', { name: /Nuevo Pedido/i }))
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Producto A/i })).toBeInTheDocument()
    })
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
      expect(screen.queryByLabelText(/Nombre del Cliente/i)).not.toBeInTheDocument()
    })
  })
})
