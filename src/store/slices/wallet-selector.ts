import {
  type Action,
  type SignedTransaction,
  type Transaction,
  createTransaction,
} from "near-api-js/lib/transaction";
import { create } from "zustand";
import { config } from "~/config/config";
import {
  filterMultisig,
  getAccessKey,
  getAccountsForPublicKey,
  getLatestBlockHash,
} from "../helpers/utils";
import { KeyPair, PublicKey } from "near-api-js/lib/utils";
import { connect, keyStores, transactions, utils } from "near-api-js";
import { LedgerSigner } from "~/store-easy-peasy/slices/wallets/slices/ledger/helpers/LedgerSigner";
import { LedgerClient } from "~/store-easy-peasy/slices/wallets/slices/ledger/helpers/LedgerClient";
import { devtools, persist } from "zustand/middleware";
import { getActions } from "~/store-easy-peasy/slices/wallets/thunks/signAndSendTransaction/getActions";
import { JsonRpcProvider } from "near-api-js/lib/providers";
import { type StateCreator } from "zustand";
import { type NextRouter } from "next/router";
import {
  type NavActions,
  type NavState,
  createWalletNavigation,
} from "./navigation";
import { toast } from "react-toastify";

type PublicKeyStr = string;
type AccountId = string;
type Source = {
  type: "ledger" | "mynearwallet" | "privatekey";
  derivationPath?: string;
  privateKey?: string;
};

type PkAndAccounts = Record<PublicKeyStr, AccountId[]>;
type PkAndSources = Record<PublicKeyStr, Source>;

export interface WsState {
  keysToAccounts: PkAndAccounts;
  sources: PkAndSources;
  selectedPublicKey: PublicKeyStr;

  // unique nonce for each transaction, even before it reaches the chain
  uniqueNonce: number;
}

interface WsActions {
  getAndIncreaseUniqueNonce: () => number;
  addAccounts: (accounts: PkAndAccounts, sources: PkAndSources) => void;
  signWithLedger: (
    tx: Transaction,
    derivationPath: string,
  ) => Promise<SignedTransaction>;
  signWithMnw: (tx: Transaction) => void;
  createTx: (
    publicKey: PublicKeyStr,
    recvId: AccountId,
    senderId: AccountId,
    action: Action,
    actions: Action[],
  ) => Promise<Transaction>;
  connectWithLedger: (derivationPath?: string) => Promise<PublicKeyStr>;
  connectWithPrivateKey: (
    privateKey: string,
  ) => Promise<{ pubK: PublicKeyStr; accounts: string[] }>;
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
    action?: Action;
    actions: Action[];
  }) => Promise<void>;
  setSelectedPublicKey: (pk: PublicKeyStr) => void;
  canSignForAccount: (accountId: AccountId) => boolean;
  getPublicKeysForAccount: (accountId: AccountId) => PublicKeyStr[];
}

export const createWalletTerminator: StateCreator<
  WsState & WsActions & NavActions,
  [],
  [],
  WsState & WsActions
