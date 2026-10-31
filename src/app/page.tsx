import { Button } from "@/components/ui/button";

// Temporary placeholder until phase 4 builds the real home page from MongoDB.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-6 py-24">
      <p className="text-muted-foreground text-sm font-medium">
        Rebuild in progress
      </p>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        G.M. Ansarul Kabir
      </h1>
      <p className="text-muted-foreground text-lg">
        Software Engineer · Oslo, Norway
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <a href="mailto:ansarulsohan@gmail.com">Get in touch</a>
        </Button>
        <Button asChild variant="outline">
          <a href="https://github.com/ansarulSohan">GitHub</a>
        </Button>
      </div>
    </main>
  );
}
