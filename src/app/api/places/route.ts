import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const apiKey = searchParams.get('apiKey')

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    // If Google API key is provided, use Google Places Autocomplete
    if (apiKey && apiKey.trim()) {
      try {
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query.trim())}&key=${apiKey.trim()}&language=es&components=country:co`
        const response = await fetch(url, { signal: AbortSignal.timeout(5000) })

        if (!response.ok) {
          throw new Error('Google API error')
        }

        const data = await response.json()

        if (data.status === 'OK' && data.predictions) {
          const suggestions = data.predictions.map(
            (p: { place_id: string; description: string; structured_formatting?: { main_text: string; secondary_text: string } }) => ({
              id: p.place_id,
              text: p.description,
              mainText: p.structured_formatting?.main_text || p.description.split(',')[0],
              secondaryText: p.structured_formatting?.secondary_text || p.description.split(',').slice(1).join(',').trim(),
              provider: 'google'
            })
          )
          return NextResponse.json({ suggestions })
        }

        if (data.status === 'REQUEST_DENIED') {
          return NextResponse.json({ error: 'API key invalida', suggestions: [] }, { status: 403 })
        }
      } catch {
        // Fall through to Nominatim
      }
    }

    // Fallback: Nominatim search
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query.trim())},+Colombia&format=json&limit=5&addressdetails=1&countrycodes=co`
      const response = await fetch(url, {
        headers: { 'User-Agent': 'FleteVolquetas/1.0' },
        signal: AbortSignal.timeout(5000)
      })

      if (!response.ok) {
        return NextResponse.json({ suggestions: [] })
      }

      const data = await response.json()
      const suggestions = data.map(
        (item: { place_id: string; display_name: string; type: string }) => ({
          id: `nominatim-${item.place_id}`,
          text: item.display_name,
          mainText: item.display_name.split(',')[0],
          secondaryText: item.display_name.split(',').slice(1).join(',').trim(),
          provider: 'openstreetmap'
        })
      )
      return NextResponse.json({ suggestions })
    } catch {
      return NextResponse.json({ suggestions: [] })
    }
  } catch {
    return NextResponse.json({ suggestions: [] })
  }
}
