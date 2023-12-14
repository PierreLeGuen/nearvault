import { Header } from '../../general/Header/Header.jsx';
import cn from './FindMultisigAccountsProgress.module.css'
import img from '../../../../../../public/account.png';
import Progress from '@mui/material/CircularProgress';

export const FindMultisigAccountsProgress = () => (
  <>
    <Header>Looking for Account</Header>
    <div className={cn.content}>
      <img src={img} alt="Account picture" className={cn.img} />
      <div className={cn.progressWrapper}>
        <Progress size={24} />
        <span>Searching...</span>
      </div>
      <p className={cn.text}>
        We looking for all your Multisig accounts associated with your Ledger. This may take a few
        moments
      </p>
    </div>
  </>
);
