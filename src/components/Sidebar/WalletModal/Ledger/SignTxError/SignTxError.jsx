import { Header } from '../../general/Header/Header.jsx';
import { CloseButton } from '../../general/CloseButton/CloseButton.jsx';
import { LedgerDeviceIcon } from '../../general/icons/LedgerDeviceIcon.tsx';
import cn from './SignTxError.module.css';

export const SignTxError = ({ routeParams }) => {
  const { name, message } = routeParams?.error;

  return (
    <>
      <Header>Error</Header>
      <CloseButton />
      <div className={cn.content}>
        <LedgerDeviceIcon className={cn.icon} />
        <p className={cn.error}>{message}</p>
      </div>
    </>
  )
}


