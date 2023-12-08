import { PublicKey } from "near-api-js/lib/utils";

type Pk = PublicKey | null;

type Props = {
  publicKey: Pk;
};

const copyToClipboard = async (publicKey: Pk) => {
  if (!publicKey) return;

  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(publicKey.toString());
      alert("Public key copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  } else {
    alert("Clipboard API not supported in your browser.");
  }
};

export const WebThreeConnected = ({ publicKey }: Props) => {
  // Determine styles and behavior based on publicKey availability
  const textStyle = publicKey
    ? "text-xs text-gray-500 cursor-pointer"
    : "text-xs text-gray-300 cursor-default"; // Lighter color and default cursor when publicKey is null

  const clickHandler = () => copyToClipboard(publicKey);

  return (
    <div className="prose flex items-center justify-center">
      <div className={textStyle} onClick={clickHandler}>
        Click here to copy ledger public key
      </div>
    </div>
  );
};
