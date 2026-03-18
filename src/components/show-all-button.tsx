import { Button } from "@/components/ui/button"

interface ShowAllButtonProps {
  expanded: boolean
  remaining: number
  onToggle: () => void
}

export function ShowAllButton({ expanded, remaining, onToggle }: ShowAllButtonProps) {
  return (
    <Button variant="ghost" size="sm" className="w-full" onClick={onToggle}>
      {expanded ? "See less" : `See all (${remaining})`}
    </Button>
  )
}
