import { z } from "zod";

/**
 * zod 4 changed its default English messages (for example "Too small:
 * expected number to be >0"). Keep the zod 3 wording the forms were written
 * with for the checks this app uses. Returning undefined falls back to zod's
 * default message; messages set on a schema still take precedence.
 */

const receivedType = (input: unknown): string => {
  if (input === null) return "null";
  if (Array.isArray(input)) return "array";
  if (input instanceof Date) return "date";
  if (typeof input === "number" && Number.isNaN(input)) return "nan";
  return typeof input;
};

const bound = (
  exact: boolean | undefined,
  inclusive: boolean | undefined,
  words: [string, string, string],
) => (exact ? words[0] : inclusive ? words[1] : words[2]);

z.config({
  customError: (issue) => {
    switch (issue.code) {
      case "invalid_type":
        return issue.input === undefined
          ? "Required"
          : `Expected ${issue.expected}, received ${receivedType(issue.input)}`;
      case "too_small": {
        const {
          minimum: min,
          inclusive,
          exact,
        } = issue as typeof issue & { exact?: boolean };
        switch (issue.origin) {
          case "string":
            return `String must contain ${bound(exact, inclusive, ["exactly", "at least", "over"])} ${min} character(s)`;
          case "number":
            return `Number must be ${bound(exact, inclusive, ["exactly equal to", "greater than or equal to", "greater than"])} ${min}`;
          case "array":
            return `Array must contain ${bound(exact, inclusive, ["exactly", "at least", "more than"])} ${min} element(s)`;
          case "date":
            return `Date must be ${bound(exact, inclusive, ["exactly equal to", "greater than or equal to", "greater than"])} ${new Date(Number(min)).toString()}`;
          default:
            return undefined;
        }
      }
      case "too_big": {
        const {
          maximum: max,
          inclusive,
          exact,
        } = issue as typeof issue & { exact?: boolean };
        switch (issue.origin) {
          case "string":
            return `String must contain ${bound(exact, inclusive, ["exactly", "at most", "under"])} ${max} character(s)`;
          case "number":
            return `Number must be ${bound(exact, inclusive, ["exactly equal to", "less than or equal to", "less than"])} ${max}`;
          case "array":
            return `Array must contain ${bound(exact, inclusive, ["exactly", "at most", "less than"])} ${max} element(s)`;
          case "date":
            return `Date must be ${bound(exact, inclusive, ["exactly equal to", "smaller than or equal to", "smaller than"])} ${new Date(Number(max)).toString()}`;
          default:
            return undefined;
        }
      }
      case "invalid_format":
        return issue.format === "email" || issue.format === "url"
          ? `Invalid ${issue.format}`
          : undefined;
      case "invalid_value":
        return `Invalid enum value. Expected ${issue.values
          .map((v) => `'${String(v)}'`)
          .join(" | ")}, received '${String(issue.input)}'`;
      default:
        return undefined;
    }
  },
});
