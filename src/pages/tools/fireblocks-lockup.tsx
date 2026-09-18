/**
 * Standalone, unauthenticated helper page for Fireblocks custody users who own
 * a NEAR lockup contract. Fireblocks cannot build the `transfer` function call
 * itself, but it does speak WalletConnect for NEAR. This page:
 *
 *   1. reads the lockup state from RPC and shows a pre-flight checklist,
 *   2. opens a WalletConnect session (QR code / URI) that the user approves in
 *      the Fireblocks mobile app or console,
 *   3. builds the FunctionCall transaction, asks Fireblocks to sign it via
 *      `near_signTransaction` (approved through their normal policy flow),
 *   4. broadcasts the signed transaction and links to the explorer.
 *
 * Share as: /tools/fireblocks-lockup?lockup=<id>.lockup.near&receiver=<acct>&amount=<NEAR>
 * The WalletConnect project id comes from NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
 * or the `wc` query parameter.
 */
import type SignClient from "@walletconnect/sign-client";
import type { SessionTypes } from "@walletconnect/types";
import BN from "bn.js";
import * as nearAPI from "near-api-js";
import {
  type AccessKeyList,
  type AccessKeyView,
  type CodeResult,
} from "near-api-js/lib/providers/provider";
import Head from "next/head";
import { useRouter } from "next/router";
import QRCode from "qrcode";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { config } from "~/config/config";
import { env } from "~/env.mjs";
import { type NextPageWithLayout } from "../_app";

type LockupAction =
  | "transfer"
  | "check_transfers_vote"
  | "unstake_all"
  | "withdraw_all_from_staking_pool";

const ACTIONS: Record<
  LockupAction,
  { label: string; description: string; gas: string }
> = {
  transfer: {
    label: "Transfer unlocked NEAR out of the lockup",
    description:
      "Calls `transfer` on the lockup, which sends unlocked NEAR to the receiver account.",
    gas: "100000000000000",
  },
  check_transfers_vote: {
    label: "Enable transfers on the lockup",
    description:
      "Calls `check_transfers_vote`. Only needed once, on lockups created before transfers were enabled on mainnet; it asks the vote contract and unlocks `transfer`.",
    gas: "125000000000000",
  },
  unstake_all: {
    label: "Unstake everything from the staking pool",
    description:
      "Calls `unstake_all`. Funds become withdrawable after 4 epochs (~2 days).",
    gas: "200000000000000",
  },
  withdraw_all_from_staking_pool: {
    label: "Withdraw unstaked NEAR back into the lockup",
    description:
      "Calls `withdraw_all_from_staking_pool`. Run this after unstaking has matured.",
    gas: "200000000000000",
  },
};

// Only what Fireblocks implements. near_signMessage / near_verifyOwner make
// Fireblocks reject the session, and near_signIn would add an access key to the
// custody account, which we do not want.
// NOTE: @walletconnect/sign-client is pinned to 2.19.x on purpose: from 2.21 the
// client silently moves requiredNamespaces into optionalNamespaces, and the
// Fireblocks NEAR integration was built against required namespaces.
const WC_METHODS = ["near_getAccounts", "near_signTransaction"];
const WC_EVENTS = ["chainChanged", "accountsChanged"];

interface LockupState {
  owner: string;
  transfersEnabled: boolean;
  stakingPool: string | null;
  terminated: boolean;
  liquid: string;
  locked: string;
  balance: string;
  deposited: string;
  /** Balances of the lockup inside its staking pool; null if no pool or unreadable. */
  pool: {
    staked: string;
    unstaked: string;
    unstakedAvailable: boolean;
  } | null;
}

interface WcAccount {
  accountId: string;
  publicKey: string;
}

const provider = new nearAPI.providers.JsonRpcProvider({
  url: config.urls.rpc,
});
const wcChainId = `near:${config.networkId}`;

