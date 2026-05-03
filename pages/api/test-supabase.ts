import type { NextApiRequest, NextApiResponse } from "next";
import { getSupabaseAdmin } from "../../lib/supabase-admin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await supabaseAdmin
      .from("scenarios")
      .select("id, title, brand, difficulty")
      .limit(5);

    const { error: schemaError } = await supabaseAdmin
      .from("scenarios")
      .select(
        "id, signature, locale, language, times_used, year, power_kw, engine_code, fuel_type, induction, timing_type, has_start_stop, has_dpf, emission_standard"
      )
      .limit(1);

    if (error) {
      return res.status(500).json({
        ok: false,
        error: error.message,
      });
    }

    return res.status(200).json({
      ok: true,
      rows: data ?? [],
      schema: {
        scenarioMetaReady: !schemaError,
        warning: schemaError?.message || null,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error: error?.message || "Unknown error",
    });
  }
}
