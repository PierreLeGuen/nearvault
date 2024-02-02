import {
  Action,
  SignedTransaction,
  Transaction,
  createTransaction,
} from "near-api-js/lib/transaction";
import { create } from "zustand";
import { config } from "~/config/config";
import {
  filterMultisig,
  getAccessKey,
  getAccountsForPublicKey,
} from "../helpers/utils";
import { PublicKey } from "near-api-js/lib/utils";
import { transactions, utils } from "near-api-js";
import { LedgerSigner } from "~/store-easy-peasy/slices/wallets/slices/ledger/helpers/LedgerSigner";
import { LedgerClient } from "~/store-easy-peasy/slices/wallets/slices/ledger/helpers/LedgerClient";
import { devtools, persist } from "zustand/middleware";
import { getActions } from "~/store-easy-peasy/slices/wallets/thunks/signAndSendTransaction/getActions";
import { JsonRpcProvider } from "near-api-js/lib/providers";
import { type StateCreator } from "zustand";
import { NextRouter, Router } from "next/router";

type PublicKeyStr = string;
type AccountId = string;
type Source = "ledger" | "mynearwallet";

type PkAndAccounts = Record<PublicKeyStr, AccountId[]>;
type PkAndSources = Record<PublicKeyStr, Source>;

interface State {
  accounts: PkAndAccounts;
  sources: PkAndSources;
  selectedPublicKey: PublicKeyStr;
}

interface Actions {
  addAccounts: (accounts: PkAndAccounts, sources: PkAndSources) => void;
  signWithLedger: (tx: Transaction) => Promise<SignedTransaction>;
  signWithMnw: (tx: Transaction) => void;
  createTx: (
    publicKey: PublicKeyStr,
    recvId: AccountId,
    senderId: AccountId,
    action: Action,
    actions: Action[],
  ) => Promise<Transaction>;
  connectWithLedger: (derivationPath?: string) => Promise<PublicKeyStr>;
  connectWithMyNearWallet: () => void;
  handleMnwRedirect: (router: NextRouter) => Promise<void>;
  signAndSendTransaction: ({
    senderId,
    receiverId,
    action,
    actions,
  }: {
    senderId: AccountId;
    receiverId: AccountId;
    action: Action;
    actions: Action[];
  }) => Promise<void>;
  setSelectedPublicKey: (pk: PublicKeyStr) => void;
}

