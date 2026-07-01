import { useState, useEffect } from 'react'

const CATEGORIES = ['Ropa de Cama', 'Artículos de Tocador', 'Productos de Limpieza', 'Cocina', 'Muebles', 'Electrónica', 'Seguridad', 'Otro']

const CAT_COLOR = {
  'Ropa de Cama':            'badge-blue',
  'Artículos de Tocador':    'badge-purple',
  'Productos de Limpieza':   'badge-green',
  Cocina:                    'badge-yellow',
  Muebles:                   'badge-red',
  Electrónica:               'badge-blue',
  Seguridad:                 'badge-red',
  Otro:                      'badge-blue',
}

const EMPTY = { name: '', category: 'Ropa de Cama', quantity: '', parLevel: '', unit: 'uds' }

export default function Inventory() {
  const [items, setItems]         = useState([])
  const [form, setForm]           = useState(EMPTY)
  const [saving, setSaving]       = useState(false)
  const [filterCat, setFilterCat] = useState('Todos')

  const load = () => fetch('/api/inventory').then(r => r.json()).then(setItems)

  useEffect(() => { load() }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async e => {
    e.preventDefault()
    if (!form.name || form.quantity === '') return
    setSaving(true)
    await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        quantity: Number(form.quantity),
        parLevel: Number(form.parLevel || 0),
      }),
    })
    setForm({ ...EMPTY, category: form.category, unit: form.unit })
    await load()
    setSaving(false)
  }

  const adjustQuantity = async (item, delta) => {
    const quantity = Math.max(0, item.quantity + delta)
    await fetch(`/api/inventory/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    })
    load()
  }

  const remove = async id => {
    if (!confirm('¿Eliminar este artículo del inventario?')) return
    await fetch(`/api/inventory/${id}`, { method: 'DELETE' })
    load()
  }

  const lowStock = items.filter(i => i.quantity <= i.parLevel)

  const filtered = filterCat === 'Todos' ? items : items.filter(i => i.category === filterCat)

  return (
    <div>
      <div className="page-header">
        <h2>Inventario</h2>
        <p>Controla los suministros disponibles y sabe cuándo reabastecer</p>
      </div>

      {/* Add Item Form */}
      <div className="card">
        <h2>Agregar Artículo al Inventario</h2>
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Nombre del Artículo</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="ej. Toallas de baño" required />
            </div>
            <div className="form-group">
              <label>Categoría</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Cantidad</label>
              <input type="number" min="0" step="1" value={form.quantity} onChange={e => set('quantity', e.target.value)} placeholder="10" required />
            </div>
            <div className="form-group">
              <label>Unidad</label>
              <input value={form.unit} onChange={e => set('unit', e.target.value)} placeholder="uds, rollos, botellas..." />
            </div>
            <div className="form-group">
              <label>Reabastecer En</label>
              <input type="number" min="0" step="1" value={form.parLevel} onChange={e => set('parLevel', e.target.value)} placeholder="2" />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Guardando...' : '+ Agregar Artículo'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Low stock warning */}
      {lowStock.length > 0 && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="label">Artículos con Poco Stock</div>
            <div className="value negative">{lowStock.length}</div>
          </div>
        </div>
      )}

      {/* Category filter chips */}
      {items.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {['Todos', ...new Set(items.map(i => i.category))].map(c => (
            <span
              key={c}
              className={`badge ${c === 'Todos' ? 'badge-blue' : CAT_COLOR[c] || 'badge-blue'}`}
              style={{ cursor: 'pointer', outline: filterCat === c ? '2px solid #ff5a5f' : 'none' }}
              onClick={() => setFilterCat(c)}
            >
              {c}
            </span>
          ))}
        </div>
      )}

      {/* Item List */}
      <div className="card">
        <div className="card-row">
          <h2>{filterCat === 'Todos' ? `Todos los Artículos (${items.length})` : `${filterCat} (${filtered.length})`}</h2>
        </div>

        {filtered.length === 0 ? (
          <p className="empty">Aún no hay artículos en el inventario. Agrega el primero arriba.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Artículo</th>
                <th>Categoría</th>
                <th>Cantidad</th>
                <th>Reabastecer En</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {[...filtered].reverse().map(i => {
                const low = i.quantity <= i.parLevel
                return (
                  <tr key={i.id}>
                    <td><strong>{i.name}</strong></td>
                    <td><span className={`badge ${CAT_COLOR[i.category] || 'badge-blue'}`}>{i.category}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button className="btn btn-danger" onClick={() => adjustQuantity(i, -1)}>-</button>
                        <span style={{ fontWeight: 700, minWidth: 40, textAlign: 'center' }}>{i.quantity} {i.unit}</span>
                        <button className="btn btn-danger" style={{ color: '#16a34a' }} onClick={() => adjustQuantity(i, 1)}>+</button>
                      </div>
                    </td>
                    <td>{i.parLevel} {i.unit}</td>
                    <td>{low
                      ? <span className="badge badge-red">Poco Stock</span>
                      : <span className="badge badge-green">En Stock</span>}
                    </td>
                    <td><button className="btn btn-danger" onClick={() => remove(i.id)}>✕</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
