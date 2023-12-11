import { MyNearWallet } from './MyNearWallet/MyNearWallet.jsx';
import { Ledger } from './Ledger/Ledger.jsx';
import { Header } from '../general/Header/Header.jsx';
import { CloseButton } from '../general/CloseButton/CloseButton.jsx';
import cn from './Wallets.module.css';

export const Wallets = () => {
  return (
    <>
      <Header>Connect Your Wallet</Header>
      <CloseButton />
      <div className={cn.content}>
        <MyNearWallet />
        <Ledger />
      </div>
    </>
  );
};
