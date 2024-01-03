import { config } from "~/config/config";

export const CurrentNetwork = () => (
  <div className="prose flex items-center justify-center">
    <div className="text-xs text-gray-500">Current network:</div>
    <div className="prose ml-1 text-xs text-gray-500">{config.networkId}</div>
  </div>
);
