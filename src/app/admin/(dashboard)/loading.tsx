import { Skeleton } from "@/components/ui/skeleton";

/*
 * Every admin page checks the session and reads the database at request time.
 * This boundary lets navigation between admin pages switch instantly (the
 * sidebar stays, this placeholder shows) while the page streams in.
 */
export default function AdminPageLoading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="flex flex-col gap-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full max-w-md" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}
