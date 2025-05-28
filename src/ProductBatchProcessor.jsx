// Entorno visual para procesar varios productos a la vez desde un solo bloque con separación por secciones
import { useState, useRef } from "react"

export default function ProductBatchProcessor() {
  const [input, setInput] = useState("")
  const [results, setResults] = useState([])
  const [errores, setErrores] = useState([])
  const [cotizacion, setCotizacion] = useState("")
  const tableRef = useRef(null)

  function parseProducts(text, cotiz) {
    const lines = text.split(/\n+/)
    const secciones = {}
    const fallidos = []
    let currentSection = ""

    for (const line of lines) {
      const trimmed = line.trim().replace(/^[-●*]+\s*/, "")
      if (!trimmed || trimmed.length < 2) continue

      const isCategoria = trimmed.match(/^tv\s*\d{2}(["'″]| pulgadas)?/i)
      const isTextoTitulo = !/\d{2,}/.test(trimmed) && trimmed.length > 4
      const isCategoriaForzada = /^(OPPO|JBL)$/i.test(trimmed)

      if (isCategoria || isTextoTitulo || isCategoriaForzada) {
        currentSection = trimmed.toUpperCase()
        if (!secciones[currentSection]) secciones[currentSection] = []
        continue
      }

      const match = trimmed.match(
        /(.*?)(\d{1,3}(?:[.,]\d{3})*)(?:\s*([$Gs]+))?[.,%]*\s*$/i
      )

      if (!match) {
        fallidos.push({ nombre: trimmed.toUpperCase(), categoria: currentSection })
        continue
      }

      const nombre = match[1].trim()
      const numeroTexto = match[2].trim().replace(/\./g, "")
      const moneda = (match[3] || "").toLowerCase()
      const limpio = numeroTexto.replace(/[^\d]/g, '')
      const valorNumerico = parseInt(limpio, 10)

      if (isNaN(valorNumerico) || valorNumerico < 10) {
        fallidos.push({ nombre: trimmed.toUpperCase(), categoria: currentSection })
        continue
      }

      let tipo = ""
      if (moneda.includes("$") || (valorNumerico <= 3000 && !moneda.includes("gs"))) tipo = "usd"
      else tipo = "gs"

      const simbolo = tipo === "usd" ? "$" : "Gs"
      const precio = valorNumerico
      const base = tipo === "usd" ? precio * parseFloat(cotiz) : precio
      const costo = Math.round(base * 1.03)
      const contado = Math.ceil(costo * 1.11 / 1000) * 1000
      const tarjeta = Math.ceil((costo * 1.11) / (1 - 0.0576) / 1000) * 1000
      const cuotas6 = Math.ceil((costo * 1.35) / 6 / 1000) * 1000
      const cuotas12 = Math.ceil((costo * 1.65) / 12 / 1000) * 1000
      const cuotas18 = Math.ceil((costo * 1.80) / 18 / 1000) * 1000
      const hendyla = Math.ceil((costo * 1.15) / (1 - 0.0777) / 1000) * 1000

      secciones[currentSection].push({
        nombre: nombre.toUpperCase(),
        original: `${simbolo} ${valorNumerico.toLocaleString("es-ES")}`,
        costo,
        contado,
        tarjeta,
        cuotas6,
        cuotas12,
        cuotas18,
        hendyla
      })
    }

    setErrores(fallidos)
    return secciones
  }

  function procesar() {
    if (!cotizacion || isNaN(parseFloat(cotizacion))) {
      alert("Por favor, ingresá la cotización del dólar antes de procesar.")
      return
    }
    const productosPorCategoria = parseProducts(input, cotizacion)
    setResults(productosPorCategoria)
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Cotización del dólar (Gs):</label>
        <input type="number" placeholder="Ej: 8000" value={cotizacion} onChange={(e) => setCotizacion(e.target.value)} className="w-32 border px-2 py-1" />
      </div>

      <textarea
        rows={10}
        placeholder="Pegá la lista completa de productos con precios al final..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="w-full border p-2"
      />

      <div className="flex gap-4">
        <button onClick={procesar} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">Procesar Lista</button>
      </div>

      {Object.keys(results).length > 0 && (
        <div ref={tableRef} className="overflow-x-auto mt-6">
          <table className="border-collapse border border-gray-300 w-full text-sm">
            <tbody>
              {Object.entries(results).flatMap(([categoria, items], idx) => (
                [
                  <tr key={`cat-${idx}`} className="bg-gray-100">
                    <td colSpan={9} className="font-bold text-left text-gray-800 px-2 py-2 border border-gray-300">
                      {categoria}
                    </td>
                  </tr>,
                  <tr className="bg-gray-200 text-xs">
                    <td className="text-left font-semibold px-2 py-1 border border-gray-300">PRODUCTO</td>
                    <th className="text-right px-2 py-1 border border-gray-300">S/F</th>
                    <th className="text-right px-2 py-1 border border-gray-300">C/F</th>
                    <th className="text-right px-2 py-1 border border-gray-300">CONT. EFE.</th>
                    <th className="text-right px-2 py-1 border border-gray-300">TARJETA</th>
                    <th className="text-right px-2 py-1 border border-gray-300">6 CUOTAS</th>
                    <th className="text-right px-2 py-1 border border-gray-300">12 CUOTAS</th>
                    <th className="text-right px-2 py-1 border border-gray-300">18 CUOTAS</th>
                    <th className="text-right px-2 py-1 border border-gray-300">HENDYLA</th>
                  </tr>,
                  ...items.map((r, i) => (
                    <tr key={`${categoria}-${i}`} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="text-left px-2 py-1 border border-gray-300">{r.nombre}</td>
                      <td className="text-right px-2 py-1 border border-gray-300">{r.original}</td>
                      <td className="text-right px-2 py-1 border border-gray-300">{r.costo.toLocaleString("es-ES")}</td>
                      <td className="text-right px-2 py-1 border border-gray-300">{r.contado.toLocaleString("es-ES")}</td>
                      <td className="text-right px-2 py-1 border border-gray-300">{r.tarjeta.toLocaleString("es-ES")}</td>
                      <td className="text-right px-2 py-1 border border-gray-300">{r.cuotas6.toLocaleString("es-ES")}</td>
                      <td className="text-right px-2 py-1 border border-gray-300">{r.cuotas12.toLocaleString("es-ES")}</td>
                      <td className="text-right px-2 py-1 border border-gray-300">{r.cuotas18.toLocaleString("es-ES")}</td>
                      <td className="text-right px-2 py-1 border border-gray-300">{r.hendyla.toLocaleString("es-ES")}</td>
                    </tr>
                  ))
                ]
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}