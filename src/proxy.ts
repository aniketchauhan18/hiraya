import type { NextRequest } from "next/server";

export async function proxy(_request: NextRequest) {
  // const { pathname } = request.nextUrl;

  // const protectedRoute = protectedRoutes.find((route) =>
  //   pathname.startsWith(route)
  // );

  // if (protectedRoute) {
  //   const session = await auth();
  //   const user = session?.user;
  //   if (!user) {
  //     const redirectUrl = new URL("/auth", request.url);
  //     redirectUrl.searchParams.set("redirect", protectedRoute);
  //     return NextResponse.redirect(redirectUrl);
  //   }
  //   return NextResponse.next();
  // }
  // return NextResponse.redirect(new URL("/", request.url));
}

export const config = {
  matcher: "/chat",
};
