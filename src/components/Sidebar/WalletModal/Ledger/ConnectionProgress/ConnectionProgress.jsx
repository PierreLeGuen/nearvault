import { Header } from '../../general/Header/Header.jsx';
import { LedgerDeviceIcon } from '../../general/icons/LedgerDeviceIcon';
import Progress from '@mui/material/CircularProgress';
import cn from './ConnectionProgress.module.css';

export const ConnectionProgress = () => (
  <>
    <Header>Connection</Header>
    <div className={cn.content}>
      <LedgerDeviceIcon className={cn.icon} />
      <div className={cn.progressWrapper}>
        <Progress size={24}/>
        <span>Connecting to ledger...</span>
      </div>
      <p className={cn.title}>Confirm the request on your ledger device</p>
    </div>
  </>
);
