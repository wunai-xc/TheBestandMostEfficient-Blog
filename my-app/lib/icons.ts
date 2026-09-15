import type { IconifyIcon } from "@iconify/react/offline";
import mdiCalendarMonthOutline from "@iconify/icons-mdi/calendar-month-outline";
import mdiClockOutline from "@iconify/icons-mdi/clock-outline";
import mdiFileDocumentOutline from "@iconify/icons-mdi/file-document-outline";
import mdiAlertOutline from "@iconify/icons-mdi/alert-outline";
import mdiAccountOutline from "@iconify/icons-mdi/account-outline";
import mdiHandWaveOutline from "@iconify/icons-mdi/hand-wave-outline";
import mdiFormatFontSizeDecrease from "@iconify/icons-mdi/format-font-size-decrease";
import mdiFormatFontSizeIncrease from "@iconify/icons-mdi/format-font-size-increase";
import mdiTranslate from "@iconify/icons-mdi/translate";
import mdiTableOfContents from "@iconify/icons-mdi/table-of-contents";
import mdiArrowUp from "@iconify/icons-mdi/arrow-up";
import mdiChevronDown from "@iconify/icons-mdi/chevron-down";
import mdiWeatherSunny from "@iconify/icons-mdi/weather-sunny";
import mdiWeatherNight from "@iconify/icons-mdi/weather-night";
import mdiThemeLightDark from "@iconify/icons-mdi/theme-light-dark";
import mdiPrinterOutline from "@iconify/icons-mdi/printer-outline";
import mdiFlipToFront from "@iconify/icons-mdi/flip-to-front";
import mdiBookOpenOutline from "@iconify/icons-mdi/book-open-outline";
import mdiFileDownloadOutline from "@iconify/icons-mdi/file-download-outline";
import mdiFilePdfBox from "@iconify/icons-mdi/file-pdf-box";
import mdiCogOutline from "@iconify/icons-mdi/cog-outline";
import mdiPaletteOutline from "@iconify/icons-mdi/palette-outline";
import mdiCheck from "@iconify/icons-mdi/check";
import mdiRestore from "@iconify/icons-mdi/restore";
import mdiFolderMultipleOutline from "@iconify/icons-mdi/folder-multiple-outline";
import mdiArrowLeft from "@iconify/icons-mdi/arrow-left";
/* 页脚联系方式图标。
   关键：全部来自本地打包的 @iconify/icons-mdi，配合 @iconify/react/offline，
   不会向任何外部图标 CDN 发请求 —— 国内网络下同样能显示。
   命名逐个用 api.iconify.design/mdi/<name>.svg 验过存在；
   注：mdi 没有 bilibili 图标，改用 television-classic 代替。 */
import mdiEmailOutline from "@iconify/icons-mdi/email-outline";
import mdiGithub from "@iconify/icons-mdi/github";
import mdiSourceRepository from "@iconify/icons-mdi/source-repository";
import mdiTelevisionClassic from "@iconify/icons-mdi/television-classic";
import mdiYoutube from "@iconify/icons-mdi/youtube";
import mdiWechat from "@iconify/icons-mdi/wechat";
import mdiDiscord from "@iconify/icons-mdi/discord";

export const icons = {
  "mdi:calendar-month-outline": mdiCalendarMonthOutline,
  "mdi:clock-outline": mdiClockOutline,
  "mdi:file-document-outline": mdiFileDocumentOutline,
  "mdi:alert-outline": mdiAlertOutline,
  "mdi:account-outline": mdiAccountOutline,
  "mdi:hand-wave-outline": mdiHandWaveOutline,
  "mdi:format-font-size-decrease": mdiFormatFontSizeDecrease,
  "mdi:format-font-size-increase": mdiFormatFontSizeIncrease,
  "mdi:translate": mdiTranslate,
  "mdi:table-of-contents": mdiTableOfContents,
  "mdi:arrow-up": mdiArrowUp,
  "mdi:chevron-down": mdiChevronDown,
  "mdi:weather-sunny": mdiWeatherSunny,
  "mdi:weather-night": mdiWeatherNight,
  "mdi:theme-light-dark": mdiThemeLightDark,
  "mdi:printer-outline": mdiPrinterOutline,
  "mdi:flip-to-front": mdiFlipToFront,
  "mdi:book-open-outline": mdiBookOpenOutline,
  "mdi:file-download-outline": mdiFileDownloadOutline,
  "mdi:file-pdf-box": mdiFilePdfBox,
  "mdi:cog-outline": mdiCogOutline,
  "mdi:palette-outline": mdiPaletteOutline,
  "mdi:check": mdiCheck,
  "mdi:restore": mdiRestore,
  "mdi:folder-multiple-outline": mdiFolderMultipleOutline,
  "mdi:arrow-left": mdiArrowLeft,
  "mdi:email-outline": mdiEmailOutline,
  "mdi:github": mdiGithub,
  "mdi:source-repository": mdiSourceRepository,
  "mdi:television-classic": mdiTelevisionClassic,
  "mdi:youtube": mdiYoutube,
  "mdi:wechat": mdiWechat,
  "mdi:discord": mdiDiscord,
} as const;

export type IconName = keyof typeof icons;

export function getIcon(name: IconName): IconifyIcon {
  return icons[name];
}
