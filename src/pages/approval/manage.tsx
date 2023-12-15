import { type Wallet } from "@near-finance-near-wallet-selector/core";
import { useEffect, useState } from "react";
import { getSidebarLayout } from "~/components/Layout";
import { AddKeyDialog } from "~/components/dialogs/add-key";
import { Button } from "~/components/ui/button";
import HeaderTitle from "~/components/ui/header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { useWalletSelector } from "~/context/wallet";
import { api } from "~/lib/api";
import { assertCorrectMultisigWallet } from "~/lib/utils";
import usePersistingStore from "~/store/useStore";
import { type NextPageWithLayout } from "../_app";
import { handleWalletRequestWithToast } from "../payments/lib/toastReq";

const FOUNDATION_MULTISIG_HASH = "55E7imniT2uuYrECn17qJAk9fLcwQW4ftNSwmCJL5Di";

const ManageApprovalWallets: NextPageWithLayout = () => {
  const [perWalletKeys, setPerWalletKeys] = useState<Map<string, Set<string>>>(
    new Map(),
  );

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
          new Set(keys.map((k) => k.public_key)),
        );
      });

      await Promise.all(promises);

      setPerWalletKeys(keysMap);
    };

    void getKeysForWallets();
  }, [wallets, newNearConnection]);

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

  return (
    <div className="flex flex-grow flex-col gap-10 px-36 py-10">
      <HeaderTitle level="h1" text="Manage team" />

      {wallets?.map((wallet) => (
        <>
          <div className="flex flex-row justify-between">
            <HeaderTitle level="h3" text={wallet.walletAddress} />
            <AddKeyDialog walletId={wallet.walletAddress} />
          </div>
          <div className="rounded-md border shadow-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Public key</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from(perWalletKeys.get(wallet.walletAddress) || []).map(
                  (key, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <p className="break-all">{key}</p>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          onClick={() => {
                            void addRequestRemoveKey(wallet.walletAddress, key);
                          }}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          </div>
        </>
      ))}
    </div>
  );
};

export const addRequestToMultisigWallet = async (
  w: Wallet,
  multisigWallet: string,
  receiverWallet: string,
  actions: any[],
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
    }),
  );
};

ManageApprovalWallets.getLayout = getSidebarLayout;
export default ManageApprovalWallets;
