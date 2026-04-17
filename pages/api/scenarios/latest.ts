import type { NextApiRequest, NextApiResponse } from "next";
import { getLatestScenario } from "@/lib/scenario-storage";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const scenario = await getLatestScenario();

    if (!scenario) {
      return res.status(404).json({ ok: false, error: "No scenarios found" });
    }

    return res.status(200).json({
      ok: true,
      scenario,
    });
  } catch (e: any) {
    return res.status(500).json({
      ok: false,
      error: String(e?.message || e),
    });
  }
}