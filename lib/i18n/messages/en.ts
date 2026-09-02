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
}

export default en
