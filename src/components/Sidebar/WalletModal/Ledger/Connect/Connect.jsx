import { Button } from '@mui/material';
import { useStoreActions } from 'easy-peasy';
import { LedgerDeviceIcon } from '../../general/icons/LedgerDeviceIcon.tsx';
import { BackButton } from '../../general/BackButton/BackButton.jsx';
import { Header } from '../../general/Header/Header.jsx';
import { CloseButton } from '../../general/CloseButton/CloseButton.jsx';
import cn from './Connect.module.css';

export const Connect = () => {
  const connect = useStoreActions((state) => state.wallets.ledger.connect);
  const navigate = useStoreActions((state) => state.walletsConnector.modal.navigate);

  const specifyPath = () => {
    navigate('/ledger/connect/specify-path');
  };

  return (
    <>
      <BackButton to="/wallets"/>
      <Header>Connect Ledger</Header>
      <CloseButton />
      <div className={cn.content}>
        <LedgerDeviceIcon className={cn.icon}/>
        <p className={cn.title}>
          Make sure your Ledger is connected securely via USB, and that the NEAR app is open on your
          device
        </p>
        <p onClick={specifyPath} className={cn.specifyPath}>
          Specify HD Path
        </p>
        <Button variant="outlined" onClick={connect} className={cn.connectButton}>
          Connect
        </Button>
      </div>
    </>
  );
};
