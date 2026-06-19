import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InventoryView from './InventoryView'

describe('InventoryView - Edición de Productos', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('abre el formulario en modo edición al hacer click en Editar', async () => {
    const mockProducts = [
      { id: 1, name: 'Producto A', totalQuantity: 50, availableQuantity: 40, reservedQuantity: 10 }
    ]

    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockProducts)
      })
    ))

    render(<InventoryView />)

    await waitFor(() => {
        expect(screen.getAllByText('Producto A').length).toBeGreaterThan(0)
    })

    await userEvent.click(screen.getByRole('button', { name: /Editar/i }))

    expect(screen.getByLabelText(/Nombre del Producto/i)).toHaveValue('Producto A')
    expect(screen.getByLabelText(/Cantidad/i)).toHaveValue(50)
  })

  it('precarga datos correctos en el formulario de edición', async () => {
    const mockProducts = [
      { id: 1, name: 'Caja Embalaje', totalQuantity: 100, availableQuantity: 85, reservedQuantity: 15 }
    ]

    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockProducts)
      })
    ))

    render(<InventoryView />)

    await waitFor(() => {
        expect(screen.getAllByText('Caja Embalaje').length).toBeGreaterThan(0)
    })

    await userEvent.click(screen.getByRole('button', { name: /Editar/i }))

    const nombreInput = screen.getByLabelText(/Nombre del Producto/i)
    const cantidadInput = screen.getByLabelText(/Cantidad/i)

    expect(nombreInput).toHaveValue('Caja Embalaje')
    expect(cantidadInput).toHaveValue(100)
  })

  it('envía PUT request al actualizar producto', async () => {
    const mockProducts = [
      { id: 1, name: 'Producto A', totalQuantity: 50, availableQuantity: 40, reservedQuantity: 10 }
    ]

    const fetchMock = vi.fn((url, config) => {
      if (config && config.method === 'PUT') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 1, name: 'Producto Actualizado' })
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockProducts)
      })
    })

    vi.stubGlobal('fetch', fetchMock)
    localStorage.setItem('smartlogix_jwt', 'token123')

    render(<InventoryView />)

    await waitFor(() => {
        expect(screen.getAllByText('Producto A').length).toBeGreaterThan(0)
    })

    await userEvent.click(screen.getByRole('button', { name: /Editar/i }))

    const nombreInput = screen.getByLabelText(/Nombre del Producto/i)
    await userEvent.clear(nombreInput)
    await userEvent.type(nombreInput, 'Producto Actualizado')

    await userEvent.click(screen.getByRole('button', { name: /Guardar Producto|Actualizar Producto/i }))

    await waitFor(() => {
      const putCall = fetchMock.mock.calls.find(call => call[1]?.method === 'PUT')
      expect(putCall).toBeTruthy()
      expect(putCall[0]).toContain('/products/1')
    })
  })

  it('cancela edición sin guardar', async () => {
    const mockProducts = [
      { id: 1, name: 'Producto A', totalQuantity: 50, availableQuantity: 40, reservedQuantity: 10 }
    ]

    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockProducts)
      })
    ))

    render(<InventoryView />)

    await waitFor(() => {
        expect(screen.getAllByText('Producto A').length).toBeGreaterThan(0)
    })

    await userEvent.click(screen.getByRole('button', { name: /Editar/i }))

    expect(screen.getByLabelText(/Nombre del Producto/i)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Cancelar Edición/i }))

    expect(screen.queryByLabelText(/Nombre del Producto/i)).not.toBeInTheDocument()
  })

  it('muestra stock bajo con color rojo (<10)', async () => {
    const mockProducts = [
      { id: 1, name: 'Stock Bajo', totalQuantity: 10, availableQuantity: 5, reservedQuantity: 5 }
    ]

    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockProducts)
      })
    ))

    render(<InventoryView />)

    await waitFor(() => {
      expect(screen.getByText('Stock Bajo')).toBeInTheDocument()
    })

    const matches = screen.getAllByText('5')
    const badge = matches.find(el => el.className && el.className.includes('bg-red-100'))
    expect(badge).toBeTruthy()
    expect(badge).toHaveClass('bg-red-100')
  })

  it('muestra stock normal con color verde (>=10)', async () => {
    const mockProducts = [
      { id: 1, name: 'Stock Normal', totalQuantity: 50, availableQuantity: 40, reservedQuantity: 10 }
    ]

    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockProducts)
      })
    ))

    render(<InventoryView />)

    await waitFor(() => {
      expect(screen.getByText('Stock Normal')).toBeInTheDocument()
    })

    const stockElement = screen.getByText('40')
    expect(stockElement).toHaveClass('bg-green-100')
  })

  it('ordena productos por ID ascendente', async () => {
    const mockProducts = [
      { id: 3, name: 'Tercero', totalQuantity: 10, availableQuantity: 10, reservedQuantity: 0 },
      { id: 1, name: 'Primero', totalQuantity: 10, availableQuantity: 10, reservedQuantity: 0 },
      { id: 2, name: 'Segundo', totalQuantity: 10, availableQuantity: 10, reservedQuantity: 0 }
    ]

    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockProducts)
      })
    ))

    render(<InventoryView />)

    await waitFor(() => {
      const rows = screen.getAllByRole('cell')
      const ids = rows.filter(cell => cell.textContent.startsWith('#')).map(cell => cell.textContent)
      expect(ids[0]).toContain('#1')
      expect(ids[1]).toContain('#2')
      expect(ids[2]).toContain('#3')
    })
  })

  it('recalcula disponible y reservado al actualizar total', async () => {
    const mockProducts = [
      { id: 1, name: 'Producto', totalQuantity: 50, availableQuantity: 40, reservedQuantity: 10 }
    ]

    const fetchMock = vi.fn((url, config) => {
      if (config && config.method === 'PUT') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 1 })
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockProducts)
      })
    })

    vi.stubGlobal('fetch', fetchMock)
    localStorage.setItem('smartlogix_jwt', 'token123')

    render(<InventoryView />)

    await waitFor(() => {
      expect(screen.getAllByText('Producto').length).toBeGreaterThan(0)
    })

    await userEvent.click(screen.getByRole('button', { name: /Editar/i }))

    const cantidadInput = screen.getByLabelText(/Cantidad/i)
    await userEvent.clear(cantidadInput)
    await userEvent.type(cantidadInput, '100')

    await userEvent.click(screen.getByRole('button', { name: /Guardar Producto|Actualizar Producto/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/products/1'),
        expect.objectContaining({
          body: expect.stringContaining('"totalQuantity":100')
        })
      )
    })
  })
})
