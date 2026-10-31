import { Suspense } from "react";
import { About } from "@/components/site/About";
import { Contact } from "@/components/site/Contact";
import { EducationList } from "@/components/site/EducationList";
import { ExperienceTimeline } from "@/components/site/ExperienceTimeline";
import { FeaturedProjects } from "@/components/site/FeaturedProjects";
import { Hero } from "@/components/site/Hero";
import { Section } from "@/components/site/Section";
import { SkillGroups } from "@/components/site/SkillGroups";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getEducation,
  getExperience,
  getProfile,
  getPublishedProjects,
  getSettings,
  getSkillCategories,
} from "@/lib/queries";

async function HomeContent() {
  const [profile, settings, published, experience, skills, education] =
    await Promise.all([
      getProfile(),
      getSettings(),
      getPublishedProjects(),
      getExperience(),
      getSkillCategories(),
      getEducation(),
    ]);

  if (!profile) {
    return (
      <section className="py-24">
        <h1 className="text-3xl font-semibold tracking-tight">Coming soon</h1>
        <p className="text-muted-foreground mt-3">
          This site is being set up. Check back shortly.
        </p>
      </section>
    );
  }

  const { sections } = settings;
  const featured = published.filter((project) => project.featured);
  // If nothing is marked featured, show the first few published projects instead.
  const shownProjects = featured.length > 0 ? featured : published.slice(0, 4);

  return (
    <>
      <Hero profile={profile} showContact={sections.contact} />
      {sections.about && <About profile={profile} />}
      {sections.projects && (
        <FeaturedProjects
          featured={shownProjects}
          totalPublished={published.length}
        />
      )}
      {sections.experience && <ExperienceTimeline items={experience} />}
      {sections.skills && skills.length > 0 && (
        <Section id="skills" title="Skills">
          <SkillGroups categories={skills} />
        </Section>
      )}
      {sections.education && education.length > 0 && (
        <Section id="education" title="Education">
          <EducationList items={education} />
        </Section>
      )}
      {sections.contact && <Contact profile={profile} />}
    </>
  );
}

/** Shown in the static shell while content loads (and for the first paint). */
function HomeSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="py-20 sm:py-28">
      <Skeleton className="mb-6 h-4 w-32" />
      <Skeleton className="h-12 w-full max-w-lg" />
      <Skeleton className="mt-4 h-7 w-56" />
      <Skeleton className="mt-6 h-5 w-full max-w-xl" />
      <Skeleton className="mt-2 h-5 w-full max-w-md" />
      <div className="mt-8 flex gap-3">
        <Skeleton className="h-11 w-36" />
        <Skeleton className="h-11 w-28" />
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}
