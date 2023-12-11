import { WalletItem } from '../WalletItem/WalletItem.jsx';
import icon from './my-near-wallet-icon.png';
import { useStoreActions } from 'easy-peasy';

export const MyNearWallet = () => {
  const requestConnect = useStoreActions((state) => state.wallets.myNearWallet.requestConnect);
  return <WalletItem icon={icon} label="MyNearWallet" onClick={requestConnect} />;
};
