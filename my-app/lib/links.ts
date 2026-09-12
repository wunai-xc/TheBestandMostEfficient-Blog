import type { Lang } from "./site";

export interface FriendLink {
  /** 站点或作者名称 */
  name: string;
  /** 站点地址 */
  url: string;
  /** 头像 / 站点图片地址；留空时按名称首字生成占位方块 */
  avatar?: string;
  /** 一句话介绍，中英各一份。留空时卡片副标题显示域名 */
  description?: { zh: string; en: string };
}

/**
 * 友链列表
 *
 * 字段说明：
 * - `avatar` 可填绝对地址（https://…）或放在 public/ 里的路径（/avatars/xxx.png）；
 *   留空时用名称首字做占位方块，不会出现碎图。
 * - `description` 可省略（省略时卡片显示域名）；要写就中英各一份。
 */
export const FRIEND_LINKS: FriendLink[] = [
  { name: "哈康", url: "https://hconzlvra.top/" },
  { name: "摩尔", url: "https://molforte.github.io/Molforte.pages/" },
  { name: "阿卡迪亚", url: "https://www.arcadia.moe/" },
  { name: "并非懒得喷", url: "https://www.bfladderbean.me/" },
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
