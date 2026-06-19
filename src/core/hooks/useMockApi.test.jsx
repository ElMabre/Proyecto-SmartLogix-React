import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react-dom/test-utils'
import { useMockApi } from './useMockApi'

vi.mock('../storage/mockDatabase', () => ({
  getCollection: vi.fn(),
  saveToCollection: vi.fn()
}))

import { getCollection, saveToCollection } from '../storage/mockDatabase'

const TestComponent = ({ collectionName }) => {
  const { data, loading, error, fetchData, createData } = useMockApi(collectionName)

  return (
    <div>
      <div>{loading ? 'loading' : 'idle'}</div>
      <div>{error}</div>
      <div data-testid="data">{JSON.stringify(data)}</div>
      <button onClick={fetchData}>fetch</button>
      <button onClick={() => createData({ name: 'Test item' })}>create</button>
    </div>
  )
}

describe('useMockApi', () => {
  beforeEach(() => {
    // No usar timers falsos; operaciones del hook son síncronas ahora
    getCollection.mockReset()
    saveToCollection.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('fetchData carga datos y actualiza el estado', async () => {
    getCollection.mockReturnValue([{ id: 1, name: 'Test item' }])

    render(<TestComponent collectionName="inventory" />)

    await userEvent.click(screen.getByRole('button', { name: /fetch/i }))

    await waitFor(() => {
      expect(screen.getByTestId('data')).toHaveTextContent('Test item')
    })
  })

  it('createData persiste el nuevo elemento y retorna true', async () => {
    getCollection.mockReturnValue([])
    saveToCollection.mockImplementation(() => {})

    render(<TestComponent collectionName="inventory" />)

    await userEvent.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => {
      expect(saveToCollection).toHaveBeenCalled()
      expect(screen.getByTestId('data')).toHaveTextContent('Test item')
    })
  })

  it('maneja error cuando getCollection falla', async () => {
    getCollection.mockImplementation(() => {
      throw new Error('fallo de DB')
    })

    render(<TestComponent collectionName="inventory" />)

    await userEvent.click(screen.getByRole('button', { name: /fetch/i }))

    await waitFor(() => {
      expect(screen.getByText(/Error al comunicarse con el microservicio/i)).toBeInTheDocument()
    })
  })
})
