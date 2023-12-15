import { useNearContext } from "~/context/near";

export const CurrentNetwork = () => {
  const { network } = useNearContext();

  return (
    <div className="prose flex items-center justify-center">
      <div className="text-xs text-gray-500">Current network:</div>
      <div className="prose ml-1 text-xs text-gray-500">{network}</div>
    </div>
  );
};
