import type { Messages } from "@/lib/i18n/messages/types"

const en: Messages = {
  common: {
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    close: "Close",
    refresh: "Refresh",
    search: "Search",
    loading: "Loading",
    retry: "Try again",
    home: "Home",
    required: "Required",
    optional: "Optional",
  },

  nav: {
    history: "History",
    winningNumbers: "Winning numbers",
    faq: "FAQ",
    login: "Sign in",
    logout: "Sign out",
    profile: "Profile",
    notifications: "Notifications",
    settings: "Settings",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    theme: "Toggle theme",
    language: "Language",
  },

  footer: {
    rights: (year: number) => `© ${year} Lotto645. All rights reserved.`,
    terms: "Terms of Service",
    privacy: "Privacy Policy",
    contact: "Contact",
  },

  legal: {
    updatedAt: (date: string) => `Effective ${date}`,
    koreanOnly: "The Korean version of this document is the governing text.",
  },

  contact: {
    title: "Contact us",
    description: "Tell us what went wrong or what you would like to know. We will get back to you.",
    email: "Email for our reply",
    emailPlaceholder: "example@email.com",
    subject: "Subject",
    subjectPlaceholder: "What is this about?",
    message: "Message",
    messagePlaceholder: "The more detail you give, the faster we can help.",
    submit: "Send",
    sending: "Sending",
    sent: "Message sent",
    sentDescription: "We will reply to the email address you gave us.",
    another: "Send another message",
    errors: {
      email: "Please enter a valid email address for our reply.",
      subject: "Please enter a subject.",
      message: "Please write at least 10 characters.",
      failed: "We could not send your message. Please try again in a moment.",
    },
  },
  settings: {
    title: "Settings",
    description: "Adjust how the app looks and how your account behaves.",
    theme: {
      title: "Theme",
      light: "Light",
      dark: "Dark",
      system: "System",
    },
    language: {
      title: "Language",
      description: "Your choice is saved to your account, so it follows you to other devices.",
      saved: "Language changed.",
    },
    autoLogin: {
      title: "Stay signed in",
      saved: "Setting saved.",
      on: "You will be signed in automatically next time.",
      off: "You will be signed out when the browser closes.",
    },
    account: {
      title: "Account",
      withdrawDescription: "Deleting your account removes your profile for good. The number sets you generated stay, but they can no longer be traced back to you.",
      withdraw: "Delete account",
      withdrawing: "Deleting",
      confirmTitle: "Delete your account?",
      confirmDescription: "Your account, profile and uploaded images will all be removed. You can sign up again with the same email, but nothing from before will come back.",
      confirm: "Delete",
      done: "Your account has been deleted.",
      failed: "We could not delete your account.",
    },
  },

  auth: {
    languageLabel: "Preferred language",
    languageHint: "You can change this later in Settings.",
  },
  home: {
    tabs: {
      machine: "Draw machine",
      manual: "Pick your own",
    },
    guide: {
      title: "About Lotto 6/45",
      basics: {
        title: "The basics",
        range: "Lotto 6/45 asks you to choose 6 numbers from 1 to 45.",
        schedule: "The winning numbers are drawn every Saturday evening.",
        oddsLabel: "Odds of first prize",
      },
      usage: {
        title: "How to use it",
        machine: "Draw machine",
        machineDescription: "Simulates a physical draw and produces a completely random set of numbers.",
        manual: "Pick your own",
        manualDescription: "Choose the numbers yourself, or lock and exclude a few and let the rest fill in automatically.",
      },
      warning: {
        title: "Please note",
        ageLimit: "19 or older",
        body: "Lottery tickets may only be bought by people aged 19 or older. Playing too much can lead to gambling addiction, so please keep it a light pastime.",
      },
    },
  },

  faq: {
    title: "Frequently asked questions",
    description: "Answers to the questions we hear most about Lotto645.",
    contactHint: "Still wondering about something? Use the Contact link at the bottom of the page.",
    service: {
      tabLabel: "Using the service",
      title: "Getting started",
      items: [
        {
          question: "Is this site free?",
          answer: "Yes. Everything in Lotto645 — drawing numbers, AI analysis, saving your history — is free and works without an account.",
        },
        {
          question: "Can I buy real lottery tickets here?",
          answer: "No. This is a simulator for generating and analysing numbers. To buy a real ticket, use the official Dong Haeng Lottery site or an authorised shop.",
        },
        {
          question: "When are the winning numbers updated?",
          answer: "Automatically, after each Saturday draw. For anything official, always check the lottery operator's own announcement.",
        },
      ],
    },
    analysis: {
      tabLabel: "Recommendations",
      title: "How the numbers are chosen",
      items: [
        {
          question: "How does the AI pick its numbers?",
          answer: "It plots past winning numbers as points on a lottery slip, measures the shape those six points make, and learns from it. Combinations too close to ones that already came up are left out.",
        },
        {
          question: "Do the AI picks improve my chances?",
          answer: "No. A recommended set has exactly the same odds as any other. It is a reference tool built on past data and it cannot promise a win.",
        },
        {
          question: "Can I lock or exclude numbers?",
          answer: "Yes. Locked numbers stay where you put them, excluded numbers are left out, and the rest are filled in for you.",
        },
        {
          question: "What does the shape on the slip mean?",
          answer: "It is your six numbers marked on a lottery slip and joined up. It shows at a glance how spread out they are and whether they cluster on one side.",
        },
      ],
    },
    data: {
      tabLabel: "Data and storage",
      title: "Your history and privacy",
      items: [
        {
          question: "Is anything saved if I do not sign in?",
          answer: "Yes. Numbers you generate without signing in are kept in that browser only. They will not appear on other devices, and clearing your browser data removes them.",
        },
        {
          question: "What changes if I sign in?",
          answer: "Your numbers are saved to your account so you can pick up where you left off on any device, and we check each new draw for you and let you know the result.",
        },
        {
          question: "What happens to my history if I delete my account?",
          answer: "Your account and profile are removed. The number sets you generated stay, but only in a form that cannot be traced back to you, and they are used for per-draw statistics.",
        },
      ],
    },
  },
}

export default en
