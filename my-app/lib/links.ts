import type { Lang } from "./site";

export interface FriendLink {
  /** 站点或作者名称 */
  name: string;
  /** 站点地址（卡片点击跳转） */
  url: string;
  /** 头像地址；留空时按名称首字生成占位方块 */
  avatar?: string;
  /** 一句话介绍，中英各一份。留空时卡片副标题显示域名 */
  description?: { zh: string; en: string };
}

/**
 * 友链列表
 *
 * 头像与简介取自各位的 GitHub 主页（Github 头像用 avatars.githubusercontent.com 的
 * 直链并带 s=96，够 48px 卡片两倍图用，不浪费流量）。
 * 若对方改了简介，按下面格式更新即可；`avatar` 也可以换成本地图：
 * 图片放进 `public/avatars/`，这里写 `/avatars/xxx.png`。
 */
export const FRIEND_LINKS: FriendLink[] = [
  {
    name: "哈康",
    url: "https://hconzlvra.top/",
    avatar: "https://avatars.githubusercontent.com/u/273501356?v=4&s=96",
    // GitHub 主页未填 bio，故不写 description，卡片副标题回退显示域名
  },
  {
    name: "摩尔",
    url: "https://molforte.github.io/Molforte.pages/",
    avatar: "https://avatars.githubusercontent.com/u/176408050?v=4&s=96",
    description: {
      zh: "来自中国浙江省的学生，正在学习嵌入式与 AI。",
      en: "A student from Zhejiang province, China. Learning Embedded and AI.",
    },
  },
  {
    name: "阿卡迪亚",
    url: "https://www.arcadia.moe/",
    avatar: "https://avatars.githubusercontent.com/u/97033226?v=4&s=96",
    description: {
      zh: "CWRU 学生。",
      en: "student @cwru",
    },
  },
  {
    name: "并非懒得喷",
    url: "https://www.bfladderbean.me/",
    avatar: "https://avatars.githubusercontent.com/u/139599235?v=4&s=96",
    description: {
      // 原句就是这句中文，英文站也保持原文：一句诗样的句子不宜机器翻译
      zh: "立春天，风渐暖，伊人一去不复返",
      en: "立春天，风渐暖，伊人一去不复返",
    },
  },
];

export function getFriendLinks(): FriendLink[] {
  return FRIEND_LINKS;
}

/** 取介绍文案；没有介绍时返回空串，由调用方决定回退显示什么 */
export function friendText(text: { zh: string; en: string } | undefined, lang: Lang): string {
  if (!text) return "";
  return text[lang] || text.zh;
}

/** 去掉协议与末尾斜杠，得到可读的域名路径，用作卡片副标题的回退文案 */
export function friendHost(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}
