import { redirect } from "next/navigation";
import SignupForm from "./signup-form";


export default async function SignupPage({searchParams}: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  redirect("/auth")

  return (
    <main className="flex justify-center items-center min-h-screen p-5">
      <SignupForm searchParams={await searchParams} />
    </main>
  );
}
