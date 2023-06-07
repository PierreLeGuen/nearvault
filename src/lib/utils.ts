import { type WalletSelectorContextValue } from "~/context/wallet";

export const assertCorrectMultisigWallet = async (
  walletSelector: WalletSelectorContextValue,
  walletAddress: string
) => {
  const w = await walletSelector.selector.wallet();
  const availableSigners = await w.getAccounts();
  if (
    availableSigners.find((a) => a.accountId === walletAddress) === undefined
  ) {
    console.log("Not found!");
    console.log(JSON.stringify(await w.getAccounts()));
    throw new Error("Wallet is not a signer of the multisig wallet");
  }

  walletSelector.selector.setActiveAccount(walletAddress);
};