export const createWalletTerminator: StateCreator<State & Actions> = (
  set,
  get,
) => ({
  accounts: {},
  sources: {},
  selectedPublicKey: "",
  addAccounts: (newAccounts: PkAndAccounts, newSources: PkAndSources) => {
    const accounts = get().accounts;
    console.log("addAccounts", {
      currentAccounts: accounts,
      newAccounts,
    });

    Object.keys(newAccounts).forEach((key) => {
      accounts[key] = accounts[key] || [];
      console.log("addAccounts", {
        key,
        currentAccounts: accounts[key],
        newAccounts: newAccounts[key],
      });

      //filter out null and  remove duplicate
      accounts[key] = Array.from(
        new Set([...accounts[key], ...newAccounts[key]]),
      ).filter((a) => Boolean(a));
    });

    console.log(accounts);

    const sources = get().sources;

    Object.keys(newSources).forEach((key) => {
      if (!newSources[key]) {
        return;
      }
      sources[key] = newSources[key];
    });

    set({ accounts, sources });

    console.log("addAccounts", {
      accounts: get().accounts,
      sources: get().sources,
    });
  },
  setSelectedPublicKey: (pk: PublicKeyStr) => {
    set({ selectedPublicKey: pk });
  },
  connectWithLedger: async (derivationPath?: string) => {
    const ledger = new LedgerClient();
    if (!ledger.isConnected()) {
      await ledger.connect();
    }

    const publicKey = await ledger.getPublicKey(derivationPath);
    if (ledger.isConnected()) {
      await ledger.disconnect();
    }

    const pkStr = publicKey.toString();

    console.log("connectWithLedger", { pkStr });

    const accounts = await getAccountsForPublicKey(pkStr);

    console.log("connectWithLedger", { accounts });

    const filteredAccounts = await filterMultisig(accounts);

    console.log("connectWithLedger", { filteredAccounts });

    // Using plain objects instead of Map
    const newAccounts = { [pkStr]: filteredAccounts };
    const newSources: Record<PublicKeyStr, Source> = { [pkStr]: "ledger" };

    get().addAccounts(newAccounts, newSources);

    get().setSelectedPublicKey(pkStr);

    return pkStr;
  },
  connectWithMyNearWallet: async () => {
    const loginUrl = new URL(config.urls.myNearWallet + "/login");
    loginUrl.searchParams.set(
      "success_url",
      `${window.location.origin}/wallet-redirects/my-near-wallet?connectStatus=Allowed&returnTo=${window.location.pathname}`,
    );
    loginUrl.searchParams.set(
      "failure_url",
      `${window.location.origin}/wallet-redirects/my-near-wallet?connectStatus=Rejected&returnTo=${window.location.pathname}`,
    );
    window.location.assign(loginUrl);
  },
  handleMnwRedirect: async (router: NextRouter) => {
    const currentUrl = new URL(window.location.href);
    const searchParams = currentUrl.searchParams;

    const connectStatus = searchParams.get("connectStatus");
    const returnTo = searchParams.get("returnTo");

    if (connectStatus === "Allowed") {
      const publicKey = searchParams.get("all_keys").split(",")[0];
      if (!publicKey) {
        throw new Error("No public key found in the URL");
      }

      const accountId =
        searchParams.get("accountId") || searchParams.get("account_id");
      if (!accountId) {
        throw new Error("No account ID found in the URL");
      }

      const newAccounts = { [publicKey]: [accountId] };
      const newSources: Record<PublicKeyStr, Source> = {
        [publicKey]: "mynearwallet",
      };

      get().addAccounts(newAccounts, newSources);

      get().setSelectedPublicKey(publicKey);

      console.log("handleMnwRedirect", {
        accounts: get().accounts,
        sources: get().sources,
      });

      await router.replace(returnTo);
      return;
    }
    throw new Error("not supported yet");
  },
  createTx: async (
    publicKey: PublicKeyStr,
    recvId: AccountId,
    senderId: AccountId,
    action: Action,
    actions: Action[],
  ) => {
    const rpc = config.urls.rpc;
    const accessKey: any = await getAccessKey({
      rpcUrl: rpc,
      senderId,
      publicKey: PublicKey.from(publicKey),
    });
    const nonce = accessKey.nonce + 1_000;
    const blockHash = utils.serialize.base_decode(accessKey.block_hash);
    const tx = createTransaction(
      senderId,
      PublicKey.from(publicKey),
      recvId,
      nonce,
      getActions(action, actions),
      blockHash,
    );
    return tx;
  },
  signAndSendTransaction: async (params) => {
    const selectedPk = get().selectedPublicKey;
    const tx = await get().createTx(
      selectedPk,
      params.receiverId,
      params.senderId,
      params.action,
      params.actions,
    );
    const source = get().sources[selectedPk];
    if (source === "ledger") {
      const signedTx = await get().signWithLedger(tx);
      const provider = new JsonRpcProvider({ url: config.urls.rpc });
      await provider.sendJsonRpc("broadcast_tx_commit", [
        Buffer.from(signedTx.encode()).toString("base64"),
      ]);
    } else if (source === "mynearwallet") {
      get().signWithMnw(tx);
    }
  },
  signWithLedger: async (tx: Transaction) => {
    const [_, signedTransaction] = await transactions.signTransaction(
      tx,
      new LedgerSigner(),
    );

    return signedTransaction;
  },
  signWithMnw: async (tx: Transaction) => {
    const signUrl = new URL(config.urls.myNearWallet + "/sign");

    const encodedTx = tx.encode();
    signUrl.searchParams.set(
      "transactions",
      Buffer.from(encodedTx).toString("base64"),
    );

    const callbackUrl = `${window.location.origin}/wallet-redirects/my-near-wallet?returnTo=${window.location.pathname}`;
    signUrl.searchParams.set("callbackUrl", callbackUrl);

    window.location.assign(signUrl);
  },
});

export const useWalletTerminator = create<State & Actions>()(
  devtools(persist(createWalletTerminator, { name: "wallet-terminator" })),
);
