import { FinalExecutionOutcome } from "@near-finance-near-wallet-selector/core";
import { type Beneficiary } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { parseNearAmount } from "near-api-js/lib/utils/format";
import { useState } from "react";
import { toast } from "react-toastify";
import { getSidebarLayout } from "~/components/Layout";
import BeneficiariesDropDown from "~/components/Payments/BeneficiariesDropDown";
import CurrenciesDropDown from "~/components/Payments/CurrenciesDropDown";
import WalletsDropDown from "~/components/Staking/WalletsDropDown";
import { useWalletSelector } from "~/context/wallet";
import { api } from "~/lib/api";
import {
  initFungibleTokenContract,
  type FungibleTokenMetadata,
} from "~/lib/ft/contract";
import { calculateLockup } from "~/lib/lockup/lockup";
import { assertCorrectMultisigWallet } from "~/lib/utils";
import usePersistingStore from "~/store/useStore";
import { type NextPageWithLayout } from "../_app";
import { type WalletPretty } from "../staking/stake";

interface LikelyTokens {
  version: string;
  lastBlockTimestamp: string;
  list: string[];
}

export interface Token extends FungibleTokenMetadata {
  balance: string;
  account_id: string;
}

export const handleWalletRequestWithToast = async (
  p: Promise<FinalExecutionOutcome | void>
) => {
  const res = await toast.promise(p, {
    pending: "Check your wallet to approve the request",
    success: {
      render: (data) => {
        if (!data.data) {
          return `Successfully sent request to the multisig wallet`;
        }
        return (
          <span>
            Successfully sent request to the multisig wallet, transaction id:{" "}
            <a
              href={`https://nearblocks.io/txns/${data.data.transaction_outcome.id}`}
              target="_blank"
              className="font-bold underline"
            >
              {data.data.transaction_outcome.id}
            </a>
            `
          </span>
        );
      },
    },
    error: {
      render: (err) => {
        return `Failed to send transaction: ${(err.data as Error).message}`;
      },
    },
  });

  return res;
};

const Transfers: NextPageWithLayout = () => {
  const walletSelector = useWalletSelector();

  const [teamsWallet, setTeamsWallet] = useState<WalletPretty[]>([]);
  const [fromWallet, setFromWallet] = useState<WalletPretty>({
    prettyName: "",
    walletDetails: { walletAddress: "", id: "", teamId: "" },
    isLockup: false,
    ownerAccountId: undefined,
  });
  const [toBenef, setToBenef] = useState<Beneficiary>();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [currentToken, setCurrentToken] = useState<Token>();
  const [amount, setAmount] = useState<string>("");
  const [memo, setMemo] = useState<string>("");

  const { currentTeam, newNearConnection } = usePersistingStore();
  const mutate = api.teams.insertTransferHistory.useMutation();

  const { isLoading } = api.teams.getWalletsForTeam.useQuery(
    {
      teamId: currentTeam?.id || "",
    },
    {
      enabled: true,
      async onSuccess(data) {
        if (!data || data.length == 0 || data[0] === undefined) {
          throw new Error("No wallets found");
        }
        const w: WalletPretty[] = [];
        for (const wallet of data) {
          w.push({
            walletDetails: wallet,
            prettyName: wallet.walletAddress,
            isLockup: false,
            ownerAccountId: undefined,
          });
          try {
            const lockupValue = calculateLockup(
              wallet.walletAddress,
              "lockup.near"
            );
            const nearConn = await newNearConnection();
            await (await nearConn.account(lockupValue)).state();

            w.push({
              prettyName: "Lockup of " + wallet.walletAddress,
              walletDetails: {
                walletAddress: lockupValue,
                id: lockupValue,
                teamId: "na",
              },
              isLockup: true,
              ownerAccountId: wallet.walletAddress,
            });
          } catch (_) {}
        }
        setTeamsWallet(w);
      },
    }
  );

  const { data: beneficiaries, isLoading: isLoadingBenef } =
    api.teams.getBeneficiariesForTeam.useQuery({
      teamId: currentTeam?.id || "",
    });

  const { isLoading: isLoadingTokens } = useQuery(
    ["tokens", fromWallet],
    async () => {
      if (!fromWallet || fromWallet.walletDetails.walletAddress === "") {
        console.log("No from wallet yet");
        return {};
      }
      console.log("Fetching likely tokens");

      const res = fetch(
        `https://api.kitwallet.app/account/${fromWallet.walletDetails.walletAddress}/likelyTokensFromBlock?fromBlockTimestamp=0`
      );
      const data = (await res).json() as Promise<LikelyTokens>;
      return data;
    },
    {
      async onSuccess(data: LikelyTokens) {
        if (!fromWallet || fromWallet.walletDetails.walletAddress === "") {
          console.log("No from wallet yet");
          return;
        }
        console.log(data);

        const tokensPromises = data.list.map(async (token) => {
          console.log("Fetching token", token);

          const n = await newNearConnection();

          const c = initFungibleTokenContract(await n.account(""), token);
          try {
            const ft_metadata = await c.ft_metadata();
            const ft_balance = await c.ft_balance_of({
              account_id: fromWallet.walletDetails.walletAddress,
            });

            const t: Token = {
              ...ft_metadata,
              balance: ft_balance,
              account_id: token,
            };

            return t;
          } catch (e) {
            console.log(e);
          }
        });

        const t = await Promise.all(tokensPromises);
        const w = t.filter((x) => x !== undefined) as Token[];

        const acc = await (
          await newNearConnection()
        ).account(fromWallet.walletDetails.walletAddress);
        const balance = await acc.getAccountBalance();
        const near = {
          symbol: "NEAR",
          name: "NEAR",
          balance: balance.available,
          decimals: 24,
        } as Token;

        setTokens([near].concat(w));
        setCurrentToken(undefined);
      },
    }
  );

  const insertTransactionInHistory = async (createRequestTxnId: string) => {
    if (!currentTeam) {
      throw new Error("No current team");
    }

    await mutate.mutateAsync({
      amount: amount,
      teamId: currentTeam.id,
      tokenAddress: currentToken?.account_id || "NEAR",
      createRequestTxnId: createRequestTxnId,
      memo: memo,
      walletId: fromWallet.walletDetails.id,
    });
  };

  const createTransferRequest = async () => {
    if (!fromWallet || !toBenef || !currentToken || !amount) {
      console.log("Missing data: ", fromWallet, toBenef, currentToken, amount);
      return;
    }

    let fromAddress = fromWallet.walletDetails.walletAddress;

    if (fromWallet.isLockup) {
      if (!fromWallet.ownerAccountId) {
        throw new Error("No owner account id");
      }
      fromAddress = fromWallet.ownerAccountId;
    }
    try {
      await assertCorrectMultisigWallet(walletSelector, fromAddress);
    } catch (e) {
      toast.error((e as Error).message);
      return;
    }

    const w = await walletSelector.selector.wallet();

    let txnId: string | undefined = undefined;
    if (currentToken.symbol === "NEAR") {
      const nAmount = parseNearAmount(amount);
      let action: any = {
        type: "Transfer",
        amount: nAmount,
      };
      if (fromWallet.isLockup && fromWallet.ownerAccountId) {
        action = {
          type: "FunctionCall",
          method_name: "transfer",
          args: btoa(
            JSON.stringify({
              receiver_id: toBenef.walletAddress,
              amount: nAmount,
            })
          ),
          gas: "250000000000000",
          deposit: "0",
        };
      }
      const res = await handleWalletRequestWithToast(
        w.signAndSendTransaction({
          receiverId: fromAddress,
          actions: [
            {
              type: "FunctionCall",
              params: {
                gas: "300000000000000",
                deposit: "0",
                methodName: "add_request",
                args: {
                  request: {
                    receiver_id: fromWallet.isLockup
                      ? fromWallet.walletDetails.walletAddress
                      : toBenef.walletAddress,
                    actions: [action],
                  },
                },
              },
            },
          ],
        })
      );
      txnId = res?.transaction_outcome.id;
    } else {
      const a = amount + "0".repeat(currentToken.decimals);
      const ftArgs = { amount: a, receiver_id: toBenef.walletAddress };

      const res = await handleWalletRequestWithToast(
        w.signAndSendTransaction({
          receiverId: fromAddress,
          actions: [
            {
              type: "FunctionCall",
              params: {
                gas: "300000000000000",
                deposit: "0",
                methodName: "add_request",
                args: {
                  request: {
                    receiver_id: currentToken.account_id,
                    actions: [
                      {
                        type: "FunctionCall",
                        method_name: "ft_transfer",
                        args: btoa(JSON.stringify(ftArgs)),
                        deposit: "1",
                        gas: "200000000000000",
                      },
                    ],
                  },
                },
              },
            },
          ],
        })
      );
      txnId = res?.transaction_outcome.id;
    }

    if (!txnId) {
      throw new Error("No txnId");
    }

    await insertTransactionInHistory(txnId);
  };

  if (
    isLoading ||
    !teamsWallet ||
    isLoadingBenef ||
    isLoadingTokens ||
    !tokens
  ) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="prose flex flex-col pl-3 pt-3">
        <h1>Create transfer request</h1>
        <div className="inline-flex gap-3">
          <div className="flex flex-col gap-1">
            <div>From Wallet:</div>
            <WalletsDropDown
              wallets={teamsWallet}
              selectedWallet={fromWallet}
              setSelectedWallet={setFromWallet}
            />
            <div>To Wallet: Beneficiaries</div>
            <BeneficiariesDropDown
              beneficiaries={beneficiaries}
              selectedBeneficiary={toBenef}
              setSelectedBeneficiary={setToBenef}
            />
            <div>Select token</div>
            <div>
              <CurrenciesDropDown
                tokens={tokens}
                currentToken={currentToken}
                setCurrentToken={setCurrentToken}
              />
            </div>
            <div>
              Available balance:{" "}
              {currentToken
                ? (
                    Number(currentToken.balance) /
                    Math.pow(10, currentToken.decimals)
                  ).toFixed(2)
                : "0"}
            </div>
            <div>Enter amount</div>
            <div>
              <input
                type="text"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div>Transfer reason</div>
            <div>
              <input
                type="text"
                placeholder="Enter memo"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
              />
            </div>
            <button
              onClick={() => {
                createTransferRequest().catch((e) => console.error(e));
              }}
              className="rounded bg-blue-200 px-2 py-1 hover:bg-blue-300"
            >
              Create treansfer request
            </button>
          </div>

          <div>
            {fromWallet && fromWallet.prettyName != "" && (
              <div>Balances of {fromWallet.prettyName}</div>
            )}
            <div>
              {tokens.map((t) => (
                <div key={t.symbol}>
                  {t.symbol}:{" "}
                  {(Number(t.balance) / Math.pow(10, t.decimals)).toFixed(2)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

Transfers.getLayout = getSidebarLayout;

export default Transfers;
