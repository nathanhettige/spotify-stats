import { useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import type {ContributionResult, LoadingProgress} from "@/lib/spotify/services/contribution-service";
import {
  getContributionData
} from "@/lib/spotify/services/contribution-service"

interface UseContributionDataResult {
  data: ContributionResult | undefined
  isLoading: boolean
  error: Error | null
  progress: LoadingProgress | null
}

/**
 * Fetches contribution data for a Spotify user with incremental playlist
 * progress reporting. Results are stored in (and served from) the TanStack
 * Query cache using the same key as `contributionDataQueryOptions`, so a
 * subsequent `useQuery(contributionDataQueryOptions(userId))` call will be
 * satisfied from cache without an extra network round-trip.
 */
export function useContributionData(userId: string): UseContributionDataResult {
  const queryClient = useQueryClient()

  const [state, setState] = useState<UseContributionDataResult>(() => {
    // Seed from cache on first render if available
    const cached = queryClient.getQueryData<ContributionResult>([
      "spotify",
      "contributions",
      userId,
    ])
    return {
      data: cached,
      isLoading: !cached && !!userId,
      error: null,
      progress: null,
    }
  })

  useEffect(() => {
    if (!userId) {
      setState({
        data: undefined,
        isLoading: false,
        error: null,
        progress: null,
      })
      return
    }

    const queryKey = ["spotify", "contributions", userId] as const

    // Serve from cache if available
    const cached = queryClient.getQueryData<ContributionResult>(queryKey)
    if (cached) {
      setState({ data: cached, isLoading: false, error: null, progress: null })
      return
    }

    let cancelled = false
    setState({ data: undefined, isLoading: true, error: null, progress: null })

    getContributionData(userId, (progress) => {
      if (!cancelled) {
        setState((prev) => ({ ...prev, progress }))
      }
    })
      .then((result) => {
        if (!cancelled) {
          // Populate the TanStack Query cache so other subscribers get it instantly
          queryClient.setQueryData(queryKey, result)
          setState({
            data: result,
            isLoading: false,
            error: null,
            progress: null,
          })
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            data: undefined,
            isLoading: false,
            error: err instanceof Error ? err : new Error(String(err)),
            progress: null,
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [userId, queryClient])

  return state
}
