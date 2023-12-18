import { useStoreState, useStoreActions } from "easy-peasy";
import { useEffect } from "react";
import { Wallets } from "./Wallets/Wallets.jsx";
import { Connect } from "./Ledger/Connect/Connect.jsx";
import { SpecifyPath } from "./Ledger/SpecifyPath/SpecifyPath.jsx";
import { ConnectionProgress } from "./Ledger/ConnectionProgress/ConnectionProgress.jsx";
import { ConnectError } from "./Ledger/ConnectError/ConnectError.jsx";
import { FindMultisigAccountsProgress } from "~/components/Sidebar/WalletModal/MultisigAccounts/FindMultisigAccountsProgress/FindMultisigAccountsProgress.jsx";
import { NoMultisigAccounts } from "~/components/Sidebar/WalletModal/MultisigAccounts/NoMultisigAccounts/NoMultisigAccounts.jsx";
import { ImportedAccounts } from "~/components/Sidebar/WalletModal/MultisigAccounts/ImportedAccounts/ImportedAccounts.jsx";
import { SignTxProgress } from "./Ledger/SignTxProgress/SignTxProgress.jsx";
import { SignTxError } from "./Ledger/SignTxError/SignTxError.jsx";
import { SendTxProgress } from "~/components/Sidebar/WalletModal/Transaction/SendTxProgress/SendTxProgress";
import { SendTxSuccess } from "~/components/Sidebar/WalletModal/Transaction/SendTxSuccess/SendTxSuccess";
import { SendTxError } from "~/components/Sidebar/WalletModal/Transaction/SendTxError/SendTxError";
import cn from "./WalletModal.module.css";

export const WalletModal = () => {
  const isOpen = useStoreState((state) => state.wallets.modal.isOpen);
  const route = useStoreState((state) => state.wallets.modal.route);
  const routeParams = useStoreState((state) => state.wallets.modal.routeParams);
  const close = useStoreActions((actions) => actions.wallets.modal.close);
  const navigate = useStoreActions((state) => state.wallets.modal.navigate);

  // After close the modal, navigate to start page - we want to start from the beginning
  // every time we open the modal
  useEffect(() => {
    if (!isOpen && route !== "/wallets") navigate("/wallets");
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={cn.container}>
      <div className={cn.modal} onClick={(e) => e.stopPropagation()}>
        {route === "/wallets" && <Wallets />}
        {route === "/ledger/connect" && <Connect />}
        {route === "/ledger/connect/specify-path" && <SpecifyPath />}
        {route === "/ledger/connect/progress" && <ConnectionProgress />}
        {route === "/ledger/connect/error" && (
          <ConnectError routeParams={routeParams} />
        )}
        {route === "/multisig-accounts/progress" && (
          <FindMultisigAccountsProgress />
        )}
        {route === "/multisig-accounts/success" && (
          <ImportedAccounts routeParams={routeParams} closeModal={close} />
        )}
        {route === "/multisig-accounts/no-accounts" && (
          <NoMultisigAccounts />
        )}
        {route === "/multisig-accounts/error" && (
          <NoMultisigAccounts routeParams={routeParams} /> // TODO Create New component
        )}
        {route === "/ledger/sign/progress" && <SignTxProgress />}
        {route === "/ledger/sign/error" && (
          <SignTxError routeParams={routeParams} />
        )}
        {route === "/tx/send/progress" && (
          <SendTxProgress routeParams={routeParams} />
        )}
        {route === "/tx/send/success" && (
          <SendTxSuccess routeParams={routeParams} closeModal={close} />
        )}
        {route === "/tx/send/error" && (
          <SendTxError routeParams={routeParams} closeModal={close} />
        )}
      </div>
    </div>
  );
};
