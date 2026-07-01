import { useState, useEffect } from 'react'

const fmt = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0)
const nights = (ci, co) => Math.max(0, Math.ceil((new Date(co) - new Date(ci)) / 86400000))

const STATUS_LABEL = { confirmed: 'Confirmada', completed: 'Completada', cancelled: 'Cancelada' }

export default function Dashboard() {
  const [summary, setSummary]   = useState(null)
  const [bookings, setBookings] = useState([])

  useEffect(() => {
    fetch('/api/summary').then(r => r.json()).then(setSummary)
    fetch('/api/bookings').then(r => r.json()).then(b => setBookings([...b].reverse().slice(0, 6)))
  }, [])

  if (!summary) return <div className="loading">Cargando panel...</div>

  const roi = summary.totalExpenses > 0
    ? ((summary.totalRevenue / summary.totalExpenses) * 100).toFixed(1)
    : 0

  const monthlyEntries = Object.entries(summary.monthly || {}).sort().slice(-6)

  return (
    <div>
      <div className="page-header">
        <h2>Panel</h2>
        <p>Resumen de la inversión en tu apartamento de Airbnb</p>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">Ingresos Totales</div>
          <div className="value positive">{fmt(summary.totalRevenue)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Gastos Totales</div>
          <div className="value negative">{fmt(summary.totalExpenses)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Ganancia Neta</div>
          <div className={`value ${summary.netProfit >= 0 ? 'positive' : 'negative'}`}>
            {fmt(summary.netProfit)}
          </div>
        </div>
        <div className="stat-card">
          <div className="label">Reservas Totales</div>
          <div className="value">{summary.activeBookings}</div>
        </div>
        <div className="stat-card">
          <div className="label">Noches Reservadas</div>
          <div className="value">{summary.totalNights}</div>
        </div>
        <div className="stat-card">
          <div className="label">Tarifa Promedio/Noche</div>
          <div className="value">{fmt(summary.avgNightlyRate)}</div>
        </div>
      </div>

      {/* Profit progress */}
      {summary.totalExpenses > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2>Retorno de Inversión</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: '#666' }}>Ingresos vs Gastos</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: roi >= 100 ? '#16a34a' : '#ca8a04' }}>
              {roi}% recuperado
            </span>
          </div>
          <div className="profit-bar">
            <div className="profit-bar-fill" style={{ width: `${Math.min(roi, 100)}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: '#aaa' }}>
            <span>Gastos: {fmt(summary.totalExpenses)}</span>
            <span>Ingresos: {fmt(summary.totalRevenue)}</span>
          </div>
        </div>
      )}

      {/* Monthly Revenue */}
      {monthlyEntries.length > 0 && (
        <div className="card">
          <h2>Ingresos Mensuales</h2>
          <table>
            <thead>
              <tr>
                <th>Mes</th>
                <th>Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {monthlyEntries.reverse().map(([month, rev]) => (
                <tr key={month}>
                  <td>{new Date(month + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</td>
                  <td className="revenue-amount">{fmt(rev)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent Bookings */}
      <div className="card">
        <h2>Reservas Recientes</h2>
        {bookings.length === 0 ? (
          <p className="empty">Aún no hay reservas — agrega la primera en la pestaña Reservas.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Huésped</th>
                <th>Plataforma</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Noches</th>
                <th>Ingresos</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => {
                const n = nights(b.checkIn, b.checkOut)
                return (
                  <tr key={b.id}>
                    <td><strong>{b.guestName}</strong></td>
                    <td>{b.platform}</td>
                    <td>{b.checkIn}</td>
                    <td>{b.checkOut}</td>
                    <td>{n}</td>
                    <td style={{ color: '#16a34a', fontWeight: 700 }}>{fmt(n * b.nightlyRate)}</td>
                    <td>
                      <span className={`badge ${b.status === 'completed' ? 'badge-green' : b.status === 'confirmed' ? 'badge-blue' : 'badge-red'}`}>
                        {STATUS_LABEL[b.status] || b.status}
                      </span>
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
