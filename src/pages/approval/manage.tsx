import { type Wallet } from "@near-finance-near-wallet-selector/core";
import { useEffect, useState } from "react";
import { getSidebarLayout } from "~/components/Layout";
import { useWalletSelector } from "~/context/wallet";
import { api } from "~/lib/api";
import { assertCorrectMultisigWallet } from "~/lib/utils";
import usePersistingStore from "~/store/useStore";
import { type NextPageWithLayout } from "../_app";
import { handleWalletRequestWithToast } from "../payments/transfers";

const FOUNDATION_MULTISIG_HASH = "55E7imniT2uuYrECn17qJAk9fLcwQW4ftNSwmCJL5Di";

const ManageApprovalWallets: NextPageWithLayout = () => {
  const [perWalletKeys, setPerWalletKeys] = useState<Map<string, Set<string>>>(
    new Map()
  );
  const [newKeys, setNewKeys] = useState<Map<string, string>>(new Map());

  const { currentTeam, newNearConnection } = usePersistingStore();
  const { data: wallets } = api.teams.getWalletsForTeam.useQuery({
    teamId: currentTeam?.id || "",
  });
  const walletSelector = useWalletSelector();

  useEffect(() => {
    const getKeysForWallets = async () => {
      const n = await newNearConnection();
      const keysMap = new Map<string, Set<string>>();

      const promises = (wallets || []).map(async (wallet) => {
        const acc = await n.account(wallet.walletAddress);
        const keys = await acc.getAccessKeys();
        keysMap.set(
          wallet.walletAddress,
          new Set(keys.map((k) => k.public_key))
        );
      });

      await Promise.all(promises);

      setPerWalletKeys(keysMap);
    };

    void getKeysForWallets();
  }, [wallets, newNearConnection]);

  const handleInputChange = (walletId: string, newValue: string) => {
    setNewKeys((prevKeys) => new Map(prevKeys.set(walletId, newValue)));
    console.log(newKeys);
  };

  const addRequestRemoveKey = async (multisigWallet: string, key: string) => {
    await assertCorrectMultisigWallet(walletSelector, multisigWallet);
    const w = await walletSelector.selector.wallet();
    const n = await newNearConnection();
    console.log("multisigWallet", multisigWallet);
    const acc = await n.account(multisigWallet);
    const state = await acc.state();
    console.log(state.code_hash);
    console.log(key);

    // Foundation multisig wallets have different methods for adding/removing keys
    if (state.code_hash === FOUNDATION_MULTISIG_HASH) {
      await addRequestToMultisigWallet(w, multisigWallet, multisigWallet, [
        {
          type: "DeleteKey",
          public_key: key,
          gas: "125000000000000",
          deposit: "0",
        },
      ]);
    } else {
      await addRequestToMultisigWallet(w, multisigWallet, multisigWallet, [
        {
          type: "DeleteMember",
          member: {
            public_key: key,
          },
          gas: "125000000000000",
          deposit: "0",
        },
      ]);
    }
  };

  const addRequestAddKey = async (multisigWallet: string, key: string) => {
    await assertCorrectMultisigWallet(walletSelector, multisigWallet);
    const w = await walletSelector.selector.wallet();
    await addRequestToMultisigWallet(w, multisigWallet, multisigWallet, [
      {
        type: "AddKey",
        public_key: key,
        permission: {
          allowance: null,
          receiver_id: multisigWallet,
          method_names: [
            "add_request",
            "add_request_and_confirm",
            "confirm",
            "delete_request",
          ],
        },
        gas: "125000000000000",
        deposit: "0",
      },
    ]);
  };

  return (
    <div className="prose">
      <h1>Manage wallets</h1>
      <p>
        Manage your multisig wallets keys, create request to add and delete keys
      </p>
      <h3>Wallets list</h3>
      <div className="flex flex-col">
        {wallets?.map((wallet) => (
          <div key={wallet.id}>
            <h4>{wallet.walletAddress}</h4>
            <div className="flex flex-col gap-3">
              {Array.from(perWalletKeys.get(wallet.walletAddress) || []).map(
                (key, i) => (
                  <div
                    key={i}
                    className="flex flex-row items-center justify-between gap-3"
                  >
                    <div>{key}</div>
                    <button
                      className="rounded bg-red-200 px-2 py-1 hover:bg-red-300"
                      onClick={() => {
                        void addRequestRemoveKey(wallet.walletAddress, key);
                      }}
                    >
                      Delete key
                    </button>
                  </div>
                )
              )}
            </div>
            <div className="flex flex-row items-center gap-3">
              Add key:{" "}
              <input
                type="text"
                value={newKeys.get(wallet.walletAddress) || ""}
                onChange={(e) =>
                  handleInputChange(wallet.walletAddress, e.target.value)
                }
              />
              <button
                className="rounded bg-blue-200 px-2 py-1 hover:bg-blue-300"
                onClick={() => {
                  void addRequestAddKey(
                    wallet.walletAddress,
                    newKeys.get(wallet.walletAddress) || ""
                  );
                }}
              >
                Add key
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const addRequestToMultisigWallet = async (
  w: Wallet,
  multisigWallet: string,
  receiverWallet: string,
  actions: any[]
) => {
  await handleWalletRequestWithToast(
    w.signAndSendTransaction({
      receiverId: multisigWallet,
      actions: [
        {
          type: "FunctionCall",
          params: {
            gas: "300000000000000",
            deposit: "0",
            methodName: "add_request",
            args: {
              request: {
                receiver_id: receiverWallet,
                actions: actions,
              },
            },
          },
        },
      ],
    })
  );
};

ManageApprovalWallets.getLayout = getSidebarLayout;
export default ManageApprovalWallets;
