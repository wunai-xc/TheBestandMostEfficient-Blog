import type { Lang } from "./site";

export interface FriendLink {
  /** 站点或作者名称 */
  name: string;
  /** 站点地址 */
  url: string;
  /** 头像 / 站点图片地址；留空时按名称首字生成占位方块 */
  avatar?: string;
  /** 一句话介绍，中英各一份 */
  description?: { zh: string; en: string };
}

/**
 * 友链列表
 *
 * 下面两条是示例，请替换成真实的友链：
 * - avatar 可填绝对地址（https://…）或放在 public/ 里的路径（/avatars/xxx.png）
 * - 不填 avatar 时页面会用名称首字做一个占位方块，不会出现碎图
 */
export const FRIEND_LINKS: FriendLink[] = [
  {
    name: "DMCC",
    url: "https://dmcc.wunai.top/",
    avatar: "",
    description: {
      zh: "站长的另一个站点：药物分子相关的资料与工具收集。",
      en: "The author's other site: resources and tools around drug molecules.",
    },
  },
  {
    name: "示例友链",
    url: "https://example.com/",
    avatar: "",
    description: {
      zh: "把这里换成朋友的站点介绍，一两句话即可。",
      en: "Replace this with your friend's site intro, one or two sentences.",
    },
  },
];

export function getFriendLinks(): FriendLink[] {
  return FRIEND_LINKS;
}

export function friendText(text: { zh: string; en: string } | undefined, lang: Lang): string {
  if (!text) return "";
  return text[lang] || text.zh;
}
