import './GraficoTorta.css'

export function GraficoTorta({ segmentos }) {
  const total = segmentos.reduce((suma, segmento) => suma + segmento.valor, 0)

  let acumulado = 0
  const tramos = segmentos.map((segmento) => {
    const inicio = total ? (acumulado / total) * 360 : 0
    acumulado += segmento.valor
    const fin = total ? (acumulado / total) * 360 : 0
    return `${segmento.color} ${inicio}deg ${fin}deg`
  })

  const gradiente = total
    ? `conic-gradient(${tramos.join(', ')})`
    : 'conic-gradient(var(--color-surface-container-high) 0deg 360deg)'

  return (
    <div className="grafico-torta">
      <div className="grafico-torta__circulo" style={{ background: gradiente }}>
        <div className="grafico-torta__centro">
          <span className="grafico-torta__total">{total}</span>
          <span className="grafico-torta__total-etiqueta">Total</span>
        </div>
      </div>

      <ul className="grafico-torta__leyenda">
        {segmentos.map((segmento) => (
          <li key={segmento.etiqueta} className="grafico-torta__item">
            <span className="grafico-torta__punto" style={{ backgroundColor: segmento.color }} />
            <span className="grafico-torta__etiqueta">{segmento.etiqueta}</span>
            <span className="grafico-torta__valor">
              {segmento.valor}
              {total > 0 && (
                <span className="grafico-torta__porcentaje">
                  {' '}
                  ({Math.round((segmento.valor / total) * 100)}%)
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
