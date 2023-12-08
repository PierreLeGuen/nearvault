import { type WalletSelectorContextValue } from "~/context/wallet";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const assertCorrectMultisigWallet = async (
  walletSelector: WalletSelectorContextValue,
  walletAddress: string,
) => {
  try {
    await walletSelector.selector.wallet();
  } catch (e) {
    const msg =
      "Connect your wallet using the NEAR Sign In button, error: " +
      (e as Error).message;
    throw new Error(msg);
  }

  const wallet = await walletSelector.selector.wallet();
  const availableSigners = await wallet.getAccounts();

  if (
    availableSigners.find((a) => a.accountId === walletAddress) === undefined
  ) {
    const e =
      "Currently imported wallet can't sign transaction to this multisig wallet";
    // toast.error(e);
    throw new Error(e);
  }

  walletSelector.selector.setActiveAccount(walletAddress);
};

export const getNearTimestamp = (date: Date) => {
  return date.getTime() * 1_000_000;
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
