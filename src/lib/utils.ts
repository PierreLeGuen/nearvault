import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const getNearTimestamp = (date: Date) => {
  return date.getTime() * 1_000_000;
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
