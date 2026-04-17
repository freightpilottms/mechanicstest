import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabase-admin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { data, error } = await supabaseAdmin
      .from("scenarios")
      .select("id, title, brand, difficulty")
      .limit(5);

    if (error) {
      return res.status(500).json({
        ok: false,
        error: error.message,
      });
    }

    return res.status(200).json({
      ok: true,
      rows: data ?? [],
    });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error: error?.message || "Unknown error",
    });
  }
}