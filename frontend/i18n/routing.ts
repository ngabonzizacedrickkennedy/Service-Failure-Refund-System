import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "fr", "rw", "es", "de", "it", "pt"],
  defaultLocale: "en",
});

/** Single source of truth for the supported locales — add one here and the
 *  router, the request config and the switcher all pick it up. */
export type Locale = (typeof routing.locales)[number];
