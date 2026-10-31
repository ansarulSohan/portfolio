import Image from "next/image";
import { FileTextIcon, MapPinIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProfileDTO } from "@/lib/dto";
import { SocialLinks } from "./SocialLinks";

export function Hero({
  profile,
  showContact,
}: {
  profile: ProfileDTO;
  showContact: boolean;
}) {
  return (
    <section
      aria-labelledby="hero-heading"
      className="animate-fade-up py-20 sm:py-28"
    >
      <div className="flex flex-col-reverse gap-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          {profile.location && (
            <p className="text-muted-foreground mb-5 inline-flex items-center gap-1.5 text-sm font-medium">
              <MapPinIcon className="size-4" aria-hidden />
              {profile.location}
            </p>
          )}
          <h1
            id="hero-heading"
            className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl"
          >
            {profile.name}
          </h1>
          <p className="text-primary mt-4 text-xl font-medium sm:text-2xl">
            {profile.title}
          </p>
          {profile.tagline && (
            <p className="text-muted-foreground mt-4 max-w-xl text-lg leading-8 text-pretty">
              {profile.tagline}
            </p>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            {showContact && (
              <Button asChild size="lg" className="h-11 px-5 text-base">
                <a href="#contact">Get in touch</a>
              </Button>
            )}
            {profile.resume && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-11 px-5 text-base"
              >
                <a href="/resume" target="_blank" rel="noopener">
                  <FileTextIcon aria-hidden data-icon="inline-start" />
                  Résumé
                  <span className="sr-only">(PDF, opens in a new tab)</span>
                </a>
              </Button>
            )}
          </div>

          <SocialLinks profile={profile} className="mt-8" />
        </div>

        {profile.avatar && (
          <Image
            src={profile.avatar.url}
            alt={profile.avatar.alt}
            width={176}
            height={176}
            priority
            className="size-32 shrink-0 rounded-full border object-cover sm:size-44"
          />
        )}
      </div>
    </section>
  );
}
