"use client"

import { useState } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface UserSearchProps {
  onSearch: (userId: string | null) => void
  isSearching: boolean
}

export function UserSearch({ onSearch, isSearching }: UserSearchProps) {
  const [url, setUrl] = useState("")
  const [error, setError] = useState<string | null>(null)

  const extractUserId = (input: string): string | null => {
    // Try to extract user ID from Spotify URL
    // Formats:
    // https://open.spotify.com/user/USERNAME
    // spotify:user:USERNAME
    const urlMatch = input.match(/spotify\.com\/user\/([^?/]+)/)
    if (urlMatch) return urlMatch[1]

    const uriMatch = input.match(/spotify:user:([^?]+)/)
    if (uriMatch) return uriMatch[1]

    // If it looks like a plain username, use it directly
    if (/^[a-zA-Z0-9_-]+$/.test(input.trim())) {
      return input.trim()
    }

    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!url.trim()) {
      onSearch(null) // Reset to own profile
      return
    }

    const userId = extractUserId(url)
    if (!userId) {
      setError("Please enter a valid Spotify profile URL")
      return
    }

    onSearch(userId)
  }

  const handleClear = () => {
    setUrl("")
    setError(null)
    onSearch(null)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Paste Spotify profile URL..."
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                setError(null)
              }}
              className="bg-secondary pl-10 pr-10 text-sm"
            />
            {url && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button type="submit" disabled={isSearching} className="shrink-0">
            {isSearching ? "Loading..." : "Search"}
          </Button>
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    </form>
  )
}
