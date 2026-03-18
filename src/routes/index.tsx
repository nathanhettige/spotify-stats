import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { RequireAuth } from "@/lib/spotify/auth/require-auth"
import Footer from "@/components/footer"
import { ProfileHeader } from "@/components/profile-header"
import meQueryOptions from "@/lib/spotify/api/me/me"
import { userQueryOptions } from "@/lib/spotify/api/users/user"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserSearch } from "@/components/user-search"

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

  return (
    <div className="grid min-h-svh grid-rows-[1fr_auto] gap-4">
      <main className="space-y-10 p-4">
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

            <Tabs>
              <TabsList className="w-full">
                <TabsTrigger value="playlists">Playlists test</TabsTrigger>
                <TabsTrigger value="top-artists">Top Artists</TabsTrigger>
                <TabsTrigger value="top-tracks">Top Tracks</TabsTrigger>
              </TabsList>

              <TabsContent value="playlists">
                <div>Playlists</div>
              </TabsContent>

              <TabsContent value="top-artists">
                <div>Top Artists</div>
              </TabsContent>

              <TabsContent value="top-tracks">
                <div>Top Tracks</div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
