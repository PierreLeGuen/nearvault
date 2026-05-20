import ContentCentered from "~/components/ContentCentered";
import { getSidebarLayout } from "~/components/Layout";
import HeaderTitle from "~/components/ui/header";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import {
  useWalletsUpgradeStatus,
  useUpgradeContract,
  type WalletUpgradeInfo,
} from "~/hooks/upgrade";
import {
  VULNERABLE_MULTISIG_HASHES,
  NEW_MULTISIG_HASH,
} from "~/lib/multisig/upgrade";
import Link from "next/link";
import { type NextPageWithLayout } from "../_app";

const Upgrade: NextPageWithLayout = () => {
  const walletsQuery = useWalletsUpgradeStatus();
  const upgradeMutation = useUpgradeContract();

  if (walletsQuery.isLoading) {
    return (
      <ContentCentered>
        <HeaderTitle level="h1" text="Upgrade contract" />
        <p>Loading wallets...</p>
      </ContentCentered>
    );
  }

  if (!walletsQuery.data || walletsQuery.data.length === 0) {
    return (
      <ContentCentered>
        <HeaderTitle level="h1" text="Upgrade contract" />
        <p>No wallets found for this team.</p>
      </ContentCentered>
    );
  }

  return (
    <ContentCentered>
      <HeaderTitle level="h1" text="Upgrade contract" />

      <Card className="border-amber-500/50 bg-amber-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Security Advisory</CardTitle>
          <CardDescription>
            A security vulnerability was found in NEAR multisig v1 contracts.
            Wallets running an affected contract version should be upgraded as
            soon as possible. Eligible contract hashes:
            {Array.from(VULNERABLE_MULTISIG_HASHES).map((hash) => (
              <code
                key={hash}
                className="mt-1 block rounded bg-slate-200 px-1 py-0.5 text-xs dark:bg-slate-700"
              >
                {hash}
              </code>
            ))}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="flex flex-col gap-4">
        {walletsQuery.data.map((info) => (
          <WalletUpgradeCard
            key={info.wallet.walletAddress}
            info={info}
            upgradeMutation={upgradeMutation}
            onRetry={() => void walletsQuery.refetch()}
          />
        ))}
      </div>
    </ContentCentered>
  );
};

function WalletUpgradeCard({
  info,
  upgradeMutation,
  onRetry,
}: {
  info: WalletUpgradeInfo;
  upgradeMutation: ReturnType<typeof useUpgradeContract>;
  onRetry: () => void;
}) {
  const { wallet, eligibility, existingProposals, canSign, codeHash, error } =
    info;

  const isSubmitting =
    upgradeMutation.isLoading &&
    upgradeMutation.variables?.walletAddress === wallet.walletAddress;
  const mutationSucceeded =
    upgradeMutation.isSuccess &&
    upgradeMutation.variables?.walletAddress === wallet.walletAddress;
  const mutationErrorMsg =
    upgradeMutation.isError &&
    upgradeMutation.variables?.walletAddress === wallet.walletAddress
      ? (upgradeMutation.error as Error)?.message ||
        "Failed to submit the proposal"
      : null;

  const verifiedProposals = existingProposals.filter(
    (p) => p.isVerifiedUpgrade,
  );
  const unverifiedProposals = existingProposals.filter(
    (p) => !p.isVerifiedUpgrade,
  );

  const handleUpgrade = () => {
    upgradeMutation.mutate({ walletAddress: wallet.walletAddress });
  };

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="break-all font-mono text-sm">
              {wallet.walletAddress}
            </CardTitle>
            <Badge className="bg-red-500/15 text-red-700 border-red-500/20 whitespace-nowrap">
              Error
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-red-600">{error}</p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (eligibility === "already-upgraded") {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="break-all font-mono text-sm">
              {wallet.walletAddress}
            </CardTitle>
            <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/20 whitespace-nowrap">
              Upgraded
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Running the latest patched version.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (eligibility === "ineligible") {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="break-all font-mono text-sm">
              {wallet.walletAddress}
            </CardTitle>
            <Badge className="bg-slate-500/15 text-slate-600 border-slate-500/20 whitespace-nowrap">
              Not eligible
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Contract hash does not match the vulnerable version.
            {codeHash && (
              <>
                {" "}
                Current hash:{" "}
                <code className="text-xs">{codeHash}</code>
              </>
            )}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Eligible wallet
  return (
    <Card className="border-amber-500/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="break-all font-mono text-sm">
            {wallet.walletAddress}
          </CardTitle>
          {unverifiedProposals.length > 0 ? (
            <Badge className="bg-orange-500/15 text-orange-700 border-orange-500/20 whitespace-nowrap">
              Deploy pending
            </Badge>
          ) : verifiedProposals.length > 0 ? (
            <Badge className="bg-blue-500/15 text-blue-700 border-blue-500/20 whitespace-nowrap">
              Proposal pending
            </Badge>
          ) : (
            <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/20 whitespace-nowrap">
              Needs upgrade
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Current hash</span>
            <code className="text-xs">{codeHash}</code>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Target hash</span>
            <code className="text-xs">{NEW_MULTISIG_HASH}</code>
          </div>
        </div>

        {unverifiedProposals.length > 0 && (
          <Alert variant="destructive">
            <AlertDescription>
              A deploy-contract proposal exists (request id:{" "}
              {unverifiedProposals.map((p) => p.id).join(", ")}) but its code
              hash does not match the expected upgrade. Review it carefully
              before approving.
            </AlertDescription>
          </Alert>
        )}

        {verifiedProposals.length > 0 && (
          <Alert>
            <AlertDescription>
              A verified upgrade proposal already exists (request id:{" "}
              {verifiedProposals.map((p) => p.id).join(", ")}). Approve it
              via{" "}
              <Link href="/approval/pending" className="underline">
                Pending Requests
              </Link>
              .
            </AlertDescription>
          </Alert>
        )}

        {existingProposals.length === 0 && (
          <>
            <Alert>
              <AlertDescription>
                <strong>Using a Ledger?</strong> After you approve the
                transaction header, the device may appear frozen for up to ~10
                minutes. This is expected — the transaction carries the full
                new WASM (~346 KB) which the device has to hash. Raise the
                auto-lock timeout in the Ledger&apos;s on-device settings to
                more than 10 minutes, or periodically press any button to keep
                it awake.
              </AlertDescription>
            </Alert>

            <p className="text-sm text-muted-foreground">
              Submitting will create a multisig request with a single{" "}
              <code className="text-xs">DeployContract</code> action. The new
              code only takes effect once enough multisig members confirm the
              request.
            </p>

            {canSign ? (
              <Button
                className="w-full"
                onClick={handleUpgrade}
                disabled={isSubmitting || mutationSucceeded}
              >
                {isSubmitting
                  ? "Submitting..."
                  : mutationSucceeded
                    ? "Proposal submitted"
                    : "Create upgrade proposal"}
              </Button>
            ) : (
              <Button className="w-full" disabled>
                Connect a signer for this wallet to create the proposal
              </Button>
            )}

            {mutationErrorMsg && (
              <Alert variant="destructive">
                <AlertDescription>{mutationErrorMsg}</AlertDescription>
              </Alert>
            )}

            {mutationSucceeded && (
              <Alert>
                <AlertDescription>
                  Proposal submitted. Check the transaction status in the wallet
                  dialog, then approve it via{" "}
                  <Link href="/approval/pending" className="underline">
                    Pending Requests
                  </Link>
                  .
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

Upgrade.getLayout = getSidebarLayout;

export default Upgrade;
