import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InventoryView from './InventoryView'

describe('InventoryView - Manejo de Errores de Red', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('muestra error cuando falla obtener productos', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.reject(new Error('Network error'))
    ))

    render(<InventoryView />)

    await waitFor(() => {
      expect(screen.getByText(/Error al obtener el inventario desde el servidor/i)).toBeInTheDocument()
    })
  })

  it('muestra error 401 (sesión expirada)', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 401
      })
    ))

    render(<InventoryView />)

    await waitFor(() => {
      expect(screen.getByText(/Error al obtener el inventario/i)).toBeInTheDocument()
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

    render(<InventoryView />)

    await waitFor(() => {
      expect(screen.getByText(/Error al obtener el inventario/i)).toBeInTheDocument()
    })
  })

  it('muestra estado loading mientras obtiene productos', async () => {
    let resolveProducts
    vi.stubGlobal('fetch', vi.fn(() =>
      new Promise((resolve) => {
        resolveProducts = resolve
      })
    ))

    render(<InventoryView />)

    // Esperamos que se muestre loading
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Nuevo Producto|Cancelar/i })).toBeDisabled()
    })

    resolveProducts({
      ok: true,
      json: () => Promise.resolve([{ id: 1, name: 'Producto', totalQuantity: 50, availableQuantity: 40, reservedQuantity: 10 }])
    })

    await waitFor(() => {
      expect(screen.getAllByText('Producto').length).toBeGreaterThan(0)
    })
  })

  it('maneja error al guardar producto', async () => {
    const fetchMock = vi.fn((url, config) => {
      if (config && config.method === 'POST') {
        return Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ message: 'Invalid product' })
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    })

    vi.stubGlobal('fetch', fetchMock)
    localStorage.setItem('smartlogix_jwt', 'token123')

    render(<InventoryView />)

    await userEvent.click(screen.getByRole('button', { name: /Nuevo Producto/i }))
    await userEvent.type(screen.getByLabelText(/Nombre del Producto/i), 'Test')
    await userEvent.type(screen.getByLabelText(/Cantidad/i), '10')
    await userEvent.click(screen.getByRole('button', { name: /Guardar Producto/i }))

    await waitFor(() => {
      expect(screen.getByText(/Error al guardar el producto/i)).toBeInTheDocument()
    })
  })

  it('desactiva botón durante guardado', async () => {
    let resolvePost
    const fetchMock = vi.fn((url, config) => {
      if (config && config.method === 'POST') {
        return new Promise((resolve) => {
          resolvePost = resolve
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    })

    vi.stubGlobal('fetch', fetchMock)
    localStorage.setItem('smartlogix_jwt', 'token123')

    render(<InventoryView />)

    await userEvent.click(screen.getByRole('button', { name: /Nuevo Producto/i }))
    await userEvent.type(screen.getByLabelText(/Nombre del Producto/i), 'Test')
    await userEvent.type(screen.getByLabelText(/Cantidad/i), '10')
    await userEvent.click(screen.getByRole('button', { name: /Guardar Producto/i }))

    const newProductBtn = screen.getByRole('button', { name: /Nuevo Producto|Cancelar/i })
    expect(newProductBtn).toBeDisabled()

    resolvePost({
      ok: true,
      json: () => Promise.resolve({ id: 1 })
    })

    await waitFor(() => {
      expect(newProductBtn).not.toBeDisabled()
    })
  })

  it('reinicia loading a false después de error', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.reject(new Error('Network error'))
    ))

    render(<InventoryView />)

    await waitFor(() => {
      expect(screen.getByText(/Error al obtener el inventario/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Nuevo Producto|Cancelar/i })).not.toBeDisabled()
    })
  })

  it('envia token JWT en headers al guardar', async () => {
    const fetchMock = vi.fn((url, config) => {
      if (config && config.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 1 })
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    })

    vi.stubGlobal('fetch', fetchMock)
    const token = 'jwt-token-123'
    localStorage.setItem('smartlogix_jwt', token)

    render(<InventoryView />)

    await userEvent.click(screen.getByRole('button', { name: /Nuevo Producto/i }))
    await userEvent.type(screen.getByLabelText(/Nombre del Producto/i), 'Test')
    await userEvent.type(screen.getByLabelText(/Cantidad/i), '10')
    await userEvent.click(screen.getByRole('button', { name: /Guardar Producto/i }))

    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find(call => call[1]?.method === 'POST')
      expect(postCall[1].headers).toHaveProperty('Authorization', `Bearer ${token}`)
    })
  })

  it('maneja JSON malformado en respuesta', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      })
    ))

    render(<InventoryView />)

    await waitFor(() => {
      expect(screen.getByText(/Error/i)).toBeInTheDocument()
    })
  })
})
