import './GraficoBarras.css'

export function GraficoBarras({ datos }) {
  if (datos.length === 0) {
    return <p className="grafico-barras__vacio">Aún no hay datos para mostrar.</p>
  }

  const maximo = Math.max(...datos.map((dato) => dato.valor))

  return (
    <ul className="grafico-barras">
      {datos.map((dato) => (
        <li key={dato.etiqueta} className="grafico-barras__fila">
          <span className="grafico-barras__etiqueta">{dato.etiqueta}</span>
          <div className="grafico-barras__pista">
            <div
              className="grafico-barras__relleno"
              style={{ width: `${maximo ? (dato.valor / maximo) * 100 : 0}%` }}
            />
          </div>
          <span className="grafico-barras__valor">{dato.valor}</span>
        </li>
      ))}
    </ul>
  )
}