> = (set, get) => ({
  keysToAccounts: {},
  sources: {},
  selectedPublicKey: "",
  uniqueNonce: 0,
  getAndIncreaseUniqueNonce: () => {
    const nonce = get().uniqueNonce + 1;
    set({ uniqueNonce: nonce });
    return nonce;
  },
  getPublicKeysForAccount: (accountId: AccountId) => {
    const pkAndAccounts = get().keysToAccounts;
    const found = Object.keys(pkAndAccounts).filter((pk) =>
      pkAndAccounts[pk].includes(accountId),
    );
    return found;
  },
  addAccounts: (newAccounts: PkAndAccounts, newSources: PkAndSources) => {
    const accounts = get().keysToAccounts;
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

    set({ keysToAccounts: accounts, sources });

    console.log("addAccounts", {
      accounts: get().keysToAccounts,
      sources: get().sources,
    });
  },
  setSelectedPublicKey: (pk: PublicKeyStr) => {
    set({ selectedPublicKey: pk });
  },
  connectWithLedger: async (derivationPath?: string) => {
    let pkStr = "";
    const ledger = new LedgerClient();
    try {
      if (!ledger.isConnected()) {
        await ledger.connect();
      }
      get().goToLedgerSharePublicKey();
      const publicKey = await ledger.getPublicKey(derivationPath);

      pkStr = publicKey.toString();
    } catch (e) {
      console.error(e);
      get().goToLedgerDerivationPath((e as Error).message);
    } finally {
      if (ledger.isConnected()) {
        await ledger.disconnect();
      }
    }

    console.log("connectWithLedger", { pkStr });

    const accounts = await getAccountsForPublicKey(pkStr);

    console.log("connectWithLedger", { accounts });

    const filteredAccounts = await filterMultisig(accounts);

    console.log("connectWithLedger", { filteredAccounts });

    // Using plain objects instead of Map
    const newAccounts = { [pkStr]: filteredAccounts };
    const newSources: Record<PublicKeyStr, Source> = {
      [pkStr]: { type: "ledger", derivationPath: derivationPath },
    };

    get().addAccounts(newAccounts, newSources);

    get().goToLedgerSharePublicKeySuccess(pkStr);

    get().setSelectedPublicKey(pkStr);

    return pkStr;
  },
  connectWithPrivateKey: async (privateKey: string) => {
    const kp = KeyPair.fromString(privateKey);
    console.log("connectWithPrivateKey", { kp });
    const pubK = kp.getPublicKey().toString();
    const accounts = await getAccountsForPublicKey(pubK);
    const filteredAccounts = (await filterMultisig(accounts)).filter(Boolean);

    const newAccounts = { [pubK]: filteredAccounts };
    const newSources: Record<PublicKeyStr, Source> = {
      [pubK]: { type: "privatekey", privateKey: privateKey },
    };

    get().addAccounts(newAccounts, newSources);
    get().setSelectedPublicKey(pubK);
    console.log("HERE");

    return { pubK: pubK, accounts: filteredAccounts };
  },
  connectWithMyNearWallet: () => {
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
        [publicKey]: { type: "mynearwallet" },
      };

      get().addAccounts(newAccounts, newSources);

      get().setSelectedPublicKey(publicKey);

      console.log("handleMnwRedirect", {
        accounts: get().keysToAccounts,
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
    const accessKey = await getAccessKey({
      rpcUrl: rpc,
      senderId,
      signerPublicKey: PublicKey.from(publicKey),
    });
    const block = await getLatestBlockHash(rpc);
    const nonce = accessKey.nonce + get().getAndIncreaseUniqueNonce();
    const tx = createTransaction(
      senderId,
      PublicKey.from(publicKey),
      recvId,
      nonce,
      getActions(action, actions),
      utils.serialize.base_decode(block.header.hash),
    );
    return tx;
  },
  signAndSendTransaction: async (params) => {
    console.log("signAndSendTransaction", params);
    try {
      // find a pk that can be used to sign for the senderId
      get().canSignForAccount(params.senderId);

      let publicKeyForTxn = "";
      for (const pk in get().keysToAccounts) {
        if (get().keysToAccounts[pk].includes(params.senderId)) {
          publicKeyForTxn = pk;
        }
      }
      console.log(publicKeyForTxn);

      const tx = await get().createTx(
        publicKeyForTxn,
        params.receiverId,
        params.senderId,
        params.action,
        params.actions,
      );
      console.log("signAndSendTransaction", { tx });

      const source = get().sources[publicKeyForTxn];
      if (source.type === "ledger") {
        const signedTx = await get().signWithLedger(tx, source.derivationPath);
        const provider = new JsonRpcProvider({ url: config.urls.rpc });
        get().goToWaitForTransaction();
        const txn = await provider.sendTransaction(signedTx);
        get().goToWaitForTransaction(txn.transaction_outcome.id);
      } else if (source.type === "mynearwallet") {
        get().signWithMnw(tx);
      } else if (source.type === "privatekey") {
        get().goToWaitForTransaction();

        const network = config.networkId;
        const keyStore = new keyStores.InMemoryKeyStore();
        const keyPair = KeyPair.fromString(source.privateKey);
        await keyStore.setKey(network, params.senderId, keyPair);

        const nearconfig = {
          networkId: network,
          keyStore,
          nodeUrl: config.urls.rpc,
        };

        const near = await connect(nearconfig);
        const account = await near.account(params.senderId);

        const res = await account.signAndSendTransaction(tx);
        get().goToWaitForTransaction(res.transaction_outcome.id);
      } else {
        throw new Error("Unknown source type");
      }
    } catch (e) {
      get().goToFailedToSendTransaction((e as Error).message);
    }
  },
  signWithLedger: async (tx: Transaction, derivationPath: string) => {
    try {
      get().goToLedgerSignTransaction();
      const [, signedTransaction] = await transactions.signTransaction(
        tx,
        new LedgerSigner(derivationPath),
      );
      return signedTransaction;
    } catch (e) {
      get().goToLedgerSignTransaction((e as Error).message);
      throw e;
    }
  },
  signWithMnw: (tx: Transaction) => {
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
  canSignForAccount: (accountId: AccountId) => {
    const pkAndAccounts = get().keysToAccounts;

    const can = Object.keys(pkAndAccounts).some((pk) =>
      pkAndAccounts[pk].includes(accountId),
    );
    if (!can) {
      toast.error(
        `You need to connect ${accountId} before performing this action`,
      );
      throw new Error(
        `You need to connect ${accountId} before performing this action`,
      );
    }

    return can;
  },
});

export const useWalletTerminator = create<
  WsState & WsActions & NavState & NavActions
>()(
  devtools(
    persist(
      (...a) => ({
        ...createWalletTerminator(...a),
        ...createWalletNavigation(...a),
      }),
      { name: "wallet-terminator" },
    ),
  ),
);
