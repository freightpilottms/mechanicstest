import type { NextApiRequest, NextApiResponse } from "next";
import {
  getScenariosForMode,
  incrementScenarioTimesUsed,
} from "@/lib/scenario-storage";
import { scenarioViolatesBlueprint } from "@/lib/scenario-blueprints";
import type { ScenarioSeed } from "@/lib/scenario-seeds";

function isBlueprintCoherent(item: any) {
  if (!item?.root_cause_id || !item?.root_cause_label || !item?.category) {
    return true;
  }

  return !scenarioViolatesBlueprint(
    item,
    {
      brand: String(item.brand || ""),
      vehicle: String(item.vehicle || ""),
      platform_type: String(item.platform_type || ""),
      category: String(item.category || ""),
      root_cause_id: String(item.root_cause_id || ""),
      root_cause_label: String(item.root_cause_label || ""),
      difficulty: item.difficulty || "medium",
      year: item.year,
      power_kw: item.power_kw,
      context: {
        temperature: "",
        load: "",
        behavior: "",
        timeline: "",
      },
    } as ScenarioSeed
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const pool = (await getScenariosForMode("all", 100)).filter(isBlueprintCoherent);

    if (!pool.length) {
      return res.status(404).json({
        ok: false,
        error: "No scenarios found",
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
