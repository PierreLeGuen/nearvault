import { Button } from "@mui/material";
import Image from "next/image";
import { Header } from "../../general/Header/Header.jsx";
import { CloseButton } from "../../general/CloseButton/CloseButton.jsx";
import sendTx from "../../../../../../public/send-tx.png";
import cn from "./SendTxSuccess.module.css";

export const SendTxSuccess = ({ routeParams, closeModal }: any) => {
  const { outcome } = routeParams;

  return (
    <>
      <Header>Success</Header>
      <CloseButton />
      <div className={cn.content}>
        <Image
          src={sendTx}
          className={cn.icon}
          alt="Send Transaction"
          priority
        />
        <p className={cn.status}>Transaction completed successfully</p>
        <div className={cn.details}>
          <p>More details here:</p>
          <a
            className={cn.link}
            href={`https://nearblocks.io/txns/${outcome.transaction.hash}`} // TODO move to config
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
