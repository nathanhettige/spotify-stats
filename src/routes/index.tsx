import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ListMusic, Mic2, Music } from "lucide-react"
import { RequireAuth } from "@/lib/spotify/auth/require-auth"
import Footer from "@/components/footer"
import { ProfileHeader } from "@/components/profile-header"
import meQueryOptions from "@/lib/spotify/api/me/me"
import { userQueryOptions } from "@/lib/spotify/api/users/user"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserSearch } from "@/components/user-search"
import { PlaylistsTab } from "@/components/playlists-tab"
import { TopArtistsTab } from "@/components/top-artists-tab"
import { TopTracksTab } from "@/components/top-tracks-tab"
import { ActivityHeatmap } from "@/components/activity-heatmap"
import { contributionDataQueryOptions } from "@/lib/spotify/services/contribution-service"

export const Route = createFileRoute("/")({
  component: IndexPage,
})

function IndexPage() {
  return (
    <RequireAuth>
      <App />
    </RequireAuth>
  )
}

function App() {
  const { data: me } = useQuery(meQueryOptions)

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [heatmapYear, setHeatmapYear] = useState(new Date().getFullYear())
  const {
    data: searchedUser,
    isLoading,
    isFetching,
  } = useQuery({
    ...userQueryOptions(selectedUserId!),
    enabled: !!selectedUserId,
  })

  const user = selectedUserId ? searchedUser : me
  const isLoadingProfile = selectedUserId ? isLoading : false

  const contributionUserId = user?.id ?? ""
  const { data: contributionData, isLoading: isLoadingContributions } =
    useQuery({
      ...contributionDataQueryOptions(contributionUserId),
      enabled: !!contributionUserId,
    })

  return (
    <div className="grid min-h-svh grid-rows-[1fr_auto] gap-4">
      <main className="min-w-0 space-y-10 p-4">
        <UserSearch
          onSearch={(userId) => setSelectedUserId(userId)}
          isSearching={isFetching}
        />

        {isLoadingProfile && (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            Loading profile...
          </div>
        )}

        {!isLoadingProfile && !user && (
          <div className="py-12 text-center text-muted-foreground">
            {selectedUserId
              ? "User not found or profile is private."
              : "Loading your profile..."}
          </div>
        )}

        {user && (
          <>
            <ProfileHeader
              followers={user.followers.total}
              name={user.display_name ?? ""}
              imageUrl={user.images[0]?.url ?? ""}
              profileUrl={user.external_urls.spotify}
            />

            <ActivityHeatmap
              activityData={contributionData?.byDate ?? {}}
              year={heatmapYear}
              onYearChange={setHeatmapYear}
              isLoading={isLoadingContributions}
            />

            <Tabs defaultValue="playlists">
              <TabsList className="w-full">
                <TabsTrigger value="playlists">
                  <ListMusic />
                  Playlists
                </TabsTrigger>
                {!selectedUserId && (
                  <TabsTrigger value="top-artists">
                    <Mic2 />
                    Top Artists
                  </TabsTrigger>
                )}
                {!selectedUserId && (
                  <TabsTrigger value="top-tracks">
                    <Music />
                    Top Tracks
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="playlists">
                <PlaylistsTab userId={user.id} />
              </TabsContent>

              {!selectedUserId && (
                <TabsContent value="top-artists">
                  <TopArtistsTab />
                </TabsContent>
              )}

              {!selectedUserId && (
                <TabsContent value="top-tracks">
                  <TopTracksTab />
                </TabsContent>
              )}
            </Tabs>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
