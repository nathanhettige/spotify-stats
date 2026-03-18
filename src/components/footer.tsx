import { useAuth } from "@/lib/spotify/auth/auth-context"
import { Button } from "@/components/ui/button"

const Footer = () => {
  const { isAuthenticated, logout } = useAuth()

  return (
    <div className="flex items-center justify-between border-t border-muted p-4 text-xs text-muted-foreground">
      <p>
        Built by <Button variant="link" size="sm" className="h-auto p-0 text-xs text-foreground" asChild><a href="https://github.com/nhettige" target="_blank" rel="noopener noreferrer">Nathan Hettige</a></Button>
      </p>
      {isAuthenticated && (
        <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground hover:bg-transparent" onClick={logout}>
          Log out
        </Button>
      )}
    </div>
  )
}

export default Footer
