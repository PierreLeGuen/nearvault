import cn from './CloseButton.module.css';
import { CloseIcon } from '../icons/CloseIcon.tsx';
import { useStoreActions } from 'easy-peasy';

export const CloseButton = () => {
  const close = useStoreActions((actions) => actions.wallets.modal.close);
  return (
    <button onClick={close} className={cn.button}>
      <CloseIcon className={cn.icon} />
    </button>
  );
};
