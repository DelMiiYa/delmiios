/**
 * Personal Profile & System Configuration (DelMiiOS v2.1)
 * ==================================================================
 * Honest placeholder content for personal portfolio customization.
 * All apps and subsystems read their defaults and content from this module.
 */

/**
 * Derives 1-2 uppercase initials from a human name.
 * E.g., 'Your Name' -> 'YN', 'Single' -> 'SI', '' -> '??'
 * @param {string} name
 * @returns {string}
 */
export function getAvatarInitials(name = "") {
  if (!name || typeof name !== "string") return "??";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const profile = {
  // Basic Identity (Honest Placeholders)
  name: "DelMii",
  username: "delmii",
  hostname: "delmii-pc",
  role: "Computer Engineer",
  tagline:
    "just some Computer Engineering student that got forced to write codes",
  location: "Somewhere in Thailand",
  status: "Available for new opportunities",
  avatarInitials: "DM",

  // About Me App
  about: {
    fileName: "About Me.txt",
    lastModified: "2026-10-25",
    summary: [
      "Hello! I am DelMii, a computer engineer with a passion for nothing more than chasing dopamine.",
      "This interactive desktop environment is an open-source portfolio showcasing my nonexistent projects, AI usage proficiencies, and direct contact channels. Double-click any desktop icon or open the Start menu to explore.",
      "TODO: Add Paragraph about how goated i am",
    ],
    interests: [
      "Gaming: Minecraft, Genshin Impact, Overwatch, and more",
      "Literature & Writing: Sci-Fi, Fantasy, Worldbuilding, and Technical Documentation",
      "AI & Machine Learning: Prompt Engineering, LLMs, and Generative AI",
    ],
    quickFacts: [
      { label: "Location", value: "Thailand" },
      { label: "Experience", value: "-2 Years" },
      { label: "Focus", value: "Anything that can give me dopamine" },
      { label: "Languages", value: "English, Thai" },
    ],
    experience: [
      {
        role: "Computer Engineer Undergraduate",
        company: "SWU (Srinakharinwirot University) (Thailand)",
        period: "2024 — Present",
        highlights: [
          "TODO: Currently pursuing a degree in Computer Engineering, focusing on software development, systems design, and AI integration.",
        ],
      },
      // {
      //   role: 'Frontend Developer (TODO)',
      //   company: 'Tech Studio (TODO)',
      //   period: '2021 — 2023',
      //   highlights: [
      //     'TODO: Built responsive client-facing web applications with modern toolchains.',
      //     'TODO: Improved accessibility and Lighthouse performance scores.'
      //   ]
      // }
    ],
  },

  // Projects App (File Explorer style)
  projects: [
    {
      id: "facial-dermatosis",
      title: "Facial Dermatosis Classification (CPE310)",
      category: "Machine Learning",
      date: "2026",
      status: "Active",
      description:
        "End-to-end computer vision and deep learning pipeline for classifying facial skin dermatoses (Acne, Dermatitis, Rosacea, Normal) from real-world smartphone photos.",
      details:
        "Engineered for the CPE310 Computer Engineering curriculum to address clinical domain shift by training exclusively on domain-aligned smartphone selfies. Features Roboflow API automated dataset ingestion, single-source manifest data tracking (7,800+ images), MediaPipe facial landmark crop/patch extraction, perceptual hash deduplication (imagehash) to eliminate test leakage, and PyTorch CNN architectures (ResNet-50, EfficientNet) optimized for low VRAM with mixed precision (torch.amp), stratified subject grouping, and Grad-CAM interpretability heatmaps.",
      tech: [
        "Python",
        "PyTorch",
        "Computer Vision",
        "MediaPipe",
        "OpenCV",
        "Roboflow",
        "Machine Learning",
      ],
      liveUrl: "",
      repoUrl: "https://github.com/DelMiiYa/CPE310_Facial_Dermatosis",
    },
    {
      id: "burning-upp",
      title: "BurningUpp — Workplace Burnout & Wellness Tracker",
      category: "Mobile Application",
      date: "2025 — 2026",
      status: "Completed",
      description:
        "An Android mobile application designed to monitor, assess, and manage workplace mental wellness and occupational burnout for teams.",
      details:
        "Built with Java and the Android SDK featuring a dual-role architecture for Team Managers and Team Members with real-time pairing via Cloud Firestore. Implements a progressive clinical screening pipeline starting with a 10-item basic questionnaire and advancing to the 22-item Maslach Burnout Inventory (MBI) evaluating Emotional Exhaustion, Depersonalization, and Personal Accomplishment. Includes daily mood tracking with MPAndroidChart visualizations, a 42-cell interactive monthly calendar, Firebase Auth, and manager dashboards with visual burnout risk flame indicators.",
      tech: [
        "Java",
        "Android SDK",
        "Firebase",
        "Cloud Firestore",
        "MPAndroidChart",
        "Mobile Development",
      ],
      liveUrl: "",
      repoUrl: "https://github.com/DelMiiYa/BurningUpp",
    },
    {
      id: "delmiios",
      title: "DelMiiOS / CRT Portfolio (This Site)",
      category: "Interactive Portfolio",
      date: "2026",
      status: "Live",
      description:
        "A simulated retro CRT desktop operating system personal portfolio built with vanilla JavaScript, featuring window management, audio synthesis, and live settings.",
      details:
        "Zero runtime dependencies, registry-based window compositor with pointer capture, Web Audio API synthesizer, CRT phosphor shader layers, continuous canvas cursor trail, and responsive monitor bezel.",
      tech: [
        "JavaScript",
        "TypeScript",
        "HTML/CSS",
        "CSS Variables",
        "Vite",
        "Accessibility",
        "Web Audio API",
      ],
      liveUrl: "#",
      repoUrl: "https://github.com/DelMiiYa/delmiios",
    },
  ],

  // Skills App (System Specs & Proficiencies)
  skills: {
    systemSpecs: {
      osName: "DelMiiOS v2.1",
      osCodename: "CRT Edition",
      kernel: "Vanilla-JS Microkernel 64-bit",
      uptime: "Good luck trying to measure uptime on a simulated OS",
      memory: "6.7/16.0 GB Virtual RAM",
    },
    categories: [
      {
        name: "Frontend & UI Engineering",
        description:
          "Client-side technologies, component design, and performance",
        items: [
          {
            name: "HTML5 & Semantic Markup",
            level: 95,
            tag: "Markup",
            filterTag: "HTML/CSS",
          },
          {
            name: "Modern CSS & CSS Variables",
            level: 92,
            tag: "Styling",
            filterTag: "CSS Variables",
          },
          {
            name: "TypeScript & Type Safety",
            level: 88,
            tag: "Language",
            filterTag: "TypeScript",
          },
          {
            name: "Vanilla ES Modules & JavaScript",
            level: 94,
            tag: "Language",
            filterTag: "JavaScript",
          },
        ],
      },
      {
        name: "AI & Mobile Engineering",
        description:
          "Machine learning pipelines, computer vision models, and native Android development",
        items: [
          {
            name: "Python & PyTorch",
            level: 90,
            tag: "AI/ML",
            filterTag: "Python",
          },
          {
            name: "Computer Vision & MediaPipe",
            level: 86,
            tag: "CV",
            filterTag: "Computer Vision",
          },
          {
            name: "Java & Android SDK",
            level: 88,
            tag: "Mobile",
            filterTag: "Java",
          },
          {
            name: "Firebase & Cloud Firestore",
            level: 85,
            tag: "Cloud",
            filterTag: "Firebase",
          },
        ],
      },
      {
        name: "Backend & Tooling",
        description: "Server runtime, build pipelines, and standards",
        items: [
          {
            name: "Node.js Runtime & Services",
            level: 84,
            tag: "Backend",
            filterTag: "Node.js",
          },
          {
            name: "Vite & Modern Bundlers",
            level: 90,
            tag: "Build",
            filterTag: "Vite",
          },
          {
            name: "Web Accessibility (WCAG 2.1)",
            level: 88,
            tag: "A11y",
            filterTag: "Accessibility",
          },
          {
            name: "Git & Deployment Workflows",
            level: 86,
            tag: "DevOps",
            filterTag: "Vite",
          },
        ],
      },
    ],
    additionalTags: [
      "Python",
      "PyTorch",
      "Computer Vision",
      "Java",
      "Android SDK",
      "Firebase",
      "Cloud Firestore",
      "Machine Learning",
      "Accessibility",
      "TypeScript",
      "Vite",
      "Node.js",
      "CSS Variables",
      "HTML/CSS",
    ],
  },

  // Contact App
  contact: {
    email: "phasit.ketphan@gmail.com",
    availabilityNote:
      "TODO: Customize your availability note. Currently open for contract engagements, engineering roles, and collaborative projects.",
    officeHours: "Monday — Friday, 09:00 - 18:00 UTC (TODO)",
    socials: [
      {
        platform: "Email",
        handle: "phasit.ketphan@gmail.com",
        url: "mailto:phasit.ketphan@gmail.com",
        description: "Direct email for professional inquiries",
      },
      {
        platform: "GitHub",
        handle: "@DelMiiYa",
        url: "https://github.com/DelMiiYa",
        description: "Open-source code repositories & contributions",
      },
      {
        platform: "LinkedIn",
        handle: "in/yourprofile",
        url: "https://www.linkedin.com/in/phasit-ketphan-017a21446/",
        description: "Professional background & career history",
      },
      // {
      //   platform: 'X / Social',
      //   handle: '@yourhandle',
      //   url: 'https://x.com/yourhandle',
      //   description: 'Tech thoughts, projects, and discussions'
      // }
    ],
  },

  // System Core Defaults
  system: {
    osName: "DelMiiOS v2.1",
    osCodename: "CRT Edition",
    kernel: "Vanilla-JS Microkernel 64-bit",
    defaultTheme: "cyber-dark",
    defaultMode: "dark",
    defaultWallpaper: "aurora",
    defaultAccent: "#38bdf8",
    soundEnabled: true,
    crtFrame: true,
    crtScanlines: true,
    crtVignette: false,
    crtFlicker: false,
    customCursor: true,
    cursorTrail: true,
  },

  // Appearance Presets (Themes, Wallpapers, Accents)
  appearance: {
    themes: [
      {
        id: "cyber-dark",
        name: "Cyber Dark",
        color: "#1e1b4b",
        desc: "Deep indigo & neon cyan",
      },
      {
        id: "retro-teal",
        name: "Retro Teal 95",
        color: "#008080",
        desc: "Classic 90s desktop chrome",
      },
      {
        id: "sunset-dusk",
        name: "Sunset Dusk",
        color: "#75225b",
        desc: "Vibrant synthwave dusk",
      },
      {
        id: "matrix",
        name: "Matrix Green",
        color: "#052e16",
        desc: "Phosphor hacker terminal",
      },
      {
        id: "clean-slate",
        name: "Clean Slate",
        color: "#1e293b",
        desc: "Modern minimalist slate",
      },
    ],
    wallpapers: [
      {
        id: "aurora",
        name: "Cyber Aurora",
        description: "Deep slate gradient with neon cyan and indigo glow",
      },
      {
        id: "sunset",
        name: "Synth Sunset",
        description: "Warm dusk gradient with magenta and amber tones",
      },
      {
        id: "blueprint",
        name: "Architect Grid",
        description: "Technical blueprint grid pattern",
      },
      {
        id: "emerald",
        name: "Matrix Canopy",
        description: "Emerald and forest terminal aesthetic",
      },
      {
        id: "minimal",
        name: "Classic Slate",
        description: "Clean distraction-free studio backdrop",
      },
    ],
    accents: [
      { id: "sky", name: "Sky Blue", value: "#38bdf8" },
      { id: "violet", name: "Electric Violet", value: "#a78bfa" },
      { id: "emerald", name: "Emerald Green", value: "#34d399" },
      { id: "amber", name: "Warm Amber", value: "#fbbf24" },
      { id: "rose", name: "Coral Rose", value: "#fb7185" },
    ],
  },
};

/**
 * Returns a map of virtual files generated from profile for Terminal ls & cat commands.
 * @param {typeof profile} p
 * @returns {Record<string, string>}
 */
export function getVirtualFiles(p = profile) {
  return {
    "About_Me.txt": `${p.name}\n${p.role}\n${p.tagline}\n\nSummary:\n${p.about.summary.join("\n\n")}`,
    "projects.txt": p.projects
      .map(
        (pr) =>
          `[${pr.id}] ${pr.title} (${pr.category}, ${pr.date})\n${pr.description}\nTech: ${pr.tech.join(", ")}\nLive: ${pr.liveUrl}\nRepo: ${pr.repoUrl}`,
      )
      .join("\n\n---\n\n"),
    "skills.sys":
      `OS Specs:\n  OS: ${p.skills.systemSpecs.osName}\n  Kernel: ${p.skills.systemSpecs.kernel}\n  Memory: ${p.skills.systemSpecs.memory}\n\nSkills:\n` +
      p.skills.categories
        .map(
          (c) =>
            `[${c.name}]\n` +
            c.items
              .map(
                (i) => `  - ${i.name} (${i.level}%) [${i.filterTag || i.tag}]`,
              )
              .join("\n"),
        )
        .join("\n\n"),
    "contact.txt":
      `Email: ${p.contact.email}\nHours: ${p.contact.officeHours}\nNote: ${p.contact.availabilityNote}\n\nSocials:\n` +
      p.contact.socials
        .map((s) => `  - ${s.platform}: ${s.handle} (${s.url})`)
        .join("\n"),
    "system.cfg": `OS=${p.system.osName}\nCodename=${p.system.osCodename}\nKernel=${p.system.kernel}\nDefaultTheme=${p.system.defaultTheme}\nDefaultMode=${p.system.defaultMode}\nDefaultWallpaper=${p.system.defaultWallpaper}\nDefaultAccent=${p.system.defaultAccent}`,
  };
}

export const profileData = profile;
