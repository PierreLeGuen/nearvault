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
import { devtools } from "zustand/middleware";
import { getActions } from "~/store-easy-peasy/slices/wallets/thunks/signAndSendTransaction/getActions";
import { JsonRpcProvider } from "near-api-js/lib/providers";
import { type StateCreator } from "zustand";

type PublicKeyStr = string;
type AccountId = string;
type Source = "ledger" | "mynearwallet";

type PkAndAccounts = Map<PublicKeyStr, AccountId[]>;
type PkAndSources = Map<PublicKeyStr, Source>;

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

export const walletTerminator: StateCreator<State & Actions> = (set, get) => ({
  accounts: new Map(),
  sources: new Map(),
  selectedPublicKey: "",
  addAccounts: (newAccounts: PkAndAccounts, newSources: PkAndSources) => {
    const currentAccounts = get().accounts;
    const mergedAccounts = new Map([...currentAccounts, ...newAccounts]);

    // filter out values that are undefined in array
    const filteredAccounts = new Map(
      [...mergedAccounts].map(([k, v]) => [k, v.filter(Boolean)]),
    );

    const currentSources = get().sources;
    const mergedSources = new Map([...currentSources, ...newSources]);

    set({ accounts: filteredAccounts, sources: mergedSources });

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

    get().addAccounts(
      new Map([[pkStr, filteredAccounts]]),
      new Map([[pkStr, "ledger"]]),
    );

    get().setSelectedPublicKey(pkStr);

    return pkStr;
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
    const source = get().sources.get(selectedPk);
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
    console.error("signWithMnw not implemented");
  },
});

export const useWalletTerminator = create<State & Actions>(walletTerminator);
