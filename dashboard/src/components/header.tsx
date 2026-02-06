import { cn } from "@/lib/utils"
import Link from "next/link"
import { History, Settings } from "lucide-react"

interface HeaderProps {
  stats?: {
    total: number
    active: number
    failed: number
  }
}

export function Header({ stats }: HeaderProps) {
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <svg
                  className="h-6 w-6 text-primary-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold">Automation Hub</h1>
                <p className="text-sm text-muted-foreground">Gestisci le tue automazioni</p>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-4 ml-6 border-l pl-6">
              <Link
                href="/logs"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <History className="h-4 w-4" />
                Cronologia
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Settings className="h-4 w-4" />
                Impostazioni
              </Link>
            </nav>
          </div>

          {stats && (
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Totali</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Attive</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-500">{stats.failed}</p>
                <p className="text-xs text-muted-foreground">Fallite</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

