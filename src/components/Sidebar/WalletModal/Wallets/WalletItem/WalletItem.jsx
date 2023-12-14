import Image from 'next/image'
import cn from './WalletItem.module.css';

export const WalletItem = ({ icon, label, onClick }) => {
  return (
    <div className={cn.container} onClick={onClick}>
      <Image src={icon} className={cn.icon} alt='wallet-icon' />
      <span className={cn.label}>{label}</span>
    </div>
  );
};
