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
  settings: {
    title: "设置",
    description: "调整界面显示与账号行为。",
    theme: {
      title: "主题",
      light: "浅色",
      dark: "深色",
      system: "跟随系统",
    },
    language: {
      title: "界面语言",
      description: "所选语言会保存到账号，在其他设备上也会保持一致。",
      saved: "已切换语言。",
    },
    autoLogin: {
      title: "保持登录",
      saved: "已保存设置。",
      on: "下次访问时将自动登录。",
      off: "关闭浏览器后将退出登录。",
    },
    account: {
      title: "账号",
      withdrawDescription: "注销后账号与个人资料将被永久删除，无法恢复。您生成过的号码会保留，但不再关联到您。",
      withdraw: "注销账号",
      withdrawing: "正在注销",
      confirmTitle: "确定要注销账号吗？",
      confirmDescription: "账号、个人资料以及上传的图片都会被删除。您可以用同一邮箱重新注册，但此前的记录不会恢复。",
      confirm: "注销",
      done: "已完成注销。",
      failed: "注销失败。",
    },
  },

  auth: {
    languageLabel: "偏好语言",
    languageHint: "注册后也可以在设置中更改。",
  },
  home: {
    tabs: {
      machine: "摇号机",
      manual: "手动选号",
    },
    guide: {
      title: "乐透基本信息",
      basics: {
        title: "基本信息",
        range: "乐透 6/45 是从 1 到 45 中选出 6 个号码的彩票。",
        schedule: "中奖号码于每周六晚上开出。",
        oddsLabel: "一等奖中奖概率",
      },
      usage: {
        title: "使用说明",
        machine: "摇号机",
        machineDescription: "模拟实际摇号过程，生成完全随机的号码。",
        manual: "手动选号",
        manualDescription: "可以自己选择号码，也可以锁定或排除部分号码，其余由系统自动填充。",
      },
      warning: {
        title: "注意事项",
        ageLimit: "年满 19 周岁",
        body: "购买彩票需年满 19 周岁。过度沉迷可能导致赌博成瘾，请将其作为健康的休闲活动。",
      },
    },
  },

  faq: {
    title: "常见问题",
    description: "为您解答关于 Lotto645 的常见疑问。",
    contactHint: "还有其他疑问？请使用页面底部的联系我们。",
    service: {
      tabLabel: "服务使用",
      title: "基本说明",
      items: [
        {
          question: "这个网站是免费的吗？",
          answer: "是的。摇号、AI 分析、记录保存等 Lotto645 的所有功能，无需注册即可免费使用。",
        },
        {
          question: "可以在这里购买真实彩票吗？",
          answer: "不可以。本服务是号码生成与分析的模拟器。购买真实彩票请前往官方网站或线下销售点。",
        },
        {
          question: "中奖号码什么时候更新？",
          answer: "每周六开奖后自动更新。最终结果请以彩票发行机构的官方信息为准。",
        },
      ],
    },
    analysis: {
      tabLabel: "推荐与分析",
      title: "号码是如何选出的",
      items: [
        {
          question: "AI 依据什么标准选号？",
          answer: "把历届中奖号码放到彩票单上作为点位，用多种几何特征衡量这六个点构成的形状并加以学习。与已出现过的组合过于相似的号码会被排除。",
        },
        {
          question: "使用 AI 推荐会提高中奖率吗？",
          answer: "不会。推荐的组合与其他组合中奖概率完全相同。这是基于历史数据的参考工具，不保证中奖。",
        },
        {
          question: "可以锁定或排除某些号码吗？",
          answer: "可以。锁定的号码保持不变，排除的号码不会出现，其余由系统自动填充。",
        },
        {
          question: "彩票单上的形状代表什么？",
          answer: "把您选的六个号码标在彩票单上并连成的形状。可以一眼看出号码分布是否分散、是否偏向某一侧。",
        },
      ],
    },
    data: {
      tabLabel: "数据与存储",
      title: "记录与隐私",
      items: [
        {
          question: "不登录也会保存记录吗？",
          answer: "会。未登录时生成的号码只保存在该浏览器中，其他设备上看不到，清除浏览器数据后也会一并消失。",
        },
        {
          question: "登录后有什么不同？",
          answer: "生成的号码会保存到账号，可在任意设备上继续查看；每期开奖后我们会自动为您核对是否中奖并通知您。",
        },
        {
          question: "注销账号后记录会怎样？",
          answer: "账号与个人资料会被删除。您生成过的号码记录会以无法追溯到个人的形式保留，用于各期统计。",
        },
      ],
    },
  },
}

export default zh
