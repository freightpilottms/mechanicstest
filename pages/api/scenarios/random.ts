import type { NextApiRequest, NextApiResponse } from "next";
import {
  getScenariosForMode,
  incrementScenarioTimesUsed,
} from "@/lib/scenario-storage";

type Mode = "all" | "eu" | "us" | "asia";

function normalizeMode(value: unknown): Mode {
  const v = String(value || "all").toLowerCase();
  if (v === "eu" || v === "us" || v === "asia") return v;
  return "all";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const mode = normalizeMode(req.query.mode);
    const pool = await getScenariosForMode(mode, 30);

    if (!pool.length) {
      return res.status(404).json({
        ok: false,
        error: "No scenarios found for selected mode",
      });
    }

    const picked = pool[Math.floor(Math.random() * pool.length)];

    if (picked?.id) {
      await incrementScenarioTimesUsed(picked.id);
    }

    return res.status(200).json({
      ok: true,
      scenario: picked,
    });
  } catch (e: any) {
    return res.status(500).json({
      ok: false,
      error: String(e?.message || e),
    });
  }
}