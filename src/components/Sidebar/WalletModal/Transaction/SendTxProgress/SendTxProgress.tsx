import Image from "next/image";
import { Header } from "../../general/Header/Header.jsx";
import { CloseButton } from "../../general/CloseButton/CloseButton.jsx";
import sendTx from "../../../../../../public/send-tx.png";
import Progress from "@mui/material/CircularProgress";
import cn from "./SendTxProgress.module.css";

export const SendTxProgress = ({ routeParams }: any) => {
  const { tx } = routeParams;
  return (
    <>
      <Header>Send Transaction</Header>
      <CloseButton />
      <div className={cn.content}>
        <Image src={sendTx} className={cn.icon} alt="Send Transaction" priority />
        <div className={cn.progressWrapper}>
          <Progress size={24} />
          <span>
            Sending transaction to <br />
            <span className={cn.receiverId}>{tx.receiverId}</span>
          </span>
        </div>
      </div>
    </>
  );
};
