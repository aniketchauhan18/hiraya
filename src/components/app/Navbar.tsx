"use server";
import Link from "next/link";
import HamburgerMenu from "./HamburgerMenu";
import { auth } from "@/auth";
import SignoutButton from "./buttons/signout-button";
export default async function Navbar() {
  const session = await auth();

  return (
    <nav className="fixed inset-x-0 flex min-h-16 z-50 bg-neutral-100/80 backdrop-blur-sm justify-between items-center gap-5 px-5">
      <Link className="flex items-center justify-center" href="/">
        <span className="ml-2 text-lg font-medium">Hiraya</span>
      </Link>
      <header className="hidden lg:flex items-center">
        <div className="ml-auto gap-4 flex sm:gap-6 items-center">
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="#features"
          >
            Features
          </Link>
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="#about"
          >
            About
          </Link>
          {session?.user ? (
            <SignoutButton />
          ) : (
            <div className="flex gap-4 sm:gap-6">
              <Link
                className="text-sm font-medium hover:underline underline-offset-4"
                href="/signin"
              >
                Signin
              </Link>
            </div>
          )}
        </div>
      </header>
      <HamburgerMenu />
    </nav>
  );
}
