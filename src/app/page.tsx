import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main
      className={`flex min-h-screen flex-col items-center font-normal pt-20`}
    >
      <section className="lg:p-10 sm:p-5 p-3">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
            <h1 className="text-3xl h-20 flex items-center font-medium tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl bg-gradient-to-r from-blue-500 via-blue-600  to-purple-600 bg-clip-text text-transparent">
  Your College Companion
</h1>
              <p className="mx-auto max-w-[500px] font-normal text-neutral-500 md:text-base">
                Get instant answers to all your college questions. Campus Buddy
                is here to help you navigate your academic journey.
              </p>
            </div>
            <div className="space-x-4">
              <Button className="bg-purple-600 hover:bg-purple-700 rounded-full">
                Get Started
              </Button>
              <Button variant="outline" className="rounded-full ">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>
      <Link href="/chat">
        <Button>Chat Page</Button>
      </Link>
    </main>
  );
}
