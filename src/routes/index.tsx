import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { RequireAuth } from "@/components/require-auth"
import Header from "@/features/header"
import Footer from "@/features/footer"
import { ProfileHeader } from "@/features/profile-header"
import meQueryOptions from "@/lib/spotify/api/me/me"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  const { data: user } = useQuery(meQueryOptions)

  return (
    <div className="grid min-h-svh grid-rows-[auto_1fr_auto]">
      <Header />

      <main className="space-y-10 px-4">
        <ProfileHeader
          followers={user?.followers.total ?? 0}
          name={user?.display_name ?? ""}
          imageUrl={user?.images[0]?.url ?? ""}
          profileUrl={user?.external_urls.spotify ?? ""}
        />

        <Tabs>
          <TabsList className="w-full">
            <TabsTrigger value="playlists">Playlists</TabsTrigger>
            <TabsTrigger value="top-artists">Top Artists</TabsTrigger>
            <TabsTrigger value="top-tracks">Top Tracks</TabsTrigger>
          </TabsList>

          <TabsContent value="playlists">
            <div>Stats</div>
          </TabsContent>

          <TabsContent value="top-artists">
            <div>Top Artists</div>
          </TabsContent>

          <TabsContent value="top-tracks">
            <div>Top Tracks</div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  )
}
