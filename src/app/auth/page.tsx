import { auth } from "@/auth";
import SigninWithGoogleButton from "@/components/app/buttons/signin-google-button";
import { redirect } from "next/navigation";

export default async function Auth({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  
  const session = await auth();
  
  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <SigninWithGoogleButton callbackUrl={(await searchParams).redirect as string} />
    </div>
  )
}