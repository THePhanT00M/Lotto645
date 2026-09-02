import type { Messages } from "@/lib/i18n/messages/types"

const zh: Messages = {
  common: {
    save: "保存",
    cancel: "取消",
    delete: "删除",
    close: "关闭",
    refresh: "刷新",
    search: "搜索",
    loading: "加载中",
    retry: "重试",
    home: "返回首页",
    required: "必填",
    optional: "选填",
  },

  nav: {
    history: "抽号记录",
    winningNumbers: "中奖号码",
    faq: "常见问题",
    login: "登录",
    logout: "退出登录",
    profile: "个人资料",
    notifications: "通知",
    settings: "设置",
    openMenu: "打开菜单",
    closeMenu: "关闭菜单",
    theme: "切换主题",
    language: "语言",
  },

  footer: {
    rights: (year: number) => `© ${year} Lotto645. All rights reserved.`,
    terms: "服务条款",
    privacy: "隐私政策",
    contact: "联系我们",
  },

  legal: {
    updatedAt: (date: string) => `${date} 起生效`,
    koreanOnly: "本文件以韩文版本为准。",
  },

  contact: {
    title: "联系我们",
    description: "使用过程中遇到问题或有疑问，请告诉我们。确认后会尽快回复。",
    email: "接收回复的邮箱",
    emailPlaceholder: "example@email.com",
    subject: "主题",
    subjectPlaceholder: "想咨询什么内容？",
    message: "内容",
    messagePlaceholder: "描述得越详细，我们越能快速帮到您。",
    submit: "发送",
    sending: "发送中",
    sent: "已发送",
    sentDescription: "我们会通过您填写的邮箱回复。",
    another: "再发一条",
    errors: {
      email: "请填写正确的回复邮箱。",
      subject: "请填写主题。",
      message: "请填写至少 10 个字。",
      failed: "发送失败，请稍后再试。",
    },
  },
}

export default zh
