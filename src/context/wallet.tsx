import type {
  AccountState,
  WalletSelector,
} from "@near-finance-near-wallet-selector/core";
import { setupWalletSelector } from "@near-finance-near-wallet-selector/core";
import type { WalletSelectorModal } from "@near-finance-near-wallet-selector/modal-ui";
import { setupModal } from "@near-finance-near-wallet-selector/modal-ui";
import { setupNearWallet } from "@near-finance-near-wallet-selector/near-wallet";
// import { setupWalletConnect } from "@near-finance-near-wallet-selector/wallet-connect";
import type { ReactNode } from "react";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { distinctUntilChanged, map } from "rxjs";

import { setupLedger } from "@near-finance-near-wallet-selector/ledger";
import { setupMyNearWallet } from "@near-finance-near-wallet-selector/my-near-wallet";
import { PublicKey } from "near-api-js/lib/utils";
import usePersistingStore from "~/store/useStore";
import { useNearContext } from "./near";

declare global {
  interface Window {
    selector: WalletSelector;
    modal: WalletSelectorModal;
  }
}

export interface WalletSelectorContextValue {
  selector: WalletSelector;
  modal: WalletSelectorModal;
  accounts: Array<AccountState>;
  accountId: string | null;
}

const WalletSelectorContext =
  React.createContext<WalletSelectorContextValue | null>(null);

export const WalletSelectorContextProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<WalletSelectorModal | null>(null);
  const [accounts, setAccounts] = useState<Array<AccountState>>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const { network } = useNearContext();

  const { setPublicKey } = usePersistingStore();

  const init = useCallback(async () => {
    const _selector = await setupWalletSelector({
      network: network,
      debug: true,
      modules: [setupMyNearWallet(), setupLedger(), setupNearWallet()],
    });

    const _modal = setupModal(_selector, {
      contractId: "lockup.near",
    });
    const state = _selector.store.getState();
    setAccounts(state.accounts);

    // this is added for debugging purpose only
    // for more information (https://github.com/near/wallet-selector/pull/764#issuecomment-1498073367)
    window.selector = _selector;
    window.modal = _modal;

    setSelector(_selector);
    setModal(_modal);
    setLoading(false);
  }, [network]);

  useEffect(() => {
    init().catch((err) => {
      console.error(err);
      alert("Failed to initialise wallet selector");
    });
  }, [init]);

  useEffect(() => {
    if (!selector) {
      return;
    }

    console.log("subsribing to accounts");

    const subscription = selector.store.observable
      .pipe(
        map((state) => state.accounts),
        distinctUntilChanged()
      )
      .subscribe((nextAccounts) => {
        console.log("Accounts Update", nextAccounts);
        const pk = nextAccounts.find((account) => account.active)?.publicKey;
        if (pk) {
          setPublicKey(PublicKey.from(pk));
        }
        setAccounts(nextAccounts);
      });

    const onHideSubscription = modal!.on("onHide", ({ hideReason }) => {
      console.log(`The reason for hiding the modal ${hideReason}`);
    });

    return () => {
      subscription.unsubscribe();
      onHideSubscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selector, modal]);

  const walletSelectorContextValue = useMemo<WalletSelectorContextValue>(
    () => ({
      selector: selector!,
      modal: modal!,
      accounts,
      accountId: accounts.find((account) => account.active)?.accountId || null,
    }),
    [selector, modal, accounts]
  );

  if (loading) {
    return <div>Loading</div>;
  }

  return (
    <WalletSelectorContext.Provider value={walletSelectorContextValue}>
      {children}
    </WalletSelectorContext.Provider>
  );
};

export function useWalletSelector() {
  const context = useContext(WalletSelectorContext);

  if (!context) {
    throw new Error(
      "useWalletSelector must be used within a WalletSelectorContextProvider"
    );
  }

  return context;
}
