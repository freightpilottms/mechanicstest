import type { NextApiRequest, NextApiResponse } from "next";
import { generateScenario } from "@/lib/openai";
import { makeScenarioSignature } from "@/lib/scenario-signature";
import {
  findScenarioBySignature,
  insertScenario,
} from "@/lib/scenario-storage";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const rawCount = Number(req.body?.count ?? req.query.count ?? 10);
    const count = Math.max(1, Math.min(50, Number.isFinite(rawCount) ? rawCount : 10));

    const created: any[] = [];
    const existing: any[] = [];
    const failed: any[] = [];

    for (let i = 0; i < count; i += 1) {
      try {
        const scenario = await generateScenario();
        const signature = makeScenarioSignature(scenario);

        const alreadyExists = await findScenarioBySignature(signature);

        if (alreadyExists) {
          existing.push({
            id: alreadyExists.id,
            signature,
          });
          continue;
        }

        const inserted = await insertScenario({
          ...scenario,
          signature,
        });

        created.push({
          id: inserted.id,
          signature,
        });
      } catch (err: any) {
        failed.push({
          error: String(err?.message || err),
        });
      }
    }

    return res.status(200).json({
      ok: true,
      requested: count,
      createdCount: created.length,
      existingCount: existing.length,
      failedCount: failed.length,
      created,
      existing,
      failed,
    });
  } catch (e: any) {
    return res.status(500).json({
      ok: false,
      error: String(e?.message || e),
    });
  }
}