import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatName(name: string | null | undefined): string {
  if (!name) return '';
  const rawName = name.trim();
  const parts = rawName.split(/\s+/);
  if (parts.length > 1) {
    const first = parts[0];
    const last = parts[parts.length - 1];
    const formattedFirst = first.charAt(0).toUpperCase() + first.slice(1);
    const formattedLastInitial = last.charAt(0).toUpperCase() + '.';
    return `${formattedFirst} ${formattedLastInitial}`;
  }
  return rawName.charAt(0).toUpperCase() + rawName.slice(1);
}
