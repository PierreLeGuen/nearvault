import bs58 from "bs58";
import { sha256 } from "js-sha256";
import { providers } from "near-api-js";
import { type CodeResult } from "near-api-js/lib/providers/provider";
import { type ViewAccountQuery } from "~/lib/lockup/types";
import { type MultiSigAction } from "./contract";

export const VULNERABLE_MULTISIG_HASH =
  "55E7imniT2uuYrECn17qJAk9fLcwQW4ftNSwmCJL5Di";

export const NEW_MULTISIG_HASH =
  "63AVHGvscPnyhXxW6dmC9Vmofx2QWiFKRLb2tojS95Pw";

export const MULTISIG_WASM_URL = "/wasm/multisig.wasm";

export type UpgradeEligibility = "eligible" | "already-upgraded" | "ineligible";

export function classifyWalletHash(codeHash: string): UpgradeEligibility {
  if (codeHash === VULNERABLE_MULTISIG_HASH) return "eligible";
  if (codeHash === NEW_MULTISIG_HASH) return "already-upgraded";
  return "ineligible";
}

export function computeCodeHash(wasmBytes: Uint8Array): string {
  return bs58.encode(Buffer.from(sha256.array(wasmBytes)));
}

function toBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + chunk) as unknown as number[],
    );
  }
  return typeof btoa === "function"
    ? btoa(bin)
    : Buffer.from(bin, "binary").toString("base64");
}

export async function fetchMultisigWasmBase64(): Promise<{
  base64: string;
  byteLength: number;
  codeHash: string;
}> {
  const res = await fetch(MULTISIG_WASM_URL);
  if (!res.ok) {
    throw new Error(`Failed to load ${MULTISIG_WASM_URL}: ${res.status}`);
  }
  const buf = new Uint8Array(await res.arrayBuffer());
  const codeHash = computeCodeHash(buf);
  if (codeHash !== NEW_MULTISIG_HASH) {
    throw new Error(
      `WASM integrity check failed: expected code hash ${NEW_MULTISIG_HASH}, got ${codeHash}`,
    );
  }
  return { base64: toBase64(buf), byteLength: buf.length, codeHash };
}

export async function getAccountCodeHash(
  accountId: string,
  rpcUrl: string,
): Promise<string | null> {
  const provider = new providers.JsonRpcProvider({ url: rpcUrl });
  try {
    const result = await provider.query<ViewAccountQuery>({
      request_type: "view_account",
      finality: "optimistic",
      account_id: accountId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    return result.code_hash;
  } catch (e) {
    const msg = (e as Error).message || "";
    if (
      msg.includes("does not exist") ||
      msg.includes("doesn't exist") ||
      msg.includes("UnknownAccount")
    ) {
      return null;
    }
    throw e;
  }
}

type MultisigRequestRaw = {
  receiver_id: string;
  actions: Array<{ type: string; code?: string; [k: string]: unknown }>;
};

export async function checkExistingUpgradeProposals(
  accountId: string,
  rpcUrl: string,
  options?: { strict?: boolean },
): Promise<{ id: number; isVerifiedUpgrade: boolean }[]> {
  const strict = options?.strict ?? false;
  const provider = new providers.JsonRpcProvider({ url: rpcUrl });

  let requestIds: number[];
  try {
    const result = await provider.query<CodeResult>({
      request_type: "call_function",
      finality: "optimistic",
      account_id: accountId,
      method_name: "list_request_ids",
      args_base64: Buffer.from(JSON.stringify({})).toString("base64"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    requestIds = JSON.parse(
      Buffer.from(result.result).toString(),
    ) as number[];
  } catch (e) {
    if (strict) {
      throw new Error(
        `Cannot verify duplicate proposals for ${accountId}: ${(e as Error).message}`,
      );
    }
    return [];
  }

  const proposals: { id: number; isVerifiedUpgrade: boolean }[] = [];
  let fetchFailures = 0;

  await Promise.all(
    requestIds.map(async (id) => {
      try {
        const result = await provider.query<CodeResult>({
          request_type: "call_function",
          finality: "optimistic",
          account_id: accountId,
          method_name: "get_request",
          args_base64: Buffer.from(
            JSON.stringify({ request_id: id }),
          ).toString("base64"),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
        const req = JSON.parse(
          Buffer.from(result.result).toString(),
        ) as MultisigRequestRaw;

        if (req.receiver_id !== accountId) return;

        const deploy = req.actions.find(
          (a) => a.type === "DeployContract" && typeof a.code === "string",
        );
        if (!deploy || !deploy.code) return;

        let isVerifiedUpgrade = false;
        try {
          const decoded = Buffer.from(deploy.code, "base64");
          const hash = computeCodeHash(new Uint8Array(decoded));
          isVerifiedUpgrade = hash === NEW_MULTISIG_HASH;
        } catch {
          // malformed base64 -- treat as unverified
        }

        proposals.push({ id, isVerifiedUpgrade });
      } catch {
        fetchFailures++;
      }
    }),
  );

  if (strict && fetchFailures > 0) {
    throw new Error(
      `Cannot verify duplicate proposals for ${accountId}: failed to fetch ${fetchFailures} of ${requestIds.length} pending requests.`,
    );
  }

  return proposals;
}

export type DeploySummary =
  | { ok: true; byteLength: number; codeHash: string; preview: string }
  | { ok: false; error: string };

export function summarizeDeployAction(
  action: MultiSigAction & { code?: string },
): DeploySummary {
  const code = action.code;
  if (!code || typeof code !== "string") {
    return { ok: false, error: "No code field" };
  }
  try {
    const decoded = Buffer.from(code, "base64");
    const codeHash = computeCodeHash(new Uint8Array(decoded));
    const preview = code.substring(0, 20) + "...";
    return { ok: true, byteLength: decoded.length, codeHash, preview };
  } catch (e) {
    return { ok: false, error: (e as Error).message || "Invalid base64" };
  }
}
