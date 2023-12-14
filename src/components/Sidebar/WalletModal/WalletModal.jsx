import { useStoreState, useStoreActions } from 'easy-peasy';
import { useEffect } from 'react';
import { Wallets } from './Wallets/Wallets.jsx';
import { Connect } from './Ledger/Connect/Connect.jsx';
import { SpecifyPath } from './Ledger/SpecifyPath/SpecifyPath.jsx';
import { ConnectionProgress } from './Ledger/ConnectionProgress/ConnectionProgress.jsx';
import { ConnectError } from './Ledger/ConnectError/ConnectError.jsx';
import { FindMultisigAccountsProgress } from './Ledger/FindMultisigAccountsProgress/FindMultisigAccountsProgress.jsx';
import { NoMultisigAccounts } from './Ledger/NoMultisigAccounts/NoMultisigAccounts.jsx';
import { ImportedAccounts } from './Ledger/ImportedAccounts/ImportedAccounts.jsx';
import { SignTxProgress } from './Ledger/SignTxProgress/SignTxProgress.jsx';
import { SignTxError } from './Ledger/SignTxError/SignTxError.jsx';
import cn from './WalletModal.module.css';

export const WalletModal = () => {
  const isOpen = useStoreState((state) => state.wallets.modal.isOpen);
  const route = useStoreState((state) => state.wallets.modal.route);
  const routeParams = useStoreState((state) => state.wallets.modal.routeParams);
  const close = useStoreActions((actions) => actions.wallets.modal.close);
  const navigate = useStoreActions((state) => state.wallets.modal.navigate);

  // After close the modal, navigate to start page - we want to start from the beginning
  // every time we open the modal
  useEffect(() => {
    if (!isOpen && route !== '/wallets') navigate('/wallets');
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={cn.container}>
      <div className={cn.modal} onClick={(e) => e.stopPropagation()}>
        {route === '/wallets' && <Wallets />}
        {route === '/ledger/connect' && <Connect />}
        {route === '/ledger/connect/specify-path' && <SpecifyPath />}
        {route === '/ledger/connect/progress' && <ConnectionProgress />}
        {route === '/ledger/connect/error' && <ConnectError routeParams={routeParams} />}
        {route === '/ledger/multisig-accounts/progress' && <FindMultisigAccountsProgress />}
        {route === '/ledger/multisig-accounts/success' && (
          <ImportedAccounts routeParams={routeParams} closeModal={close} />
        )}
        {route === '/ledger/multisig-accounts/error' && (
          <NoMultisigAccounts routeParams={routeParams} />
        )}
        {route === '/ledger/sign/progress' && <SignTxProgress />}
        {route === '/ledger/sign/error' && <SignTxError routeParams={routeParams}/>}
      </div>
    </div>
  );
};
