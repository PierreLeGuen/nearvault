import Image from "next/image";

const RoundedAvatar = ({ imageUrl }: { imageUrl: string }) => {
  return (
    <div className="h-8 w-8 overflow-hidden rounded-full">
      <Image
        src={imageUrl}
        alt="Avatar"
        className="h-full w-full object-cover"
        width={64}
        height={64}
      />
    </div>
  );
};

export default RoundedAvatar;
