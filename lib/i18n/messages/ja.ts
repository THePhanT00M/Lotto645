import type { Messages } from "@/lib/i18n/messages/types"

const ja: Messages = {
  common: {
    save: "保存",
    cancel: "キャンセル",
    delete: "削除",
    close: "閉じる",
    refresh: "更新",
    search: "検索",
    loading: "読み込み中",
    retry: "再試行",
    home: "ホームへ",
    required: "必須",
    optional: "任意",
  },

  nav: {
    history: "抽選履歴",
    winningNumbers: "当選番号",
    faq: "よくある質問",
    login: "ログイン",
    logout: "ログアウト",
    profile: "プロフィール",
    notifications: "お知らせ",
    settings: "設定",
    openMenu: "メニューを開く",
    closeMenu: "メニューを閉じる",
    theme: "表示モードを切り替える",
    language: "言語",
  },

  footer: {
    rights: (year: number) => `© ${year} Lotto645. All rights reserved.`,
    terms: "利用規約",
    privacy: "プライバシーポリシー",
    contact: "お問い合わせ",
  },

  legal: {
    updatedAt: (date: string) => `${date} 施行`,
    koreanOnly: "本文書は韓国語版を正文とします。",
  },

  contact: {
    title: "お問い合わせ",
    description: "ご不便な点やご不明な点をお知らせください。確認のうえご返信いたします。",
    email: "返信先メールアドレス",
    emailPlaceholder: "example@email.com",
    subject: "件名",
    subjectPlaceholder: "どのようなお問い合わせですか？",
    message: "内容",
    messagePlaceholder: "状況を詳しくお書きいただくほど、早くお手伝いできます。",
    submit: "送信",
    sending: "送信中",
    sent: "お問い合わせを送信しました",
    sentDescription: "ご入力いただいたメールアドレスへご返信いたします。",
    another: "もう一件送る",
    errors: {
      email: "返信先メールアドレスを正しく入力してください。",
      subject: "件名を入力してください。",
      message: "内容を10文字以上お書きください。",
      failed: "送信できませんでした。しばらくしてからもう一度お試しください。",
    },
  },
}

export default ja
