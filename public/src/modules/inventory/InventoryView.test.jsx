import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InventoryView from './InventoryView'

describe('InventoryView', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('renderiza el título y el botón de nuevo producto', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    ))

    render(<InventoryView />)

    await waitFor(() => {
      expect(screen.getByText(/Catálogo de Inventario/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Nuevo Producto/i })).toBeInTheDocument()
    })
  })

  it('carga productos desde el servidor', async () => {
    const mockProducts = [
      { id: 1, name: 'Producto A', totalQuantity: 50, availableQuantity: 40, reservedQuantity: 10 },
      { id: 2, name: 'Producto B', totalQuantity: 30, availableQuantity: 30, reservedQuantity: 0 }
    ]

    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockProducts)
      })
    ))

    render(<InventoryView />)

    await waitFor(() => {
      expect(screen.getByText('Producto A')).toBeInTheDocument()
      expect(screen.getByText('Producto B')).toBeInTheDocument()
    })
  })

  it('muestra mensaje cuando no hay productos', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    ))

    render(<InventoryView />)

    await waitFor(() => {
      expect(screen.getByText(/No hay productos en el inventario actualmente/i)).toBeInTheDocument()
    })
  })

  it('abre el formulario cuando se hace click en Nuevo Producto', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    ))

    render(<InventoryView />)

    await userEvent.click(screen.getByRole('button', { name: /Nuevo Producto/i }))

    expect(screen.getByLabelText(/Nombre del Producto/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Cantidad/i)).toBeInTheDocument()
  })

  it('valida que nombre y cantidad sean válidos antes de enviar', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    ))

    render(<InventoryView />)

    await userEvent.click(screen.getByRole('button', { name: /Nuevo Producto/i }))
    await userEvent.click(screen.getByRole('button', { name: /Guardar Producto/i }))

    await waitFor(() => {
      expect(screen.getByText(/Por favor, ingresa un nombre válido y una cantidad mayor a 0/i)).toBeInTheDocument()
    })
  })

  it('envía un nuevo producto al servidor', async () => {
    const fetchMock = vi.fn((url, config) => {
      if (config.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 3, name: 'Nuevo' })
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
    await userEvent.type(screen.getByLabelText(/Nombre del Producto/i), 'Mi Producto')
    await userEvent.type(screen.getByLabelText(/Cantidad/i), '25')
    await userEvent.click(screen.getByRole('button', { name: /Guardar Producto/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/products'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Mi Producto')
        })
      )
    })
  })
})
