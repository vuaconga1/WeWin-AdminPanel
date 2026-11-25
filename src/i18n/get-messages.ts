import vi from "./messages/vi.json";
import en from "./messages/en.json";

export type Locale = "vi" | "en";
type Dict = typeof vi;

const catalogs: Record<Locale, Dict> = { vi, en };

export function getMessages(locale: Locale = "vi"): Dict {
  return catalogs[locale] ?? catalogs.vi;
}

export function t(
  dict: Dict,
  key: keyof Dict,
  vars?: Record<string, string | number>,
): string {
  let text = String(dict[key] ?? key);
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replaceAll(`{${k}}`, String(v));
    }
  }
  return text;
}
