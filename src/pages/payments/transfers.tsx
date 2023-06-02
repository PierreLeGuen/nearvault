import { Beneficiary, Wallet } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getSidebarLayout } from "~/components/Layout";
import BeneficiariesDropDown from "~/components/Payments/BeneficiariesDropDown";
import CurrenciesDropDown from "~/components/Payments/CurrenciesDropDown";
import WalletsDropDown from "~/components/Staking/WalletsDropDown";
import { api } from "~/lib/api";
import {
  FungibleTokenMetadata,
  initFungibleTokenContract,
} from "~/lib/ft/contract";
import { calculateLockup } from "~/lib/lockup/lockup";
import usePersistingStore from "~/store/useStore";
import { type NextPageWithLayout } from "../_app";

export interface WalletPretty {
  prettyName: string;
  walletDetails: Wallet;
}

interface LikelyTokens {
  version: string;
  lastBlockTimestamp: string;
  list: string[];
}

export interface Token extends FungibleTokenMetadata {
  balance: string;
  account_id: string;
}

const Transfers: NextPageWithLayout = () => {
  const [teamsWallet, setTeamsWallet] = useState<WalletPretty[]>([]);

  const [fromWallet, setFromWallet] = useState<WalletPretty>();
  const [toBenef, setToBenef] = useState<Beneficiary>();

  const [tokens, setTokens] = useState<Token[]>([]);
  const [currentToken, setCurrentToken] = useState<Token>();

  const [amount, setAmount] = useState<string>("");
  const [memo, setMemo] = useState<string>("");

  const { currentTeam, newNearConnection } = usePersistingStore();

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
          w.push({ walletDetails: wallet, prettyName: wallet.walletAddress });
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
            });
          } catch (_) {}
        }
        setTeamsWallet(w);
        setFromWallet(w[0]);
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
      if (!fromWallet) {
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
        if (!fromWallet) {
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
              account_id: fromWallet.walletDetails.walletAddress,
            };

            return t;
          } catch (e) {
            console.log(e);
          }
        });

        const t = await Promise.all(tokensPromises);
        const w = t.filter((x) => x !== undefined) as Token[];
        setTokens(w);
        setCurrentToken(undefined);
      },
    }
  );

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
      <div>
        <div>From Wallet: DROPDOWN</div>
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
        <div>Enter amount</div>
        <div>
          <input type="text" placeholder="Enter amount" />
        </div>
        <button
          onClick={() => {
            console.log("TODO");
          }}
        >
          Create treansfer request
        </button>
      </div>
    </>
  );
};

Transfers.getLayout = getSidebarLayout;

export default Transfers;