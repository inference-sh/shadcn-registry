import Link from "next/link"
import Image from "next/image"
import { Github } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center px-6">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Image
              src="/assets/logo.svg"
              alt="inference.sh"
              width={22}
              height={18}
              className="w-[22px] h-auto"
            />
          </Link>
          <nav className="flex items-center gap-4 text-sm lg:gap-6">
            <Link
              href="https://inference.sh"
              className="logo transition-colors hover:text-foreground/80 text-foreground/60"
              target="_blank"
              rel="noopener noreferrer"
            >
              inference.sh
            </Link>
            <Link
              href="https://inference.sh/docs"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              docs
            </Link>
            <Link
              href="https://inference.sh/blog"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              blog
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center">
            <Button variant="ghost" size="icon" asChild>
              <Link
                href="https://github.com/inference-sh/shadcn-registry"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-4 w-4" />
                <span className="sr-only">GitHub</span>
              </Link>
            </Button>
            <ModeToggle />
          </nav>
        </div>
      </div>
    </header>
  )
}