async function viewFunction<T>(
  contractId: string,
  method: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  const res = await provider.query<CodeResult>({
    request_type: "call_function",
    finality: "final",
    account_id: contractId,
    method_name: method,
    args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
  });
  return JSON.parse(Buffer.from(res.result).toString()) as T;
}

async function loadLockup(lockupId: string): Promise<LockupState> {
  const [
    owner,
    transfersEnabled,
    stakingPool,
    termination,
    liquid,
    locked,
    balance,
    deposited,
  ] = await Promise.all([
    viewFunction<string>(lockupId, "get_owner_account_id"),
    viewFunction<boolean>(lockupId, "are_transfers_enabled"),
    viewFunction<string | null>(lockupId, "get_staking_pool_account_id"),
    viewFunction<unknown>(lockupId, "get_termination_status"),
    viewFunction<string>(lockupId, "get_liquid_owners_balance"),
    viewFunction<string>(lockupId, "get_locked_amount"),
    viewFunction<string>(lockupId, "get_balance"),
    viewFunction<string>(lockupId, "get_known_deposited_balance"),
  ]);
  let pool: LockupState["pool"] = null;
  if (stakingPool) {
    try {
      const args = { account_id: lockupId };
      const [staked, unstaked, unstakedAvailable] = await Promise.all([
        viewFunction<string>(stakingPool, "get_account_staked_balance", args),
        viewFunction<string>(stakingPool, "get_account_unstaked_balance", args),
        viewFunction<boolean>(
          stakingPool,
          "is_account_unstaked_balance_available",
          args,
        ),
      ]);
      pool = { staked, unstaked, unstakedAvailable };
    } catch {
      pool = null;
    }
  }
  return {
    owner,
    transfersEnabled,
    stakingPool,
    terminated: termination !== null,
    liquid,
    locked,
    balance,
    deposited,
    pool,
  };
}

// NEAR account id rules: 2..64 chars, lowercase alphanumerics separated by
// single `.`, `-` or `_`, never starting or ending a segment with a separator.
const ACCOUNT_ID_RE = /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/;
function isValidAccountId(id: string): boolean {
  return id.length >= 2 && id.length <= 64 && ACCOUNT_ID_RE.test(id);
}

/** Returns a description of the first failed status in a final outcome, or null. */
function findFailure(
  outcome: nearAPI.providers.FinalExecutionOutcome,
): string | null {
  const statuses: unknown[] = [
    outcome.status,
    ...outcome.receipts_outcome.map((r) => r.outcome.status),
  ];
  for (const st of statuses) {
    if (typeof st === "object" && st !== null && "Failure" in st) {
      return JSON.stringify((st as { Failure: unknown }).Failure);
    }
  }
  return null;
}

function maxTransferAmount(state: LockupState): string {
  return formatNear(state.liquid, 24).replace(/,/g, "");
}

/** Fireblocks returns the signed bytes as a Uint8Array, a plain array or an object of indices. */
function toBytes(result: unknown): Uint8Array {
  if (result instanceof Uint8Array) return result;
  if (Array.isArray(result)) return new Uint8Array(result as number[]);
  if (typeof result === "string") return Buffer.from(result, "base64");
  if (typeof result === "object" && result !== null) {
    // Node-style Buffer JSON: { type: "Buffer", data: [...] }
    const maybeBuffer = result as { type?: string; data?: number[] };
    if (maybeBuffer.type === "Buffer" && Array.isArray(maybeBuffer.data)) {
      return new Uint8Array(maybeBuffer.data);
    }
    return new Uint8Array(Object.values(result as Record<string, number>));
  }
  throw new Error("Unexpected result type from near_signTransaction");
}

function formatNear(yocto: string, digits = 4) {
  return nearAPI.utils.format.formatNearAmount(yocto, digits);
}

function firstString(v: string | string[] | undefined): string {
  return Array.isArray(v) ? v[0] ?? "" : v ?? "";
}

