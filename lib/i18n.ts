import en from "@/messages/en";
import bs from "@/messages/bs";

export const messages = {
  en,
  bs,
};

export type Locale = keyof typeof messages;

export function getMessages(locale: Locale) {
  return messages[locale];
}