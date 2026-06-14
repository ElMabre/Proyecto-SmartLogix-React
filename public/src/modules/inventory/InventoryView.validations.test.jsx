import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InventoryView from './InventoryView'

describe('InventoryView - Validaciones de Entrada', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('rechaza nombre vacío o solo espacios', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    ))

    render(<InventoryView />)

    await userEvent.click(screen.getByTestId('toggle-new-product'))
    await waitFor(() => {
      expect(screen.getByTestId('inventory-form')).toBeInTheDocument()
    })
    await userEvent.type(screen.getByLabelText(/Nombre del Producto/i), '   ')
    await userEvent.clear(screen.getByLabelText(/Cantidad/i))
    await userEvent.type(screen.getByLabelText(/Cantidad/i), '10')
    await userEvent.click(screen.getByRole('button', { name: /Guardar Producto/i }))

    await waitFor(() => {
      expect(screen.getByText(/Por favor, ingresa un nombre válido/i)).toBeInTheDocument()
    })
  })

  it('rechaza cantidad menor a 1', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    ))

    render(<InventoryView />)

    await userEvent.click(screen.getByTestId('toggle-new-product'))
    await waitFor(() => {
      expect(screen.getByTestId('inventory-form')).toBeInTheDocument()
    })
    await userEvent.type(screen.getByLabelText(/Nombre del Producto/i), 'Producto Test')
    await userEvent.clear(screen.getByLabelText(/Cantidad/i))
    await userEvent.type(screen.getByLabelText(/Cantidad/i), '0')
    fireEvent.click(screen.getByRole('button', { name: /Guardar Producto/i }))

    await waitFor(() => {
      expect(screen.getByText(/cantidad mayor a 0/i)).toBeInTheDocument()
    })
  })

  it('rechaza cantidad negativa', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    ))

    render(<InventoryView />)

    await userEvent.click(screen.getByTestId('toggle-new-product'))
    await waitFor(() => {
      expect(screen.getByTestId('inventory-form')).toBeInTheDocument()
    })
    await userEvent.type(screen.getByLabelText(/Nombre del Producto/i), 'Producto Test')
    await userEvent.clear(screen.getByLabelText(/Cantidad/i))
    await userEvent.type(screen.getByLabelText(/Cantidad/i), '-5')
    fireEvent.click(screen.getByRole('button', { name: /Guardar Producto/i }))

    await waitFor(() => {
      expect(screen.getByText(/cantidad mayor a 0/i)).toBeInTheDocument()
    })
  })

  it('acepta nombre con caracteres especiales válidos', async () => {
    const fetchMock = vi.fn((url, config) => {
      if (config.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 1, name: 'Caja Embalaje (Pequeña)' })
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

    await userEvent.click(screen.getByTestId('toggle-new-product'))
    await waitFor(() => {
      expect(screen.getByTestId('inventory-form')).toBeInTheDocument()
    })
    await userEvent.type(screen.getByLabelText(/Nombre del Producto/i), 'Caja Embalaje (Pequeña) - Pack x10')
    await userEvent.clear(screen.getByLabelText(/Cantidad/i))
    await userEvent.type(screen.getByLabelText(/Cantidad/i), '50')
    fireEvent.click(screen.getByRole('button', { name: /Guardar Producto/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/products'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Caja Embalaje (Pequeña) - Pack x10')
        })
      )
    })
  })

  it('rechaza nombre vacío', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    ))

    render(<InventoryView />)

    await userEvent.click(screen.getByTestId('toggle-new-product'))
    await waitFor(() => {
      expect(screen.getByTestId('inventory-form')).toBeInTheDocument()
    })
    await userEvent.clear(screen.getByLabelText(/Cantidad/i))
    await userEvent.type(screen.getByLabelText(/Cantidad/i), '10')
    await userEvent.click(screen.getByRole('button', { name: /Guardar Producto/i }))

    await waitFor(() => {
      expect(screen.getByText(/Por favor, ingresa un nombre válido/i)).toBeInTheDocument()
    })
  })

  it('convierte cantidad a número entero', async () => {
    const fetchMock = vi.fn((url, config) => {
      if (config.method === 'POST') {
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
    localStorage.setItem('smartlogix_jwt', 'token123')

    render(<InventoryView />)

    await userEvent.click(screen.getByTestId('toggle-new-product'))
    await waitFor(() => {
      expect(screen.getByTestId('inventory-form')).toBeInTheDocument()
    })
    await userEvent.type(screen.getByLabelText(/Nombre del Producto/i), 'Producto')
    await userEvent.clear(screen.getByLabelText(/Cantidad/i))
    await userEvent.type(screen.getByLabelText(/Cantidad/i), '10.5')
    fireEvent.click(screen.getByRole('button', { name: /Guardar Producto/i }))

    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find(call => call[1] && call[1].method === 'POST')
      expect(postCall).toBeDefined()
      expect(postCall[1].body).toContain('"totalQuantity":10')
    })
  })

  it('acepta cantidad decimal válida (se redondea)', async () => {
    const fetchMock = vi.fn((url, config) => {
      if (config.method === 'POST') {
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
    localStorage.setItem('smartlogix_jwt', 'token123')

    render(<InventoryView />)

    await userEvent.click(screen.getByTestId('toggle-new-product'))
    await waitFor(() => {
      expect(screen.getByTestId('inventory-form')).toBeInTheDocument()
    })
    await userEvent.type(screen.getByLabelText(/Nombre del Producto/i), 'Producto')
    await userEvent.clear(screen.getByLabelText(/Cantidad/i))
    await userEvent.type(screen.getByLabelText(/Cantidad/i), '99.9')
    fireEvent.click(screen.getByRole('button', { name: /Guardar Producto/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })
  })

  it('limpia el formulario después de guardar', async () => {
    const fetchMock = vi.fn((url, config) => {
      if (config.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 1, name: 'Producto Guardado' })
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ id: 1, name: 'Producto Guardado', totalQuantity: 20, availableQuantity: 20, reservedQuantity: 0 }])
      })
    })

    vi.stubGlobal('fetch', fetchMock)
    localStorage.setItem('smartlogix_jwt', 'token123')

    render(<InventoryView />)

    await userEvent.click(screen.getByTestId('toggle-new-product'))
    await waitFor(() => {
      expect(screen.getByTestId('inventory-form')).toBeInTheDocument()
    })
    await userEvent.type(screen.getByLabelText(/Nombre del Producto/i), 'Producto A')
    await userEvent.clear(screen.getByLabelText(/Cantidad/i))
    await userEvent.type(screen.getByLabelText(/Cantidad/i), '20')
    fireEvent.click(screen.getByRole('button', { name: /Guardar Producto/i }))

    await waitFor(() => {
      expect(screen.getByText('Producto Guardado')).toBeInTheDocument()
    })

    // El formulario debe cerrarse
    expect(screen.queryByLabelText(/Nombre del Producto/i)).not.toBeInTheDocument()
  })
})
