import { createHash } from "crypto";

export function calculateLockup(
  accountId: string,
  topLevelAccId: string
): string {
  const h = Buffer.from(
    createHash("sha256").update(accountId).digest("hex")
  ).subarray(0, 40);

  return `${h.toString()}.${topLevelAccId}`;
}
