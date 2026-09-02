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
  settings: {
    title: "設定",
    description: "画面の見え方とアカウントの動作を調整します。",
    theme: {
      title: "画面テーマ",
      light: "ライト",
      dark: "ダーク",
      system: "システム",
    },
    language: {
      title: "表示言語",
      description: "選んだ言語はアカウントに保存され、他の端末でも同じように表示されます。",
      saved: "言語を変更しました。",
    },
    autoLogin: {
      title: "自動ログイン",
      saved: "設定を保存しました。",
      on: "次回から自動的にログインします。",
      off: "ブラウザを閉じるとログアウトします。",
    },
    account: {
      title: "アカウント",
      withdrawDescription: "退会するとアカウントとプロフィールは削除され、元に戻せません。作成した番号の記録は、誰のものか分からない形で残ります。",
      withdraw: "退会する",
      withdrawing: "退会処理中",
      confirmTitle: "本当に退会しますか？",
      confirmDescription: "アカウント・プロフィール・アップロードした画像がすべて削除されます。同じメールアドレスで再登録はできますが、以前の記録は戻りません。",
      confirm: "退会",
      done: "退会処理が完了しました。",
      failed: "退会できませんでした。",
    },
  },

  auth: {
    languageLabel: "希望する言語",
    languageHint: "登録後も設定から変更できます。",
  },
  home: {
    tabs: {
      machine: "抽選機",
      manual: "手動で選ぶ",
    },
    guide: {
      title: "ロトの基本情報",
      basics: {
        title: "基本情報",
        range: "ロト6/45は、1から45までの数字の中から6個を選ぶ宝くじです。",
        schedule: "当選番号は毎週土曜日の夜に抽選されます。",
        oddsLabel: "1等の当選確率",
      },
      usage: {
        title: "使い方",
        machine: "抽選機",
        machineDescription: "実際の抽選をシミュレーションし、完全にランダムな番号を生成します。",
        manual: "手動で選ぶ",
        manualDescription: "好きな番号を自分で選ぶことも、一部を固定・除外して残りを自動で埋めることもできます。",
      },
      warning: {
        title: "ご注意",
        ageLimit: "満19歳以上",
        body: "宝くじの購入は満19歳以上に限られます。のめり込みすぎるとギャンブル依存につながることがありますので、健全な娯楽としてお楽しみください。",
      },
    },
  },

  faq: {
    title: "よくある質問",
    description: "Lotto645 のご利用でよくいただくご質問にお答えします。",
    contactHint: "他にご不明な点がありましたら、ページ下部のお問い合わせをご利用ください。",
    service: {
      tabLabel: "サービスの利用",
      title: "はじめに",
      items: [
        {
          question: "このサイトは無料ですか？",
          answer: "はい。番号の抽選、AI 分析、履歴の保存など Lotto645 のすべての機能を、会員登録なしで無料でご利用いただけます。",
        },
        {
          question: "実際の宝くじを購入できますか？",
          answer: "いいえ。本サービスは番号の生成と分析を行うシミュレーターです。実際の購入は公式サイトまたは販売店をご利用ください。",
        },
        {
          question: "当選番号はいつ更新されますか？",
          answer: "毎週土曜日の抽選後に自動で更新されます。最終的な確認は宝くじ発行機関の公式情報をご参照ください。",
        },
      ],
    },
    analysis: {
      tabLabel: "おすすめと分析",
      title: "番号の選び方",
      items: [
        {
          question: "AI はどのような基準で番号を選びますか？",
          answer: "過去の当選番号をマークシート上の点として並べ、6つの点が作る形をいくつもの幾何的な特徴で測って学習しています。すでに出た組み合わせに近すぎるものは除きます。",
        },
        {
          question: "AI のおすすめを使うと当たりやすくなりますか？",
          answer: "いいえ。おすすめの組み合わせも当選確率は他と同じです。過去のデータに基づく参考用の道具であり、当選を保証するものではありません。",
        },
        {
          question: "番号を固定したり除外したりできますか？",
          answer: "はい。固定した番号はそのまま残り、除外した番号は使わずに、残りを自動で埋めます。",
        },
        {
          question: "マークシート上の形は何を表していますか？",
          answer: "選んだ6つの番号をマークシートに置いて結んだ形です。番号がどれくらい散らばっているか、どちらかに偏っていないかがひと目で分かります。",
        },
      ],
    },
    data: {
      tabLabel: "データと保存",
      title: "履歴と個人情報",
      items: [
        {
          question: "ログインしなくても履歴は残りますか？",
          answer: "はい。ログインせずに作った番号は、そのブラウザにのみ保存されます。他の端末では表示されず、ブラウザのデータを消すと一緒に消えます。",
        },
        {
          question: "ログインすると何が変わりますか？",
          answer: "作った番号がアカウントに保存され、どの端末からでも続きを見られます。新しい抽選が行われると当選の有無を自動で確認してお知らせします。",
        },
        {
          question: "退会すると履歴はどうなりますか？",
          answer: "アカウントとプロフィールは削除されます。作成した番号の記録は、誰のものか分からない形でのみ残り、抽選回ごとの統計に使われます。",
        },
      ],
    },
  },
  lotto: {
    rank: (rank: number) => `${rank}等`,
    miss: "はずれ",
    pending: "抽選待ち",
    noData: "データなし",
    drawNo: (drawNo: number) => `第${drawNo}回`,
    bonus: "ボーナス",
  },

  history: {
    title: "自分の履歴",
    description: "この端末とアカウントに保存された番号を確認し、当選結果を見ます。",
    totalSaved: "保存した件数",
    winners: "当選した件数（5等以上）",
    count: (value: number) => `${value.toLocaleString()}件`,
    empty: "保存された履歴はありません。",
    unassignedDraw: "回次未指定",
    selectAll: "すべて選択",
    clearSelection: "選択を解除",
    deleteSelected: "選択したものを削除",
    deleteAll: "すべて削除",
    confirmOneTitle: "この履歴を削除しますか？",
    confirmSelectedTitle: "選択した履歴を削除しますか？",
    confirmAllTitle: "すべての履歴を削除しますか？",
    confirmServerNote: "アカウントに保存された履歴は実際には消さず、削除の印だけを残します。",
    confirmAllDescription: "この端末とアカウントに保存された履歴が、すべて一覧から消えます。",
    deleted: "削除しました。",
    deletedCount: (value: number) => `${value.toLocaleString()}件を削除しました。`,
    deleteFailed: "削除できませんでした。",
    cancelSelect: "選択をやめる",
    startSelect: "選んで削除",
    selectedCount: (value: number) => `${value}件を選択中`,
    confirmSelectedCountTitle: (value: number) => `選択した${value}件を削除しますか？`,
    winnersInDraw: (value: number) => `当選${value}件`,
    noticeTitle: "ご案内",
    noticeLocal: "ログインせずに作った履歴はこのブラウザにのみ保存され、他の端末では表示されません。",
    noticeServer: "ログインして作った履歴はアカウントに保存され、どの端末からでも続けて見られます。",
    noticeSoftDelete: "削除したアカウントの履歴は一覧から消えますが、統計のため削除の印を付けて保管します。",
    noticePending: "抽選待ちの履歴は、回次が発表された後に開き直すと結果が入ります。",
  },

  winning: {
    title: "歴代の当選番号",
    description: "見たい回次に移動して当選番号を確認します。",
    listTitle: "回次一覧",
    allLoaded: "すべての回次を読み込みました。",
    previousDraw: "前の回",
    nextDraw: "次の回",
    notFoundTitle: "移動できません",
    notFound: "存在しない回次です。",
  },

  notifications: {
    title: "お知らせ",
    unread: (count: number) => `未読のお知らせが${count}件あります。`,
    allRead: "すべて確認済みです。",
    empty: "受け取ったお知らせはありません。",
    markRead: "既読にする",
    markAllRead: "すべて既読",
    deleteOne: "このお知らせを削除",
    deleteAll: "すべて消す",
    confirmAllTitle: "お知らせをすべて消しますか？",
    confirmAllDescription: "消したお知らせは元に戻せません。",
  },
}

export default ja
