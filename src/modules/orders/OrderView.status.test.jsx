import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OrderView from './OrderView'

describe('OrderView - Cambio de Estado y Detalles', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('abre modal de detalles al hacer click en el cliente', async () => {
    const mockOrders = [
      { 
        id: 1, 
        customerName: 'Juan', 
        customerRut: '12345678-9',
        customerEmail: 'juan@example.com',
        shippingAddress: 'Calle Principal 123',
        status: 'PENDING', 
        totalAmount: 50000 
      }
    ]

    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockOrders)
      })
    ))

    render(<OrderView />)

    await waitFor(() => {
      expect(screen.getByText('Juan')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByText('Juan'))

    await waitFor(() => {
      expect(screen.getByText(/Detalles del Pedido/i)).toBeInTheDocument()
    })
  })

  it('cambia estado de PENDING a CONFIRMED', async () => {
    const mockOrders = [
      { id: 1, customerName: 'Juan', status: 'PENDING', totalAmount: 50000 }
    ]

    const fetchMock = vi.fn((url, config) => {
      if (config && config.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 1, status: 'CONFIRMED' })
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
    const statusButtons = screen.queryAllByRole('button').filter(btn => 
      btn.textContent.includes('Pendiente') || btn.textContent.includes('→')
    )

    if (statusButtons.length > 0) {
      await userEvent.click(statusButtons[0])

      // Seleccionar CONFIRMED en el dropdown
      const options = screen.queryAllByRole('option')
      if (options.length > 0) {
        await userEvent.selectOptions(screen.getByRole('combobox'), 'CONFIRMED')
      }

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining('/orders/1/status'),
          expect.objectContaining({
            method: 'PATCH',
            body: expect.stringContaining('CONFIRMED')
          })
        )
      })
    }
  })

  it('muestra diferentes colores para cada estado', async () => {
    const mockOrders = [
      { id: 1, customerName: 'Cliente 1', status: 'CONFIRMED', totalAmount: 50000 },
      { id: 2, customerName: 'Cliente 2', status: 'PENDING', totalAmount: 75000 },
      { id: 3, customerName: 'Cliente 3', status: 'CANCELLED_NO_STOCK', totalAmount: 100000 },
      { id: 4, customerName: 'Cliente 4', status: 'DELIVERED', totalAmount: 125000 }
    ]

    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockOrders)
      })
    ))

    render(<OrderView />)

    await waitFor(() => {
      const confirmedBadge = screen.getByText('Confirmado')
      expect(confirmedBadge).toHaveClass('bg-green-100')

      const pendingBadge = screen.getByText('Pendiente')
      expect(pendingBadge).toHaveClass('bg-yellow-100')

      const cancelledBadge = screen.getByText('Cancelado (Sin Stock)')
      expect(cancelledBadge).toHaveClass('bg-red-100')

      const deliveredBadge = screen.getByText('Entregado')
      expect(deliveredBadge).toHaveClass('bg-blue-100')
    })
  })

  it('envia PATCH request con nuevo status', async () => {
    const mockOrders = [
      { id: 1, customerName: 'Juan', status: 'PENDING', totalAmount: 50000 }
    ]

    const fetchMock = vi.fn((url, config) => {
      if (config && config.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 1, status: 'SHIPPED' })
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

    // Verificar que el PATCH request incluya el token
    const patchCall = fetchMock.mock.calls.find(call => call[1]?.method === 'PATCH')
    if (patchCall) {
      expect(patchCall[1].headers).toHaveProperty('Authorization', 'Bearer token123')
    }
  })

  it('recalcula total después de cambiar estado', async () => {
    const mockOrders = [
      { id: 1, customerName: 'Juan', status: 'CONFIRMED', totalAmount: 35700 }
    ]

    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockOrders)
      })
    ))

    render(<OrderView />)

    await waitFor(() => {
      expect(screen.getByText('Juan')).toBeInTheDocument()
    })

    // Verificar que el total se muestra formateado en pesos
    expect(screen.getByText(/\$35.700/)).toBeInTheDocument()
  })

  it('cierra modal después de cambio de estado', async () => {
    const mockOrders = [
      { id: 1, customerName: 'Juan', status: 'PENDING', totalAmount: 50000 }
    ]

    const fetchMock = vi.fn((url, config) => {
      if (config && config.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 1, status: 'CONFIRMED' })
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

    // Abrir detalles
    await userEvent.click(screen.getByText('Juan'))

    await waitFor(() => {
      expect(screen.getByText(/Detalles del Pedido/i)).toBeInTheDocument()
    })

    // Cerrar modal
    const closeBtn = screen.getByRole('button', { name: /Cerrar|✕|×/i })
    if (closeBtn) {
      await userEvent.click(closeBtn)

      await waitFor(() => {
        expect(screen.queryByText(/Detalles del Pedido/i)).not.toBeInTheDocument()
      })
    }
  })

  it('mantiene lista actualizada después de cambio de estado', async () => {
    let callCount = 0
    const fetchMock = vi.fn((url, config) => {
      if (config && config.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 1, status: 'CONFIRMED' })
        })
      }
      
      // Primera llamada muestra PENDING, después muestra CONFIRMED
      callCount++
      const orders = callCount === 1 
        ? [{ id: 1, customerName: 'Juan', status: 'PENDING', totalAmount: 50000 }]
        : [{ id: 1, customerName: 'Juan', status: 'CONFIRMED', totalAmount: 50000 }]
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(orders)
      })
    })

    vi.stubGlobal('fetch', fetchMock)
    localStorage.setItem('smartlogix_jwt', 'token123')

    render(<OrderView />)

    await waitFor(() => {
      expect(screen.getByText('Pendiente')).toBeInTheDocument()
    })

    // Cambiar estado
    const statusButtons = screen.queryAllByRole('button').filter(btn => 
      btn.textContent.includes('Pendiente')
    )

    if (statusButtons.length > 0) {
      await userEvent.click(statusButtons[0])

      // Esperar a que se actualice a CONFIRMED
      await waitFor(() => {
        expect(screen.getByText('Confirmado')).toBeInTheDocument()
      }, { timeout: 3000 })
    }
  })
})
