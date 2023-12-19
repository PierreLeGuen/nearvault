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
