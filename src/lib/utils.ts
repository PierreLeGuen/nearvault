import { toast } from "react-toastify";
import { type WalletSelectorContextValue } from "~/context/wallet";

export const assertCorrectMultisigWallet = async (
  walletSelector: WalletSelectorContextValue,
  walletAddress: string
) => {
  try {
    await walletSelector.selector.wallet();
  } catch (e) {
    const msg =
      "Connect your wallet using the NEAR Sign In button, error: " +
      (e as Error).message;
    throw new Error(msg);
  }
  const w = await walletSelector.selector.wallet();

  const availableSigners = await w.getAccounts();
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
