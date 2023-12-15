import { Header } from '../../general/Header/Header.jsx';
import { CloseButton } from '../../general/CloseButton/CloseButton.jsx';
import cn from './NoMultisigAccounts.module.css';

export const NoMultisigAccounts = () => {
  return (
    <>
      <Header>Account not Found</Header>
      <CloseButton />
      <div className={cn.content}>
        <p>No multisig accounts associated with this key..</p>
      </div>
    </>
  );
};
