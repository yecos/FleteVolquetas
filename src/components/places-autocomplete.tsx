'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, X, MapPin, Loader2 } from 'lucide-react'
import { getLugaresEtiquetados, searchLugares, type LugarEtiquetado } from '@/lib/lugares'

interface PlaceSuggestion {
  id: string
  text: string
  mainText: string
  secondaryText: string
  provider: string
}

interface PlacesAutocompleteProps {
  value: string
  onChange: (val: string) => void
  placeholder: string
  icon?: React.ReactNode
  className?: string
}

export function PlacesAutocomplete({
  value,
  onChange,
  placeholder,
  icon,
  className,
}: PlacesAutocompleteProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [localSuggestions, setLocalSuggestions] = useState<PlaceSuggestion[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Convert local LugarEtiquetado to PlaceSuggestion
  const localToSuggestion = useCallback((lugar: LugarEtiquetado): PlaceSuggestion => ({
    id: lugar.id,
    text: lugar.address ? `${lugar.name}, ${lugar.address}` : lugar.name,
    mainText: lugar.name,
    secondaryText: lugar.address || '',
    provider: lugar.source, // 'etiquetado' | 'guardado'
  }), [])

  // Show labeled places when focusing on empty field
  useEffect(() => {
    if (isFocused && !value.trim()) {
      const all = getLugaresEtiquetados()
      setLocalSuggestions(all.slice(0, 12).map(localToSuggestion))
    }
  }, [isFocused, value, localToSuggestion])

  // Search both local and API with debounce
  const handleInputChange = useCallback(
    (newValue: string) => {
      onChange(newValue)

      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      if (!newValue.trim()) {
        setSuggestions([])
        const all = getLugaresEtiquetados()
        setLocalSuggestions(all.slice(0, 12).map(localToSuggestion))
        return
      }

      // Search local immediately
      const local = searchLugares(newValue)
      setLocalSuggestions(local.slice(0, 8).map(localToSuggestion))

      // Debounce API search
      setIsLoading(true)
      debounceRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/places?q=${encodeURIComponent(newValue.trim())}`)
          if (res.ok) {
            const data = await res.json()
            const apiSuggestions: PlaceSuggestion[] = data.suggestions || []
            // Deduplicate API results against local results
            const localNames = new Set(local.map(l => l.name.toLowerCase()))
            const filtered = apiSuggestions.filter(
              (s) => !localNames.has(s.mainText.toLowerCase())
            )
            setSuggestions(filtered)
          } else {
            setSuggestions([])
          }
        } catch {
          setSuggestions([])
        } finally {
          setIsLoading(false)
        }
      }, 350)
    },
    [onChange, localToSuggestion]
  )

  const handleSelect = useCallback(
    (suggestion: PlaceSuggestion) => {
      onChange(suggestion.text)
      setIsFocused(false)
      setSuggestions([])
      setLocalSuggestions([])
      inputRef.current?.blur()
    },
    [onChange]
  )

  const handleClear = useCallback(() => {
    onChange('')
    setSuggestions([])
    const all = getLugaresEtiquetados()
    setLocalSuggestions(all.slice(0, 12).map(localToSuggestion))
    inputRef.current?.focus()
  }, [onChange, localToSuggestion])

  const handleFocus = useCallback(() => {
    setIsFocused(true)
  }, [])

  const allSuggestions = [...localSuggestions, ...suggestions]
  const showDropdown = isFocused && allSuggestions.length > 0

  const renderProviderBadge = (provider: string) => {
    switch (provider) {
      case 'etiquetado':
        return (
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 h-5 bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 font-semibold"
          >
            ★
          </Badge>
        )
      case 'guardado':
        return (
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 h-5 bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100 font-semibold"
          >
            🔖
          </Badge>
        )
      case 'google':
        return (
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 h-5 bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100 font-bold"
          >
            G
          </Badge>
        )
      case 'openstreetmap':
        return (
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 h-5 bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100 font-bold"
          >
            OSM
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      {/* Icon on the left */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
        {icon ?? <Search className="w-4 h-4 text-slate-400" />}
      </div>

      {/* Input */}
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={handleFocus}
        placeholder={placeholder}
        className="h-10 pl-9 pr-8 bg-white border-slate-200 focus:border-emerald-400 focus:bg-white focus-visible:border-emerald-400 focus-visible:ring-emerald-400/20 text-sm"
      />

      {/* Right side: clear button or loading spinner */}
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {isLoading && (
          <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
        )}
        {value && !isLoading && (
          <button
            type="button"
            onClick={handleClear}
            className="p-0.5 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
            tabIndex={-1}
            aria-label="Limpiar campo"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200/80 max-h-60 overflow-y-auto scrollbar-thin">
          {/* Local places section */}
          {localSuggestions.length > 0 && (
            <div>
              {localSuggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-emerald-50 transition-colors group"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleSelect(s)
                  }}
                >
                  <MapPin className="w-4 h-4 text-emerald-500 shrink-0 group-hover:text-emerald-600 transition-colors" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-slate-800 truncate">
                        {s.mainText}
                      </span>
                      {renderProviderBadge(s.provider)}
                    </div>
                    {s.secondaryText && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {s.secondaryText}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Separator between local and API results */}
          {localSuggestions.length > 0 && suggestions.length > 0 && (
            <div className="mx-3 border-t border-slate-100" />
          )}

          {/* API results section */}
          {suggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-emerald-50 transition-colors group"
              onMouseDown={(e) => {
                e.preventDefault()
                handleSelect(s)
              }}
            >
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 group-hover:text-emerald-500 transition-colors" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-slate-800 truncate">
                    {s.mainText}
                  </span>
                  {renderProviderBadge(s.provider)}
                </div>
                {s.secondaryText && (
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {s.secondaryText}
                  </p>
                )}
              </div>
            </button>
          ))}

          {/* No results message */}
          {allSuggestions.length === 0 && !isLoading && value.trim().length >= 2 && (
            <div className="px-3 py-4 text-center text-sm text-slate-400">
              No se encontraron lugares
            </div>
          )}
        </div>
      )}
    </div>
  )
}
