import { initMockDB, getCollection, saveToCollection } from './mockDatabase'

describe('mockDatabase', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('initMockDB crea la base de datos inicial en localStorage', () => {
    initMockDB()
    const db = JSON.parse(localStorage.getItem('smartlogix_db'))

    expect(db).toBeTruthy()
    expect(db.users).toBeInstanceOf(Array)
    expect(db.inventory).toBeInstanceOf(Array)
    expect(db.orders).toBeInstanceOf(Array)
  })

  it('getCollection retorna la colección correcta', () => {
    initMockDB()

    expect(getCollection('users')).toEqual(expect.any(Array))
    expect(getCollection('inventory')).toEqual(expect.any(Array))
    expect(getCollection('noexist')).toEqual([])
  })

  it('saveToCollection persiste cambios en localStorage', () => {
    initMockDB()
    const newOrders = [{ id: 1, total: 100 }]

    saveToCollection('orders', newOrders)
    expect(JSON.parse(localStorage.getItem('smartlogix_db')).orders).toEqual(newOrders)
  })
})
