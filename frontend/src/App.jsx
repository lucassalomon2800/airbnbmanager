import { useState } from 'react'
import Dashboard from './components/Dashboard'
import Bookings from './components/Bookings'
import Investments from './components/Investments'
import Inventory from './components/Inventory'

const TABS = [
  { id: 'dashboard', label: '📊 Panel'      },
  { id: 'bookings',  label: '📅 Reservas'   },
  { id: 'expenses',  label: '💸 Gastos'     },
  { id: 'inventory', label: '📦 Inventario' },
]

export default function App() {
  const [tab, setTab] = useState('dashboard')

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">🏠</div>
          <h1>AirManager</h1>
          <p>Seguimiento de Inversión</p>
        </div>
        <nav>
          {TABS.map(t => (
            <button
              key={t.id}
              className={`nav-btn ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          Controla reservas, gastos y la ganancia real de tu alquiler a corto plazo.
        </div>
      </aside>

      <main className="content">
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'bookings'  && <Bookings  />}
        {tab === 'expenses'  && <Investments />}
        {tab === 'inventory' && <Inventory />}
      </main>
    </div>
  )
}
