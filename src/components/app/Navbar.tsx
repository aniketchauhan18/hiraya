"use server"
import Link from "next/link"

export default async function Navbar() {
  return (
    <nav className="fixed inset-x-0 min-h-16 hidden lg:flex z-50 bg-white/80 backdrop-blur-sm justify-between items-center gap-5 px-5">
      <Link className="flex items-center justify-center" href="/">
          <span className="ml-2 text-lg font-medium">Hiraya</span>
        </Link>
      <header>
      <div className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#features">
            Features
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#about">
            About
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#contact">
            Signin
          </Link>
        </div>
      </header>
      <div className="flex lg:hidden">

      </div>
    </nav>
  )
}