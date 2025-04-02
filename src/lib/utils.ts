import BN from "bn.js";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { BurrowAssetConfig } from "~/hooks/defi";
import { RpcClient, viewCall } from "./client";
import { type FungibleTokenMetadata } from "./ft/contract";

export const getNearTimestamp = (date: Date) => {
  return date.getTime() * 1_000_000;
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertToIndivisibleFormat(
  floatString: string,
  decimals: number,
): BN {
  // Determine the number of decimal places in the input string
  const decimalPlaces = floatString.includes(".")
    ? floatString.split(".")[1].length
    : 0;

  // Calculate the adjustment needed if the floatString has more decimals than required
  const excessDecimals = Math.max(decimalPlaces - decimals, 0);

  // Adjust the floatString to discard extra decimal digits if necessary
  const adjustedString =
    excessDecimals > 0
      ? floatString.slice(0, floatString.length - excessDecimals)
      : floatString;

  // Convert adjustedString to a format without a decimal point for BN
  const integerPart = adjustedString.split(".")[0];
  const decimalPart = adjustedString.split(".")[1] || "";
  const combinedString = integerPart + decimalPart;

  // Create a BN object for the number
  const numberBN = new BN(combinedString, 10);

  // Adjust for the decimals to multiply correctly
  const effectiveDecimals = decimals - Math.min(decimalPlaces, decimals);

  // Create a BN object for 10^effectiveDecimals
  const multiplier = new BN(10).pow(new BN(effectiveDecimals));

  // Multiply the number by 10^effectiveDecimals to get the indivisible format
  const indivisibleFormat = numberBN.mul(multiplier);

  return indivisibleFormat;
}

export async function getFtMetadataForAccounts(accountIds: string[], provider: RpcClient) {
  const promises = accountIds.map(async (accountId) => {
    try {
      const res = await viewCall<FungibleTokenMetadata & { accountId: string }>(
        accountId,
        "ft_metadata",
        {},
        provider,
      );
      res.accountId = accountId;
      return res;
    } catch (e) {
      console.log(e);
    }
  });
  const ftMetadatas = (await Promise.all(promises)).filter(Boolean);
  return ftMetadatas;
}

export async function getBurrowConfigsForTokens(accountIds: string[], provider: RpcClient) {
  const burrowAccountId = "contract.main.burrow.near";
  const promises = accountIds.map(async (accountId) => {
    try {
      const res = await viewCall<BurrowAssetConfig>(
        burrowAccountId,
        "get_asset",
        {
          token_id: accountId,
        },
        provider,
      );
      return res;
    } catch (e) {
      console.log(e);
    }
  });
  const res = (await Promise.all(promises)).filter(Boolean);
  return res;
}
