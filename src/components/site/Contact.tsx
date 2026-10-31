import { MailIcon } from "lucide-react";
import type { ProfileDTO } from "@/lib/dto";
import { ContactForm } from "./ContactForm";
import { Section } from "./Section";
import { SocialLinks } from "./SocialLinks";

export function Contact({ profile }: { profile: ProfileDTO }) {
  return (
    <Section
      id="contact"
      title="Get in touch"
      description="Have a question or an opportunity? Send a message and I'll reply by email."
    >
      <div className="grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <ContactForm />
        <aside
          aria-label="Other ways to reach me"
          className="flex flex-col gap-6"
        >
          <div>
            <h3 className="text-muted-foreground mb-2 text-sm font-semibold tracking-wide uppercase">
              Email
            </h3>
            <a
              href={`mailto:${profile.email}`}
              className="text-primary inline-flex items-center gap-2 font-medium break-all underline-offset-4 hover:underline"
            >
              <MailIcon className="size-4 shrink-0" aria-hidden />
              {profile.email}
            </a>
          </div>
          <div>
            <h3 className="text-muted-foreground mb-2 text-sm font-semibold tracking-wide uppercase">
              Elsewhere
            </h3>
            <SocialLinks profile={profile} />
          </div>
        </aside>
      </div>
    </Section>
  );
}
