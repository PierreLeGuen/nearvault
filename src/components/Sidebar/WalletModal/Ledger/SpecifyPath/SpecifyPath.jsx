import { BackButton } from '../../general/BackButton/BackButton.jsx';
import { Header } from '../../general/Header/Header.jsx';
import { CloseButton } from '../../general/CloseButton/CloseButton.jsx';
import cn from './SpecifyPath.module.css';

export const SpecifyPath = () => {
  return (
    <>
      <BackButton to="/ledger/connect" />
      <Header>Specify HD Path</Header>
      <CloseButton />
      <div className={cn.content}>
        <p>Enter your preferred HD path, then scan for any active accounts</p>
        <a
          href="https://www.ledger.com/academy/crypto/what-are-hierarchical-deterministic-hd-wallets"
          target="_blank"
        >
          What's this?
        </a>
      </div>
    </>
  );
};
