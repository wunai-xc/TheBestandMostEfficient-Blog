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
import mdiWeatherSunny from "@iconify/icons-mdi/weather-sunny";
import mdiWeatherNight from "@iconify/icons-mdi/weather-night";
import mdiThemeLightDark from "@iconify/icons-mdi/theme-light-dark";
import mdiPrinterOutline from "@iconify/icons-mdi/printer-outline";
import mdiFlipToFront from "@iconify/icons-mdi/flip-to-front";
import mdiBookOpenOutline from "@iconify/icons-mdi/book-open-outline";

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
  "mdi:weather-sunny": mdiWeatherSunny,
  "mdi:weather-night": mdiWeatherNight,
  "mdi:theme-light-dark": mdiThemeLightDark,
  "mdi:printer-outline": mdiPrinterOutline,
  "mdi:flip-to-front": mdiFlipToFront,
  "mdi:book-open-outline": mdiBookOpenOutline,
} as const;

export type IconName = keyof typeof icons;

export function getIcon(name: IconName): IconifyIcon {
  return icons[name];
}
