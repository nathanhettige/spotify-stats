import { ExternalLink, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

interface ProfileHeaderProps {
  followers: number
  name: string
  imageUrl: string
  profileUrl: string
}

export function ProfileHeader({ followers, name, imageUrl, profileUrl }: ProfileHeaderProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
      <Avatar className="h-24 w-24 border-2 border-primary sm:h-32 sm:w-32">
        <AvatarImage src={imageUrl} alt={name} />
        <AvatarFallback className="bg-secondary text-2xl">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-1 flex-col items-center gap-2 text-center sm:items-start sm:text-left">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          {name}
        </h1>

        <div className="flex items-center gap-4 text-muted-foreground">
          <span className="flex items-center gap-1.5 text-sm">
            <Users className="h-4 w-4" />
            {followers.toLocaleString()} followers
          </span>
        </div>

        <Button variant="outline" size="sm" className="mt-2 gap-2" asChild>
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-4 w-4" />
            Open in Spotify
          </a>
        </Button>
      </div>
    </div>
  )
}
