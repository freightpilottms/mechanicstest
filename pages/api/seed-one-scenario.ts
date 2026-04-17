import type { NextApiRequest, NextApiResponse } from "next";
import { findScenarioBySignature, insertScenario } from "../../lib/scenario-storage";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const signature = "bmw-f10-520d-dpf-hard-power-loss-v1";

    const existing = await findScenarioBySignature(signature);

    if (existing) {
      return res.status(200).json({
        ok: true,
        message: "Scenario already exists",
        existing,
      });
    }

    const inserted = await insertScenario({
      brand: "BMW",
      platform_type: "modern_diesel_cr_turbo_dpf_chain",
      category: "Exhaust / DPF / EGR",
      root_cause_id: "dpf_partial_restriction",
      root_cause_label: "Partially clogged DPF",
      difficulty: "hard",
      title: "POWER LOSS (TRICKY)",
      vehicle: "BMW F10 520d",
      symptoms: [
        "Auto pali normalno",
        "Na leru radi perfektno",
        "Nema lampica",
        "Nema dima"
      ],
      driving: [
        "Do oko 2200 rpm ide OK",
        "Preko toga kao da udari u zid",
        "Ne ubrzava dalje kako treba",
        "Nema trzanja",
        "Zagušen osjećaj"
      ],
      extra: [
        "Turbo se čuje",
        "Nema limp mode",
        "Dijagnostika čista"
      ],
      key_details: [
        "MAF očitanja su normalna",
        "Boost pressure je blizu traženog",
        "Auto i dalje nema snage"
      ],
      questions: [
        "Najvjerovatniji uzrok (1 konkretna stvar)",
        "Zašto ECU ne baca grešku",
        "Kako bi to dokazao u praksi"
      ],
      hint: [
        "Nije vakum",
        "Nije turbo",
        "Nije gorivo direktno",
        "Nešto guši motor, ali svi senzori izgledaju OK"
      ],
      answer_main: "DPF djelimično začepljen / previsok backpressure",
      answer_why_no_code:
        "Vrijednosti mogu biti unutar tolerancije, ali dovoljno loše da pod opterećenjem guše motor.",
      answer_proof: [
        "Očitati diferencijalni pritisak DPF-a",
        "Gledati backpressure pod opterećenjem",
        "Provjeriti soot/ash load",
        "Test vožnja uz live data"
      ],
      accepted_answers: [
        "dpf",
        "zacepljen dpf",
        "backpressure",
        "zacepljen izduv",
        "restriction u izduvu",
        "izduv gusi motor"
      ],
      partial_answers: [
        "problem sa disanjem motora",
        "gusenje motora",
        "restriction",
        "protok izduva"
      ],
      scoring_notes: {
        directionWeight: 0.7,
        precisionWeight: 0.2,
        reasoningWeight: 0.1
      },
      signature,
    });

    return res.status(200).json({
      ok: true,
      inserted,
    });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error: error?.message || "Unknown error",
    });
  }
}