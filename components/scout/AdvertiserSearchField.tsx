'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

export interface AdvertiserPage {
  page_id: string
  page_name: string
  ad_count: number
}

export function AdvertiserSearchField({
  onSelect,
  placeholder = 'Search for a brand (e.g. Gymshark)',
}: {
  onSelect: (page: AdvertiserPage) => void
  placeholder?: string
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AdvertiserPage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) return

    const timeout = setTimeout(async () => {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/meta/search-pages?q=${encodeURIComponent(trimmed)}`)
      const data = await res.json().catch(() => ({}))
      setLoading(false)
      if (res.ok) {
        setResults(data.pages ?? [])
        setOpen(true)
      } else {
        setError(data.error ?? 'Search failed')
        setResults([])
      }
    }, 400)
    return () => clearTimeout(timeout)
  }, [query])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            const value = e.target.value
            setQuery(value)
            if (value.trim().length < 2) setOpen(false)
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="pl-8"
        />
        {loading && <Loader2 className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg max-h-64 overflow-y-auto">
          {error ? (
            <p className="px-3 py-2.5 text-xs text-destructive">{error}</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2.5 text-xs text-muted-foreground">
              {loading ? 'Searching the Meta Ad Library…' : 'No matching advertisers found.'}
            </p>
          ) : (
            results.map((page) => (
              <button
                key={page.page_id}
                type="button"
                onClick={() => {
                  onSelect(page)
                  setQuery(page.page_name)
                  setOpen(false)
                }}
                className="w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center justify-between gap-2"
              >
                <span className="text-sm text-foreground truncate">{page.page_name}</span>
                <span className="text-[11px] text-muted-foreground shrink-0 font-mono">{page.ad_count} ads found</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
