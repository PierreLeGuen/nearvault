import { WalletItem } from '../WalletItem/WalletItem.jsx';
import icon from '../../../../../../public/ledger-icon.png';
import { useStoreActions } from 'easy-peasy';

export const Ledger = () => {
  const navigate = useStoreActions((state) => state.walletsConnector.modal.navigate);
  const onClick = () => navigate('/ledger/connect');
  return <WalletItem icon={icon} label="Ledger" onClick={onClick} />;
};
