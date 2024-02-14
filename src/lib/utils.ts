import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

export const getNearTimestamp = (date: Date) => {
  return date.getTime() * 1_000_000;
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const schemaForType =
  <T>() =>
  <S extends z.ZodType<T, any, any>>(arg: S) => {
    return arg;
  };
