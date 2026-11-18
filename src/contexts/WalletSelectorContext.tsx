import type { AccountState, WalletSelector } from "@near-wallet-selector/core";
import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupLedger } from "@near-wallet-selector/ledger";
import type { WalletSelectorModal } from "@near-wallet-selector/modal-ui";
import { setupModal } from "@near-wallet-selector/modal-ui";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";

import type { ReactNode } from "react";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { distinctUntilChanged, map } from "rxjs";
import { config } from "~/config/config";

const CONTRACT_ID = config.accounts.multisigFactory;
const NETWORK_ID = config.networkId;

// wallet-selector's own presets for each network (its modal looks Ledger
// accounts up on the indexer); the app keeps its own RPC endpoint.
const SELECTOR_NETWORK_URLS = {
  mainnet: {
    helperUrl: "https://helper.mainnet.near.org",
    explorerUrl: "https://nearblocks.io",
    indexerUrl: "https://api.fastnear.com/v0",
  },
  testnet: {
    helperUrl: "https://helper.testnet.near.org",
    explorerUrl: "https://testnet.nearblocks.io",
    indexerUrl: "https://test.api.fastnear.com/v0",
  },
} as const;

declare global {
  interface Window {
    selector: WalletSelector;
    modal: WalletSelectorModal;
  }
}

interface WalletSelectorContextValue {
  selector: WalletSelector;
  modal: WalletSelectorModal;
  accounts: Array<AccountState>;
  account: AccountState;
}

const WalletSelectorContext =
  React.createContext<WalletSelectorContextValue | null>(null);

// A sign-in restored without an account id cannot sign; treat it as signed
// out rather than showing an empty funding account.
const usableAccounts = (accounts: AccountState[]) =>
  accounts.filter((account) => !!account.accountId);

export const WalletSelectorContextProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<WalletSelectorModal | null>(null);
  const [accounts, setAccounts] = useState<Array<AccountState>>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const init = useCallback(async () => {
    console.log("Initialising wallet selector for network", NETWORK_ID);

    const _selector = await setupWalletSelector({
      network: {
        networkId: NETWORK_ID,
        nodeUrl: config.urls.rpc,
        ...SELECTOR_NETWORK_URLS[NETWORK_ID],
      },
      debug: true,
      modules: [
        setupLedger(),
        setupMyNearWallet({
          successUrl: `${window.location.origin}/welcome/setup`,
          failureUrl: `${window.location.origin}/welcome/setup`,
        }),
      ],
    });
    const _modal = setupModal(_selector, {
      contractId: CONTRACT_ID,
    });
    const state = _selector.store.getState();

    setAccounts(usableAccounts(state.accounts));
    setSelector(_selector);
    setModal(_modal);
    setLoading(false);
  }, [NETWORK_ID]);

  useEffect(() => {
    init().catch((err) => {
      console.error("wallet selector setup failed", (err as Error)?.name);
      alert("Failed to initialise wallet selector");
    });
  }, [init]);

  useEffect(() => {
    if (!selector) {
      return;
    }

    const subscription = selector.store.observable
      .pipe(
        map((state) => state.accounts),
        distinctUntilChanged(),
      )
      .subscribe((nextAccounts) => {
        const usable = usableAccounts(nextAccounts);
        console.log("Accounts Update", { count: usable.length });

        setAccounts(usable);
      });

    const onHideSubscription = modal!.on("onHide", ({ hideReason }) => {
      console.log(`The reason for hiding the modal ${hideReason}`);
    });

    return () => {
      subscription.unsubscribe();
      onHideSubscription.remove();
    };
  }, [selector, modal]);

  const walletSelectorContextValue = useMemo<WalletSelectorContextValue>(
    () => ({
      selector: selector!,
      modal: modal!,
      accounts,
      account: accounts.find((account) => account.active)!,
    }),
    [selector, modal, accounts],
  );

  if (loading) {
    return <div>Loading...</div>;
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
      "useWalletSelector must be used within a WalletSelectorContextProvider",
    );
  }

  return context;
}
