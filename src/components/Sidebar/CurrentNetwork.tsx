import { useNearContext } from '~/context/near';

export const CurrentNetwork = () => {
  const { network, switchNetwork } = useNearContext();

  return (
    <div className="prose flex items-center justify-center">
      <div
        className="text-xs text-gray-500"
        onClick={() => {
          void switchNetwork();
        }}
      >
        Current network:
      </div>
      <div className="prose ml-1 text-xs text-gray-500">{network}</div>
    </div>
  );
};