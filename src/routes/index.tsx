import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { RequireAuth } from "@/components/require-auth"
import Header from "@/features/header"
import Footer from "@/features/footer"
import { ProfileHeader } from "@/features/profile-header"
import meQueryOptions from "@/lib/spotify/api/me/me"

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

      <main>
        <ProfileHeader
          followers={user?.followers.total ?? 0}
          name={user?.display_name ?? ""}
          imageUrl={user?.images[0]?.url ?? ""}
          profileUrl={user?.external_urls.spotify ?? ""}
        />
      </main>

      <Footer />
    </div>
  )
}
