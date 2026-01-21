import { useEffect, useState } from 'react'
import { buildApiUrl } from '../../config/api'

type TipoPago = {
  id?: number | string
  nombre?: string
  descripcion?: string
  [key: string]: any
}

interface UseTiposPagoOptions {
  url?: string
  labelKey?: string
  allowed?: string[]
}

const DEFAULT_URL = 'http://10.10.7.100:4000/api/finanzas/tipos-pago-detalle'

export const useTiposPago = ({ url = DEFAULT_URL, labelKey = 'nombre', allowed = [] }: UseTiposPagoOptions = {}) => {
  const [items, setItems] = useState<TipoPago[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const fetchUrl = url.startsWith('http') ? url : buildApiUrl(url)
        const res = await fetch(fetchUrl)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const rawList: TipoPago[] = Array.isArray(data)
          ? data
          : Array.isArray(data.data)
          ? data.data
          : data.tipos || []

        const normalize = (s: any) =>
          String(s || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .replace(/\s+/g, '_')
            .replace(/[^\w_]/g, '')

        const list = rawList
          .map(item => ({
            ...item,
            _normalized_label: normalize(item[labelKey] ?? item.nombre ?? item.descripcion ?? item.id)
          }))
          .filter(item => {
            if (!allowed || allowed.length === 0) return true
            return allowed.map(a => a.toLowerCase()).includes(String(item._normalized_label))
          })

        if (!cancelled) setItems(list)
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Error cargando tipos')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchData()
    return () => {
      cancelled = true
    }
  }, [url, labelKey, JSON.stringify(allowed)])

  return { items, loading, error }
}

export default useTiposPago
