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
      "This is the foundation of the intergalactic portfolio.",
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

