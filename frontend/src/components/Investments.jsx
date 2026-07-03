import { useState, useEffect } from 'react'
import { apiUrl } from '../lib/api'

const fmt = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0)

const CATEGORIES = ['Hipoteca', 'Compra', 'Renovación', 'Servicios', 'Limpieza', 'Mantenimiento', 'Impuestos', 'Seguro', 'Cuota de Gestión', 'Otro']

const CAT_COLOR = {
  Hipoteca:            'badge-red',
  Compra:              'badge-red',
  Renovación:          'badge-yellow',
  Servicios:           'badge-blue',
  Limpieza:            'badge-green',
  Mantenimiento:       'badge-yellow',
  Impuestos:           'badge-red',
  Seguro:              'badge-blue',
  'Cuota de Gestión':  'badge-purple',
  Otro:                'badge-blue',
}

const today = () => new Date().toISOString().split('T')[0]
const EMPTY = { name: '', amount: '', date: today(), category: 'Hipoteca' }

export default function Investments() {
  const [items, setItems]   = useState([])
  const [form, setForm]     = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [filterCat, setFilterCat] = useState('All')

  const load = () => fetch(apiUrl('/api/investments')).then(r => r.json()).then(setItems)

  useEffect(() => { load() }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async e => {
    e.preventDefault()
    if (!form.name || !form.amount) return
    setSaving(true)
    await fetch(apiUrl('/api/investments'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: Number(form.amount) }),
    })
    setForm({ ...EMPTY, category: form.category })
    await load()
    setSaving(false)
  }

  const remove = async id => {
    if (!confirm('¿Eliminar este gasto?')) return
    await fetch(apiUrl(`/api/investments/${id}`), { method: 'DELETE' })
    load()
  }

  const total = items.reduce((s, i) => s + i.amount, 0)

  const byCategory = items.reduce((acc, i) => {
    acc[i.category] = (acc[i.category] || 0) + i.amount
    return acc
  }, {})

  const filtered = filterCat === 'All' ? items : items.filter(i => i.category === filterCat)
  const filteredTotal = filtered.reduce((s, i) => s + i.amount, 0)

  return (
    <div>
      <div className="page-header">
        <h2>Gastos e Inversión</h2>
        <p>Registra cada costo para ver tu ganancia neta real</p>
      </div>

      {/* Add Expense Form */}
      <div className="card">
        <h2>Agregar Gasto / Inversión</h2>
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Descripción</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="ej. Pago mensual de hipoteca" required />
            </div>
            <div className="form-group">
              <label>Monto ($)</label>
              <input type="number" min="0" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="1200" required />
            </div>
            <div className="form-group">
              <label>Fecha</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Categoría</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Guardando...' : '+ Agregar Gasto'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* By Category breakdown */}
      {Object.keys(byCategory).length > 0 && (
        <div className="stats-grid">
          {Object.entries(byCategory)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, amt]) => (
              <div
                className="stat-card"
                key={cat}
                style={{ cursor: 'pointer', outline: filterCat === cat ? '2px solid #ff5a5f' : 'none' }}
                onClick={() => setFilterCat(filterCat === cat ? 'All' : cat)}
              >
                <div className="label">{cat}</div>
                <div className="value negative">{fmt(amt)}</div>
              </div>
            ))}
        </div>
      )}

      {/* Expense List */}
      <div className="card">
        <div className="card-row">
          <h2>
            {filterCat === 'All' ? `Todos los Gastos (${items.length})` : `${filterCat} (${filtered.length})`}
            {filterCat !== 'All' && (
              <button
                onClick={() => setFilterCat('All')}
                style={{ marginLeft: 10, fontSize: 11, color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >
                quitar filtro
              </button>
            )}
          </h2>
          <span className="expense-amount">{fmt(filterCat === 'All' ? total : filteredTotal)}</span>
        </div>

        {filtered.length === 0 ? (
          <p className="empty">Aún no hay gastos. Agrega el primero arriba.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Categoría</th>
                <th>Fecha</th>
                <th>Monto</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {[...filtered].reverse().map(i => (
                <tr key={i.id}>
                  <td>{i.name}</td>
                  <td><span className={`badge ${CAT_COLOR[i.category] || 'badge-blue'}`}>{i.category}</span></td>
                  <td>{i.date}</td>
                  <td style={{ color: '#dc2626', fontWeight: 700 }}>{fmt(i.amount)}</td>
                  <td><button className="btn btn-danger" onClick={() => remove(i.id)}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
