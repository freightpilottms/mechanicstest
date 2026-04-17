import type { NextApiRequest, NextApiResponse } from "next";
import { getScenarioById } from "@/lib/scenario-storage";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const rawId = req.query.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ ok: false, error: "Missing scenario id" });
    }

    const scenario = await getScenarioById(id);

    if (!scenario) {
      return res.status(404).json({ ok: false, error: "Scenario not found" });
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