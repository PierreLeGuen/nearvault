import * as nearAPI from "near-api-js";
import { initLockupContract } from "./lockup/contract";

export async function getSelectedPool(
  accountId: string,
  contractId: string,
  near: nearAPI.Near,
) {
  const c = await initLockupContract(accountId, contractId, near);
  return await c.get_staking_pool_account_id();
}

const TTA_URL = "https://tta-api.onrender.com";

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
