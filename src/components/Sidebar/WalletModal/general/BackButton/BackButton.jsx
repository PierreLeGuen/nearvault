import { BackArrowIcon } from '../icons/BackArrowIcon.tsx';
import { useStoreActions } from 'easy-peasy';
import cn from './BackButton.module.css';

export const BackButton = ({ to }) => {
  const navigate = useStoreActions((actions) => actions.wallets.modal.navigate);

  const onClick = () => to && navigate(to);

  return (
    <button onClick={onClick} className={cn.button}>
      <BackArrowIcon className={cn.icon} />
    </button>
  );
};
