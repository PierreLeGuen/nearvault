import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const buildId = process.env.NEXT_PUBLIC_BUILD_ID ?? "unknown";
  res.setHeader("Cache-Control", "no-store");
  res.json({ buildId });
}
