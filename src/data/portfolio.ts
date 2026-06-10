import type { PortfolioData } from "../types";

export const portfolio: PortfolioData = {
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
      `I'm a full stack developer based in Oslo. My background is in backend systems and cloud infrastructure, and I recently finished an MSc in Informatics at the University of Oslo where my thesis looked at energy efficiency across different cloud deployment models.
Most of my work has been on the backend side. I've built APIs and services that handle real traffic, set up CI/CD pipelines, and spent time at Simula Research Laboratory working on open-source research tooling. I like understanding how systems actually behave in production, not just how they're designed on paper.
I work mainly with Node.js, TypeScript, Python, PostgreSQL, and Docker. I've also done frontend work in React and I'm comfortable moving across the stack when needed.
I'm currently open to new opportunities, whether that's a full-time role or freelance work. If something here looks like a fit, feel free to reach out.`,
    ],
    philosophies: ["Craft > hype", "Systems thinking", "Ship & iterate"],
  },
  skills: [
    {
      category: "Frontend",
      items: [
        { name: "React", level: 85 },
        { name: "TypeScript", level: 80 },
      ],
    },
    {
      category: "3D",
      items: [
        { name: "Three.js", level: 70 },
        { name: "R3F", level: 70 },
      ],
    },
  ],
  projects: [],
  experience: [],
  education: [],
};
