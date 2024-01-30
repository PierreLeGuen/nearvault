import * as nearAPI from "near-api-js";
import { initLockupContract } from "./lockup/contract";
import { Provider } from "near-api-js/lib/providers";
import { FungibleTokenMetadata } from "./ft/contract";
import {
  CodeResult,
  QueryResponseKind,
} from "near-api-js/lib/providers/provider";
import { providers } from "near-api-js";
import { config } from "~/config/config";

export async function getSelectedPool(
  accountId: string,
  contractId: string,
  near: nearAPI.Near,
) {
  const c = await initLockupContract(accountId, contractId, near);
  return await c.get_staking_pool_account_id();
}

const TTA_URL = "https://tta-api.onrender.com";

function getProvider() {
  return new providers.JsonRpcProvider({
    url: config.urls.rpc,
  });
}

export async function getTransactionsReport(
  startDate: Date,
  endDate: Date,
  accountIds: string[],
  includeBalances: boolean,
) {
  const start = startDate.toISOString();
  const end = endDate.toISOString();
  const commaSeparatedAccountIds = accountIds.join(",");

  const url =
    `${TTA_URL}/tta?start_date=${start}&end_date=${end}&accounts=${commaSeparatedAccountIds}` +
    `&include_balances=${includeBalances.toString()}`;

  const response = await fetch(url, {
    method: "GET",
  });

  if (response.ok) {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const contentDisposition = response.headers.get("Content-Disposition");
    let filename = "report.csv";
    if (contentDisposition) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(contentDisposition);
      if (matches != null && matches[1]) {
        filename = matches[1].replace(/['"]/g, "");
      }
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
}

export async function getFtBalanceAtDate(date: Date, accountId: string) {
  const blockId = await getLikelyBlockIdForDate(date);

  const balance = await getFtBalanceAtBlock(
    "usdt.tether-token.near",
    accountId,
    Number(blockId),
  );
  return balance;
}

export async function getFtBalanceAtBlock(
  contractId: string,
  accountId: string,
  blockId: number,
) {
  const balance = await viewCall<string>(
    contractId,
    "ft_balance_of",
    {
      account_id: accountId,
    },
    Number(blockId),
  );

  const ftMetadata = await viewCall<FungibleTokenMetadata>(
    contractId,
    "ft_metadata",
    {},
    blockId,
  );

  return {
    balance,
    ftMetadata,
  };
}

export async function getLikelyBlockIdForDate(date: Date) {
  const rfcDate = date.toISOString();

  const response = await (
    await fetch(TTA_URL + "/likelyBlockId?date=" + rfcDate)
  ).text();

  return response;
}

export function encodeArgs(args: Record<string, unknown>) {
  return Buffer.from(JSON.stringify(args)).toString("base64");
}

export async function viewCall<T>(
  contract: string,
  method: string,
  args: Record<string, unknown>,
  blockId?: number,
) {
  const provider = getProvider();

  const opt = {};
  if (blockId) {
    opt["block_id"] = blockId;
  } else {
    opt["finality"] = "final";
  }

  const result = await provider.query<CodeResult>({
    request_type: "call_function",
    account_id: contract,
    method_name: method,
    args_base64: encodeArgs(args),
    ...opt,
  });

  return JSON.parse(Buffer.from(result.result).toString()) as T;
}
