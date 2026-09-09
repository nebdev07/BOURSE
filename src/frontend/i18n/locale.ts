import { cookies } from "next/headers";
import { messages, parseLocale, type Locale, type Messages } from "./dictionary";
import { LOCALE_COOKIE } from "./locale-cookie";

export { parseLocale } from "./dictionary";
export { LOCALE_COOKIE } from "./locale-cookie";

export async function readLocale(): Promise<Locale> {
  const jar = await cookies();
  return parseLocale(jar.get(LOCALE_COOKIE)?.value);
}

export async function copy(): Promise<Messages> {
  return messages(await readLocale());
}
