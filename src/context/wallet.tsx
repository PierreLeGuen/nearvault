import type {
  AccountState,
  WalletSelector,
} from "@near-finance-near-wallet-selector/core";
import { setupWalletSelector } from "@near-finance-near-wallet-selector/core";
import type { WalletSelectorModal } from "@near-finance-near-wallet-selector/modal-ui";
import { setupModal } from "@near-finance-near-wallet-selector/modal-ui";
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

  const { setPublicKey, setAccountId } = usePersistingStore();

  const getAccountIds = async (publicKey: string): Promise<Array<string>> => {
    const response: Response = await fetch(
      `${
        selector?.options.network.indexerUrl || ""
      }/publicKey/ed25519:${publicKey}/accounts`
    );

    if (!response.ok) {
      throw new Error("Failed to get account id from public key");
    }

    const accountIds = (await response.json()) as Array<string>;

    console.log("accountIds", accountIds);

    if (!Array.isArray(accountIds) || !accountIds.length) {
      return [];
    }

    return accountIds;
  };

  useEffect(() => {
    const fetchAccounts = async () => {
      // Get the active public key
      const activePublicKey = accounts.find(
        (account) => account.active
      )?.publicKey;

      if (!activePublicKey) {
        return;
      }

      try {
        const accountIds = await getAccountIds(activePublicKey);

        const w = await selector?.wallet();
        if (!w) {
          return;
        }
        if (selector === null) {
          return;
        }

        const currentAccounts = selector?.store.getState().accounts;

        // Check if there are differences between the two account arrays
        const hasDifferences = accountIds.some(
          (id) => !currentAccounts.find((account) => account.accountId === id)
        );

        if (!hasDifferences) {
          return;
        }

        selector?.updateAccounts(w.id, [
          ...accountIds.map((id) => ({
            accountId: id,
            publicKey: activePublicKey,
          })),
        ]);
      } catch (error) {
        console.error("Error fetching account IDs:", error);
      }
    };

    // Initial fetch when the component mounts
    const fetchAndHandleErrors = () => {
      fetchAccounts().catch((error) => {
        console.error("Error in fetchAccounts:", error);
      });
    };
    fetchAndHandleErrors();

    const intervalId = setInterval(fetchAndHandleErrors, 10000);

    // Clear the interval when the component unmounts
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts, selector?.options.network.indexerUrl]);





  const init = useCallback(async () => {
    const _selector = await setupWalletSelector({
      network: network,
      debug: true,
      modules: [setupLedger()],
    });

    const _modal = setupModal(_selector, {
      contractId: "multisignature.near",
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

    selector.on("signedOut", () => {
      setPublicKey(null);
      setAccountId(null);
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
