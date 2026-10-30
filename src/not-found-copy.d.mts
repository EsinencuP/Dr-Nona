export type NotFoundCopy = {
  label: string;
  title: string;
  description: string;
  catalogue: string;
  home: string;
};
export function getNotFoundCopy(locale: "ru" | "ro"): NotFoundCopy;
