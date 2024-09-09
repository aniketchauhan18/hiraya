"use client";
import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { MenuIcon, XIcon } from "lucide-react";

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const pathName = usePathname();
  const session = useSession();
  // console.log(session); // for dev. purpose only

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  const links = [
    { name: "Hiraya", href: "/" },
    { name: "Features", href: "/#features" },
    { name: "About", href: "/about" },
  ];

  return (
    <div className="lg:hidden">
      <MenuIcon className="w-6 h-6 hover:cursor-pointer" onClick={toggleMenu} />
      {isOpen && (
        <div className="fixed inset-0 text-neutral-800 bg-white min-h-screen flex flex-col items-start z-50 p-5">
          <div className="flex justify-end w-full">
            <XIcon
              className="w-6 h-6 sm:w-8 sm:h-8 cursor-pointer"
              onClick={toggleMenu}
            />
          </div>
          <nav className="flex items-start text-2xl ml-4 pt-3 sm:pt-5">
            <div className="flex flex-col space-y-4">
              {links.map((link) => {
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={toggleMenu}
                    className={clsx("py-1 px-3", {
                      "text-neutral-800": pathName === link.href,
                      "text-neutral-900": pathName !== link.href,
                    })}
                  >
                    {link.name}
                  </Link>
                );
              })}
              {session.data?.user ? (
                <div className="flex flex-col space-y-4 ">
                  <span>
                    <Link
                      href="/profile"
                      className="py-1 px-3"
                      onClick={toggleMenu}
                    >
                      Logout
                    </Link>
                  </span>
                </div>
              ) : (
                <div className="flex flex-col space-y-4">
                  <Link href="/signup" className="py-1 px-3">
                    Signup
                  </Link>
                  <Link href="/signin" className="py-1 px-3">
                    Signin
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
