import type { NextApiRequest, NextApiResponse } from "next";
import getConfig from "next/config";

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const { publicRuntimeConfig } = getConfig() ?? {};
  const buildId =
    (publicRuntimeConfig as { buildId?: string })?.buildId ?? "unknown";
  res.setHeader("Cache-Control", "no-store");
  res.json({ buildId });
}
