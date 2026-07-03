import { useState, useEffect } from 'react'
import { apiUrl } from '../lib/api'

const fmt = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0)
const nights = (ci, co) => Math.max(0, Math.ceil((new Date(co) - new Date(ci)) / 86400000))

const STATUS_LABEL = { confirmed: 'Confirmada', completed: 'Completada', cancelled: 'Cancelada' }

const EMPTY = {
  guestName: '',
  checkIn: '',
  checkOut: '',
  nightlyRate: '',
  platform: 'Airbnb',
  status: 'confirmed',
  notes: '',
}

export default function Bookings() {
  const [bookings, setBookings] = useState([])
  const [form, setForm]         = useState(EMPTY)
  const [saving, setSaving]     = useState(false)

  const load = () => fetch(apiUrl('/api/bookings')).then(r => r.json()).then(setBookings)

  useEffect(() => { load() }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async e => {
    e.preventDefault()
    if (!form.guestName || !form.checkIn || !form.checkOut || !form.nightlyRate) return
    if (form.checkOut <= form.checkIn) {
      alert('La fecha de salida debe ser posterior a la de entrada.')
      return
    }
    setSaving(true)
    await fetch(apiUrl('/api/bookings'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, nightlyRate: Number(form.nightlyRate) }),
    })
    setForm(EMPTY)
    await load()
    setSaving(false)
  }

  const remove = async id => {
    if (!confirm('¿Eliminar esta reserva?')) return
    await fetch(apiUrl(`/api/bookings/${id}`), { method: 'DELETE' })
    load()
  }

  const totalRevenue = bookings
    .filter(b => b.status !== 'cancelled')
    .reduce((s, b) => s + nights(b.checkIn, b.checkOut) * b.nightlyRate, 0)

  const previewNights = form.checkIn && form.checkOut ? nights(form.checkIn, form.checkOut) : 0
  const previewRevenue = previewNights * Number(form.nightlyRate || 0)

  return (
    <div>
      <div className="page-header">
        <h2>Reservas</h2>
        <p>Registra cada estadía y controla cuánto te genera cada noche</p>
      </div>

      {/* Add Booking Form */}
      <div className="card">
        <h2>Agregar Nueva Reserva</h2>
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Nombre del Huésped</label>
              <input value={form.guestName} onChange={e => set('guestName', e.target.value)} placeholder="Juan Pérez" required />
            </div>
            <div className="form-group">
              <label>Entrada</label>
              <input type="date" value={form.checkIn} onChange={e => set('checkIn', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Salida</label>
              <input type="date" value={form.checkOut} onChange={e => set('checkOut', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Tarifa por Noche ($)</label>
              <input type="number" min="1" step="0.01" value={form.nightlyRate} onChange={e => set('nightlyRate', e.target.value)} placeholder="150" required />
            </div>
            <div className="form-group">
              <label>Plataforma</label>
              <select value={form.platform} onChange={e => set('platform', e.target.value)}>
                <option>Airbnb</option>
                <option>VRBO</option>
                <option>Booking.com</option>
                <option>Directo</option>
                <option>Otro</option>
              </select>
            </div>
            <div className="form-group">
              <label>Estado</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="confirmed">Confirmada</option>
                <option value="completed">Completada</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Notas (opcional)</label>
              <input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Entrada anticipada, admite mascotas, etc." />
            </div>
          </div>

          {/* Preview */}
          {previewNights > 0 && (
            <div style={{ margin: '16px 0 0', padding: '12px 16px', background: '#f0fdf4', borderRadius: 8, display: 'flex', gap: 24, fontSize: 13 }}>
              <span>Noches: <strong>{previewNights}</strong></span>
              <span>Ingresos: <strong style={{ color: '#16a34a' }}>{fmt(previewRevenue)}</strong></span>
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Guardando...' : '+ Agregar Reserva'}
            </button>
          </div>
        </form>
      </div>

      {/* All Bookings */}
      <div className="card">
        <div className="card-row">
          <h2>Todas las Reservas ({bookings.length})</h2>
          <span className="revenue-amount">{fmt(totalRevenue)}</span>
        </div>

        {bookings.length === 0 ? (
          <p className="empty">Aún no hay reservas. Agrega la primera arriba.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Huésped</th>
                <th>Plataforma</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Noches</th>
                <th>Tarifa / Noche</th>
                <th>Ingresos</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {[...bookings].reverse().map(b => {
                const n = nights(b.checkIn, b.checkOut)
                const cancelled = b.status === 'cancelled'
                return (
                  <tr key={b.id} style={{ opacity: cancelled ? 0.5 : 1 }}>
                    <td><strong>{b.guestName}</strong>{b.notes && <span style={{ color: '#aaa', fontSize: 11, display: 'block' }}>{b.notes}</span>}</td>
                    <td>{b.platform}</td>
                    <td>{b.checkIn}</td>
                    <td>{b.checkOut}</td>
                    <td>{n}</td>
                    <td>{fmt(b.nightlyRate)}</td>
                    <td style={{ color: cancelled ? '#aaa' : '#16a34a', fontWeight: 700, textDecoration: cancelled ? 'line-through' : 'none' }}>
                      {fmt(n * b.nightlyRate)}
                    </td>
                    <td>
                      <span className={`badge ${b.status === 'completed' ? 'badge-green' : b.status === 'confirmed' ? 'badge-blue' : 'badge-red'}`}>
                        {STATUS_LABEL[b.status] || b.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-danger" onClick={() => remove(b.id)}>✕</button>
                    </td>
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
