/**
 * SITE CONTENT — single source of truth.
 * Everything the portfolio renders comes from here.
 * Adding a project / skill / job later = add one object to an array below.
 * Fields marked `// TODO` are placeholders awaiting real content from Khalil.
 */

export const profile = {
  name: 'Khalil Massoudi',
  handle: 'khalil',
  host: 'portfolio',
  role: 'Software Engineer',
  // Rotating taglines typed in the hero terminal
  taglines: [
    'DevOps × AI × Web Development',
    'I build, ship, and automate.',
    'Turning ideas into reliable systems.',
  ],
  location: 'Tunisia', // TODO confirm
  status: 'Open to opportunities',
  bio: `I'm a software engineer who lives at the intersection of DevOps, AI, and web development. I care about building systems that are reliable, well-crafted, and a pleasure to use — from CI/CD pipelines to intelligent applications and polished interfaces.`,
  resumeUrl: '', // TODO add /resume.pdf
};

export const stats = [
  { value: 3, suffix: '+', label: 'Years Coding' }, // TODO confirm
  { value: 10, suffix: '+', label: 'Projects Built' }, // TODO confirm
  { value: 8, suffix: '+', label: 'Technologies' },
];

/**
 * Skills grouped by domain — the Skills app shows these as a category
 * picker first, then the chips for whichever one is selected.
 */
export const skillGroups = [
  {
    id: 'devops',
    title: 'Dev & Ops',
    icon: 'ops',
    blurb: 'Build, ship, automate.',
    items: ['Docker', 'Kubernetes', 'CI/CD', 'Linux', 'Git'],
  },
  {
    id: 'cloud',
    title: 'Cloud',
    icon: 'cld',
    blurb: 'Infrastructure & platforms.',
    items: ['AWS', 'Vercel', 'Terraform', 'Nginx'], // TODO confirm cloud stack
  },
  {
    id: 'ai',
    title: 'AI & Data',
    icon: 'ai',
    blurb: 'Models, pipelines, insight.',
    items: ['Machine Learning', 'Python', 'Data Pipelines', 'NLP'],
  },
  {
    id: 'web',
    title: 'Web & Backend',
    icon: 'web',
    blurb: 'Interfaces & APIs.',
    items: ['Angular', 'Spring Boot', 'PHP', 'JavaScript', 'REST APIs'],
  },
  {
    id: 'soft',
    title: 'Soft Skills',
    icon: 'sft',
    blurb: 'How I work with people.',
    items: ['Communication', 'Teamwork', 'Problem Solving', 'Adaptability', 'Time Management'], // TODO confirm
  },
];

/** Projects — `featured: true` surfaces them first. */
export const projects = [
  {
    id: 'qms',
    title: 'Quality Management System',
    tagline: 'Full-stack QMS platform',
    description:
      'A quality management system built with a Spring Boot backend and an Angular frontend, streamlining audits, non-conformities, and reporting.',
    tags: ['Spring Boot', 'Angular', 'MySQL'],
    links: { demo: '', code: '' }, // TODO
    featured: true,
    year: 2025,
  },
  {
    id: 'chatbot',
    title: 'AI-Powered Chatbot',
    tagline: 'Conversational assistant',
    description:
      'An intelligent chatbot leveraging NLP to deliver contextual, human-like responses.',
    tags: ['Python', 'NLP', 'AI'],
    links: { demo: '', code: '' }, // TODO
    featured: true,
    year: 2024,
  },
  {
    id: 'anti-negativity',
    title: 'Positivity Mobile App',
    tagline: 'Fighting negativity on social media',
    description:
      'A mobile application designed to detect and counter negativity on social platforms, promoting healthier online interaction.',
    tags: ['Mobile', 'AI/ML'],
    links: { demo: '', code: '' }, // TODO
    featured: false,
    year: 2024,
  },
];

/** Experience & education timeline — newest first. */
export const timeline = [
  {
    id: 'exp-placeholder',
    type: 'work', // 'work' | 'education'
    title: 'Software Engineer', // TODO
    org: 'Company / Institution', // TODO
    period: '2024 — Present', // TODO
    description: 'Placeholder — real experience to be provided.',
    tags: ['DevOps', 'AI'],
  },
  {
    id: 'edu-placeholder',
    type: 'education',
    title: 'Software Engineering', // TODO
    org: 'University', // TODO
    period: '20XX — 20XX', // TODO
    description: 'Placeholder — real education to be provided.',
    tags: [],
  },
];

export const socials = [
  { id: 'email', label: 'Email', value: 'kmassoudi03@gmail.com', href: 'mailto:kmassoudi03@gmail.com', icon: 'mail' },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    value: 'in/massoudikhalil03',
    href: 'https://www.linkedin.com/in/massoudikhalil03',
    icon: 'linkedin',
  },
  {
    id: 'github',
    label: 'GitHub',
    value: '@khalil', // TODO confirm handle
    href: 'https://github.com/', // TODO
    icon: 'github',
  },
];

export const nav = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
  { id: 'experience', label: 'Experience' },
  { id: 'contact', label: 'Contact' },
];
