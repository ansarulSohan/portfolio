/**
 * Content from the old Vite site (src/data/portfolio.ts), kept only so
 * scripts/seed.ts can import it into MongoDB once. After seeding, the
 * database is the source of truth: edit content in /admin, not here.
 */
export interface LegacyPortfolioData {
  meta: {
    name: string;
    title: string;
    location: string;
    email: string;
    linkedin: string;
    github: string;
    resumeUrl?: string;
  };
  about: { bio: string[]; philosophies: string[] };
  skills: { category: string; items: { name: string; level: number }[] }[];
  projects: {
    title: string;
    description: string;
    tech: string[];
    github?: string;
    live?: string;
    image?: string;
  }[];
  experience: {
    role: string;
    company: string;
    period: string;
    highlights: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
    notes?: string;
  }[];
}

export const legacyPortfolio: LegacyPortfolioData = {
  meta: {
    name: "G.M. Ansarul Kabir",
    title: "Software Engineer",
    location: "Oslo, Norway",
    email: "ansarulsohan@gmail.com",
    linkedin: "https://www.linkedin.com/in/g-m-ansarul-kabir/",
    github: "https://github.com/ansarulSohan",
  },
  about: {
    bio: [
      "I'm a full stack developer based in Oslo. My background is in backend systems and cloud infrastructure, and I recently finished an MSc in Informatics at the University of Oslo where my thesis looked at energy efficiency across different cloud deployment models.",
      "Most of my work has been on the backend side. I've built APIs and services that handle real traffic, set up CI/CD pipelines, and spent time at Simula Research Laboratory working on open-source research tooling. I like understanding how systems actually behave in production, not just how they're designed on paper.",
      "I work mainly with Node.js, TypeScript, Python, PostgreSQL, and Docker. I've also done frontend work in React and I'm comfortable moving across the stack when needed.",
      "I'm currently open to new opportunities, whether that's a full-time role or freelance work. If something here looks like a fit, feel free to reach out.",
    ],
    philosophies: ["Craft > hype", "Systems thinking", "Ship & iterate"],
  },
  skills: [
    {
      category: "Backend & APIs",
      items: [
        { name: "Node.js / Express", level: 90 },
        { name: "Java / Spring Boot", level: 75 },
        { name: "Python / Flask", level: 80 },
        { name: "REST API design", level: 90 },
      ],
    },
    {
      category: "Cloud & DevOps",
      items: [
        { name: "Docker", level: 85 },
        { name: "CI/CD (GitHub Actions)", level: 85 },
        { name: "AWS", level: 65 },
        { name: "Kubernetes", level: 55 },
      ],
    },
    {
      category: "Data & Storage",
      items: [
        { name: "PostgreSQL", level: 85 },
        { name: "MongoDB", level: 75 },
      ],
    },
    {
      category: "Frontend",
      items: [
        { name: "React", level: 85 },
        { name: "TypeScript", level: 85 },
      ],
    },
  ],
  projects: [
    {
      title: "MovieDex",
      description:
        "Full-stack movie database using React, Vite, Tailwind CSS, and Appwrite.",
      tech: ["React", "Vite", "Tailwind CSS", "Appwrite"],
      github: "https://github.com/ansarulSohan/MovieDex",
    },
  ],
  experience: [
    {
      role: "Summer Research Intern",
      company: "Simula Research Laboratory",
      period: "Jun 2023 — Jul 2023",
      highlights: [
        "Designed and implemented a CI/CD pipeline for HULDRA, an open-source experimental framework, using GitHub Actions and Docker, cutting down manual deployment steps.",
        "Containerized the application and automated build, test, and release workflows, improving reproducibility across heterogeneous environments.",
        "Participated in code reviews and technical discussions, contributing to higher overall code quality.",
        "Documented technical decisions and contributed to the open-source codebase used by the research community.",
      ],
    },
    {
      role: "Software Developer",
      company: "Notre Dame University Bangladesh",
      period: "Jan 2022 — Aug 2022",
      highlights: [
        "Designed and delivered RESTful APIs using Node.js (Express) and Python (Flask) backed by PostgreSQL for academic and administrative systems.",
        "Worked in agile sprints, collaborating with frontend developers and stakeholders to align API contracts with product requirements.",
        "Improved API response times through query optimization, connection pooling, and structured logging.",
        "Monitored production server health and maintained uptime for live operations.",
      ],
    },
    {
      role: "Assistant IT Officer",
      company: "Notre Dame University Bangladesh",
      period: "Feb 2020 — Dec 2021",
      highlights: [
        "Built and maintained backend services for the Online Admission System and Faculty Evaluation System using Node.js, MongoDB, and REST APIs.",
        "Maintained the official university website and supported Linux/Windows-based servers, networking equipment, and IT infrastructure.",
        "Led hardware procurement and lifecycle management across campus.",
        "Worked closely with administrative stakeholders to translate requirements into reliable technical solutions.",
      ],
    },
  ],
  education: [
    {
      degree: "MSc in Informatics",
      institution: "University of Oslo",
      year: "Aug 2022 — Jul 2025",
      notes:
        "Specialization in Programming and Systems Architecture. Coursework in distributed systems, cloud computing, and software engineering with Java. Thesis on energy efficiency in cloud infrastructure, comparing unikernel and container-based deployments.",
    },
    {
      degree: "BSc in Computer Science and Engineering",
      institution: "Notre Dame University Bangladesh",
      year: "Dec 2015 — Dec 2019",
      notes:
        "Coursework in object-oriented programming with Java, software design, and database systems.",
    },
  ],
};
