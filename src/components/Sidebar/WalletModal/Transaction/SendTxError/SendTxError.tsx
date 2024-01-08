import { Header } from "../../general/Header/Header.jsx";
import { CloseButton } from "../../general/CloseButton/CloseButton.jsx";
import cn from "./SendTxError.module.css";
import { Button } from "@mui/material";
import sendTx from '../../../../../../public/send-tx.png';
import Image from 'next/image';
import { config } from '~/config/config';

export const SendTxError = ({ routeParams, closeModal }: any) => {
  const { outcome } = routeParams;

  return (
    <>
      <Header>Failure</Header>
      <CloseButton />
      <div className={cn.content}>
        <Image
          src={sendTx}
          className={cn.icon}
          alt="Send Transaction"
          priority
        />
        <p className={cn.status}>Transaction failed</p>
        <div className={cn.details}>
          <p>More details here:</p>
          <a
            className={cn.link}
            href={config.urls.nearBlocks.txDetails(outcome.transaction.hash)}
            target="_blank"
          >
            TX#{outcome.transaction.hash}
          </a>
        </div>
        <Button
          variant="outlined"
          onClick={closeModal}
          className={cn.closeButton}
        >
          Close
        </Button>
      </div>
    </>
  );
};
