import { Card } from './Card'
import './KpiCard.css'

export function KpiCard({ etiqueta, valor, icono, oscura = false, children, className = '' }) {
  return (
    <Card oscura={oscura} className={`kpi ${className}`}>
      <div className="kpi__cabecera">
        <div>
          <p className="kpi__etiqueta">{etiqueta}</p>
          {valor !== undefined && <h3 className="kpi__valor">{valor}</h3>}
        </div>
        {icono && <div className="kpi__icono">{icono}</div>}
      </div>
      {children}
    </Card>
  )
}