const FireblocksLockup: NextPageWithLayout = () => {
  const router = useRouter();

  const [lockupId, setLockupId] = useState("");
  const [action, setAction] = useState<LockupAction>("transfer");
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [projectId, setProjectId] = useState("");

  const [lockup, setLockup] = useState<LockupState | null>(null);
  const [lockupError, setLockupError] = useState<string | null>(null);
  const [lockupLoading, setLockupLoading] = useState(false);
  // Whether receiver / amount were filled in by us (from the lockup) rather
  // than by the user or the URL. Auto values are re-derived on lockup change.
  const receiverIsAuto = useRef(true);
  const amountIsAuto = useRef(true);

  // Shared init promise so concurrent callers (mount effect + button click,
  // React strict-mode double effects) never initialise WalletConnect twice.
  const clientRef = useRef<Promise<SignClient> | null>(null);
  const [session, setSession] = useState<SessionTypes.Struct | null>(null);
  const [account, setAccount] = useState<WcAccount | null>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pushLog = useCallback(
    (line: string) =>
      setLog((l) => [...l, `${new Date().toLocaleTimeString()}  ${line}`]),
    [],
  );

  // Seed form from the URL once the router is ready.
  useEffect(() => {
    if (!router.isReady) return;
    const q = router.query;
    setLockupId(firstString(q.lockup).trim());
    const urlReceiver = firstString(q.receiver).trim();
    const urlAmount = firstString(q.amount).trim();
    receiverIsAuto.current = !urlReceiver;
    amountIsAuto.current = !urlAmount;
    setReceiver(urlReceiver);
    setAmount(urlAmount);
    const a = firstString(q.action);
    if (a in ACTIONS) setAction(a as LockupAction);
    setProjectId(
      firstString(q.wc).trim() ||
        env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
        "",
    );
  }, [router.isReady, router.query]);

  // Load lockup state whenever the lockup id changes.
  useEffect(() => {
    // Invalidate everything derived from the previous lockup first so the
    // checklist and the sign button never describe a stale contract.
    setLockup(null);
    setLockupError(null);
    if (receiverIsAuto.current) setReceiver("");
    if (amountIsAuto.current) setAmount("");
    if (!lockupId) return;
    let cancelled = false;
    setLockupLoading(true);
    loadLockup(lockupId)
      .then((state) => {
        if (cancelled) return;
        setLockup(state);
        if (receiverIsAuto.current) setReceiver(state.owner);
        if (amountIsAuto.current) setAmount(maxTransferAmount(state));
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setLockup(null);
        setLockupError(
          `Could not read lockup "${lockupId}": ${e.message ?? String(e)}`,
        );
      })
      .finally(() => !cancelled && setLockupLoading(false));
    return () => {
      cancelled = true;
    };
  }, [lockupId]);

  const yoctoAmount = useMemo(() => {
    if (action !== "transfer") return null;
    try {
      return nearAPI.utils.format.parseNearAmount(amount || "0");
    } catch {
      return null;
    }
  }, [amount, action]);

  const checks = useMemo(() => {
    if (!lockup) return [];
    const list: Array<{ ok: boolean; text: string }> = [
      {
        ok: !lockup.terminated,
        text: lockup.terminated
          ? "Lockup is being terminated; transfers are blocked."
          : "Lockup is not terminated.",
      },
    ];
    const poolState = lockup.pool;
    if (action === "transfer") {
      list.push({
        ok: lockup.transfersEnabled,
        text: lockup.transfersEnabled
          ? "Transfers are enabled."
          : 'Transfers are not enabled on this lockup. Run the "Enable transfers" action first.',
      });
      const liquidOk =
        !!yoctoAmount &&
        new BN(yoctoAmount).gtn(0) &&
        new BN(yoctoAmount).lte(new BN(lockup.liquid));
      list.push({
        ok: liquidOk,
        text: `Amount ≤ liquid owner's balance (${formatNear(
          lockup.liquid,
        )} NEAR available).`,
      });
      list.push({
        ok: isValidAccountId(receiver),
        text: !receiver
          ? "Receiver account is required."
          : isValidAccountId(receiver)
          ? `Receiver: ${receiver}`
          : `"${receiver}" is not a valid NEAR account id.`,
      });
      // Informational only: the liquid balance already excludes anything in
      // the staking pool, so a staked remainder does not block a transfer.
      if (lockup.stakingPool && !new BN(lockup.deposited).isZero()) {
        list.push({
          ok: true,
          text: `${formatNear(
            lockup.deposited,
          )} NEAR is still in staking pool ${
            lockup.stakingPool
          } and is not part of the liquid balance. Use the unstake / withdraw actions to move it.`,
        });
      }
    } else if (action === "check_transfers_vote") {
      list.push({
        ok: !lockup.transfersEnabled,
        text: lockup.transfersEnabled
          ? "Transfers are already enabled; nothing to do."
          : "Transfers are disabled; this call will enable them.",
      });
    } else if (!lockup.stakingPool) {
      list.push({
        ok: false,
        text: "No staking pool selected; nothing to unstake or withdraw.",
      });
    } else if (!poolState) {
      list.push({
        ok: false,
        text: `Could not read balances from staking pool ${lockup.stakingPool}.`,
      });
    } else if (action === "unstake_all") {
      const staked = new BN(poolState.staked);
      list.push({
        ok: staked.gtn(0),
        text: staked.gtn(0)
          ? `${formatNear(poolState.staked)} NEAR staked in ${
              lockup.stakingPool
            }.`
          : `Nothing staked in ${lockup.stakingPool}.`,
      });
    } else {
      const unstaked = new BN(poolState.unstaked);
      list.push({
        ok: unstaked.gtn(0) && poolState.unstakedAvailable,
        text: unstaked.isZero()
          ? `Nothing unstaked in ${lockup.stakingPool}; run "Unstake" first.`
          : poolState.unstakedAvailable
          ? `${formatNear(
              poolState.unstaked,
            )} NEAR unstaked and ready to withdraw.`
          : `${formatNear(
              poolState.unstaked,
            )} NEAR unstaked but still locked by the pool (4 epochs). Try again later.`,
      });
    }
    if (account) {
      list.push({
        ok: account.accountId === lockup.owner,
        text:
          account.accountId === lockup.owner
            ? `Connected Fireblocks account ${account.accountId} owns this lockup.`
            : `Connected account ${account.accountId} is NOT the lockup owner (${lockup.owner}). Connect the right vault account.`,
      });
    }
    return list;
  }, [lockup, action, yoctoAmount, receiver, account]);

  const allChecksOk = checks.length > 0 && checks.every((c) => c.ok);

  // ---- WalletConnect -------------------------------------------------------

  const getClient = useCallback((): Promise<SignClient> => {
    if (clientRef.current !== null) return clientRef.current;
    if (!projectId) {
      return Promise.reject(
        new Error(
          "Missing WalletConnect project id. Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID or pass ?wc=<projectId>.",
        ),
      );
    }
    const init = (async () => {
      const mod = await import("@walletconnect/sign-client");
      const client = await mod.SignClient.init({
        projectId,
        metadata: {
          name: "NearVault – Fireblocks lockup helper",
          description:
            "Move NEAR out of a lockup contract owned by a Fireblocks vault",
          url: window.location.origin,
          icons: [`${window.location.origin}/logo.png`],
        },
      });
      client.on("session_delete", () => {
        setSession(null);
        setAccount(null);
        pushLog("Fireblocks disconnected the session.");
      });
      return client;
    })();
    clientRef.current = init;
    init.catch(() => {
      clientRef.current = null;
    });
    return init;
  }, [projectId, pushLog]);

  const fetchAccounts = useCallback(
    async (client: SignClient, s: SessionTypes.Struct): Promise<WcAccount> => {
      try {
        const accounts = await client.request<WcAccount[]>({
          topic: s.topic,
          chainId: wcChainId,
          request: { method: "near_getAccounts", params: {} },
        });
        const first = accounts[0];
        if (!first) throw new Error("near_getAccounts returned no accounts");
        return first;
      } catch (e) {
        // Fall back to the session namespace + the account's single full-access key.
        pushLog(
          `near_getAccounts failed (${String(e)}); using session accounts.`,
        );
        const nsAccount = s.namespaces.near?.accounts[0];
        if (!nsAccount) throw new Error("Session has no NEAR account");
        const accountId = nsAccount.split(":")[2] ?? "";
        const keys = await provider.query<AccessKeyList>({
          request_type: "view_access_key_list",
          finality: "final",
          account_id: accountId,
        });
        const full = keys.keys.filter(
          (k) => (k.access_key.permission as unknown) === "FullAccess",
        );
        const only = full[0];
        if (full.length !== 1 || !only) {
          throw new Error(
            `Cannot determine signing key for ${accountId}: ${full.length} full-access keys`,
          );
        }
        return { accountId, publicKey: only.public_key };
      }
    },
    [pushLog],
  );

  // Reuse an existing session if the client already has one.
  useEffect(() => {
    if (!projectId || session) return;
    let cancelled = false;
    getClient()
      .then(async (client) => {
        const existing = client.session
          .getAll()
          .filter(
            (s) =>
              s.namespaces.near?.chains?.includes(wcChainId) ||
              s.namespaces.near?.accounts.some((a) => a.startsWith(wcChainId)),
          )
          .pop();
        if (!existing || cancelled) return;
        setSession(existing);
        pushLog(
          `Restored WalletConnect session with ${existing.peer.metadata.name}.`,
        );
        setAccount(await fetchAccounts(client, existing));
      })
      .catch((e: Error) => pushLog(`WalletConnect init: ${e.message}`));
    return () => {
      cancelled = true;
    };
  }, [projectId, session, getClient, fetchAccounts, pushLog]);

  const connect = async () => {
    setError(null);
    setBusy("Waiting for Fireblocks to approve the connection…");
    try {
      const client = await getClient();
      const { uri: newUri, approval } = await client.connect({
        requiredNamespaces: {
          near: { chains: [wcChainId], methods: WC_METHODS, events: WC_EVENTS },
        },
      });
      if (!newUri)
        throw new Error("WalletConnect did not return a pairing URI");
      setUri(newUri);
      setQr(await QRCode.toDataURL(newUri, { width: 320, margin: 1 }));
      pushLog(
        "Pairing URI created. Scan it with the Fireblocks app or paste it in the console.",
      );
      const s = await approval();
      setSession(s);
      setUri(null);
      setQr(null);
      pushLog(`Connected to ${s.peer.metadata.name}.`);
      setAccount(await fetchAccounts(client, s));
    } catch (e) {
      setError((e as Error).message ?? String(e));
      setUri(null);
      setQr(null);
    } finally {
      setBusy(null);
    }
  };

  const disconnect = async () => {
    const client = clientRef.current !== null ? await clientRef.current : null;
    if (client && session) {
      await client
        .disconnect({
          topic: session.topic,
          reason: { code: 6000, message: "User disconnected" },
        })
        .catch(() => undefined);
    }
    setSession(null);
    setAccount(null);
    pushLog("Disconnected.");
  };

  const signAndSend = async () => {
    if (!lockup || !account || !session) return;
    setError(null);
    setTxHash(null);
    try {
      const client = await getClient();
      const args: Record<string, unknown> =
        action === "transfer"
          ? { amount: yoctoAmount, receiver_id: receiver }
          : {};

      setBusy("Building transaction…");
      const [block, accessKey] = await Promise.all([
        provider.block({ finality: "final" }),
        provider.query<AccessKeyView>({
          request_type: "view_access_key",
          finality: "final",
          account_id: account.accountId,
          public_key: account.publicKey,
        }),
      ]);
      const tx = nearAPI.transactions.createTransaction(
        account.accountId,
        nearAPI.utils.PublicKey.from(account.publicKey),
        lockupId,
        // The RPC returns a plain number even though the type says BN.
        new BN(String(accessKey.nonce)).addn(1),
        [
          nearAPI.transactions.functionCall(
            action,
            args,
            new BN(ACTIONS[action].gas),
            new BN(0),
          ),
        ],
        nearAPI.utils.serialize.base_decode(block.header.hash),
      );

      setBusy("Waiting for approval in Fireblocks…");
      pushLog(`Sent ${action} on ${lockupId} to Fireblocks for signing.`);
      const result = await client.request<unknown>({
        topic: session.topic,
        chainId: wcChainId,
        request: {
          method: "near_signTransaction",
          params: { transaction: tx.encode() },
        },
      });
      const signed = nearAPI.transactions.SignedTransaction.decode(
        Buffer.from(toBytes(result)),
      ) as nearAPI.transactions.SignedTransaction;

      setBusy("Broadcasting to NEAR…");
      pushLog("Signature received, broadcasting.");
      const outcome = await provider.sendTransaction(signed);
      const hash = (outcome.transaction as { hash: string }).hash;
      // sendTransaction resolves even when the contract call failed on chain.
      const failure = findFailure(outcome);
      if (failure) {
        throw new Error(`Transaction ${hash} failed on chain: ${failure}`);
      }
      setTxHash(hash);
      pushLog(`Done: ${hash}`);
      // refresh balances
      setLockup(await loadLockup(lockupId));
    } catch (e) {
      const msg = (e as Error).message ?? String(e);
      setError(msg);
      pushLog(`Error: ${msg}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <Head>
        <title>Fireblocks × NEAR lockup</title>
      </Head>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold">
            Move NEAR out of a lockup with Fireblocks
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This page prepares the lockup transaction that the Fireblocks UI
            cannot build, and hands it to Fireblocks over WalletConnect. You
            approve the connection and the transaction in Fireblocks exactly
            like any other transaction. Nothing is signed or stored here.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>1. Lockup</CardTitle>
            <CardDescription>
              The lockup contract and what you want to do with it.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Lockup account
              <Input
                value={lockupId}
                onChange={(e) => setLockupId(e.target.value.trim())}
                placeholder="xxxxxxxx.lockup.near"
                disabled={!!busy}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Action
              <select
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                value={action}
                onChange={(e) => setAction(e.target.value as LockupAction)}
                disabled={!!busy}
              >
                {Object.entries(ACTIONS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
              <span className="text-xs text-muted-foreground">
                {ACTIONS[action].description}
              </span>
            </label>
            {action === "transfer" && (
              <>
                <label className="flex flex-col gap-1 text-sm">
                  Receiver account (where the NEAR goes)
                  <Input
                    value={receiver}
                    onChange={(e) => {
                      receiverIsAuto.current = false;
                      setReceiver(e.target.value.trim());
                    }}
                    placeholder={lockup?.owner ?? "your-main-wallet.near"}
                    disabled={!!busy}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Amount (NEAR)
                  <div className="flex gap-2">
                    <Input
                      value={amount}
                      onChange={(e) => {
                        amountIsAuto.current = false;
                        setAmount(e.target.value.trim());
                      }}
                      placeholder="0"
                      disabled={!!busy}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!lockup || !!busy}
                      onClick={() => {
                        if (!lockup) return;
                        amountIsAuto.current = true;
                        setAmount(maxTransferAmount(lockup));
                      }}
                    >
                      Max
                    </Button>
                  </div>
                </label>
              </>
            )}

            {lockupLoading && <p className="text-sm">Reading lockup…</p>}
            {lockupError && (
              <p className="text-sm text-destructive">{lockupError}</p>
            )}
            {lockup && (
              <div className="rounded-md border p-3 text-sm">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <span className="text-muted-foreground">Owner</span>
                  <span className="break-all font-mono">{lockup.owner}</span>
                  <span className="text-muted-foreground">Total balance</span>
                  <span>{formatNear(lockup.balance)} NEAR</span>
                  <span className="text-muted-foreground">Still locked</span>
                  <span>{formatNear(lockup.locked)} NEAR</span>
                  <span className="text-muted-foreground">
                    Liquid (transferable now)
                  </span>
                  <span className="font-semibold">
                    {formatNear(lockup.liquid)} NEAR
                  </span>
                  <span className="text-muted-foreground">Staking pool</span>
                  <span className="break-all">
                    {lockup.stakingPool ?? "none"}
                  </span>
                </div>
                <ul className="mt-3 flex flex-col gap-1">
                  {checks.map((c, i) => (
                    <li
                      key={i}
                      className={c.ok ? "text-green-700" : "text-destructive"}
                    >
                      {c.ok ? "✓" : "✗"} {c.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Connect Fireblocks</CardTitle>
            <CardDescription>
              In the Fireblocks mobile app, open the WalletConnect scanner and
              scan the code, or paste the URI in the console&apos;s Web3
              connections page. Pick the vault account that owns the lockup,
              then approve the connection.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {!session && !qr && (
              <Button onClick={connect} disabled={!!busy || !lockup}>
                {busy ?? "Show WalletConnect QR code"}
              </Button>
            )}
            {qr && uri && (
              <div className="flex flex-col items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qr}
                  alt="WalletConnect QR code"
                  width={320}
                  height={320}
                />
                <p className="text-sm text-muted-foreground">{busy}</p>
                <div className="flex w-full gap-2">
                  <Input readOnly value={uri} className="font-mono text-xs" />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void navigator.clipboard.writeText(uri)}
                  >
                    Copy URI
                  </Button>
                </div>
              </div>
            )}
            {session && (
              <div className="flex flex-col gap-2 text-sm">
                <p>
                  Connected to <b>{session.peer.metadata.name}</b>
                  {account && (
                    <>
                      {" "}
                      as{" "}
                      <span className="break-all font-mono">
                        {account.accountId}
                      </span>
                    </>
                  )}
                </p>
                <Button
                  variant="outline"
                  onClick={disconnect}
                  disabled={!!busy}
                >
                  Disconnect
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Sign in Fireblocks</CardTitle>
            <CardDescription>
              Fireblocks will show a contract call from{" "}
              <span className="font-mono">
                {account?.accountId ?? "your account"}
              </span>{" "}
              to <span className="font-mono">{lockupId || "the lockup"}</span>,
              method <span className="font-mono">{action}</span>
              {action === "transfer" && yoctoAmount
                ? `, moving ${formatNear(yoctoAmount)} NEAR to ${
                    receiver || "the receiver"
                  }`
                : ""}
              . Approve it through your normal policy flow.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button
              onClick={signAndSend}
              disabled={
                !session ||
                !account ||
                !lockup ||
                lockupLoading ||
                !allChecksOk ||
                !!busy
              }
            >
              {busy ?? "Send to Fireblocks for signing"}
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {txHash && (
              <p className="text-sm text-green-700">
                Transaction sent:{" "}
                <a
                  className="underline"
                  href={config.urls.nearBlocksApiUI.txDetails(txHash)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {txHash}
                </a>
              </p>
            )}
            {log.length > 0 && (
              <pre className="max-h-48 overflow-auto rounded-md border bg-muted p-2 text-xs">
                {log.join("\n")}
              </pre>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
};

export default FireblocksLockup;
