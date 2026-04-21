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
      root_cause_label: "Djelomično začepljen DPF",
      difficulty: "hard",
      title: "Gubitak snage bez lampica pod većim opterećenjem",
      vehicle: "BMW F10 520d",
      symptoms: [
        "Auto pali normalno",
        "Na leru radi mirno",
        "Nema lampica upozorenja",
        "Nema izraženog dima iz auspuha",
      ],
      driving: [
        "Do oko 2200 o/min ide normalno",
        "Preko toga kao da udari u zid",
        "Ne ubrzava dalje kako treba",
        "Nema trzanja ni preskakanja",
        "Pod većim opterećenjem djeluje zagušeno",
      ],
      extra: [
        "Turbo se čuje i puni",
        "Nema limp mode režima",
        "Na dijagnostici nema jasne aktivne greške",
      ],
      key_details: [
        "Očitavanja MAF senzora djeluju normalno",
        "Pritisak turbine je blizu tražene vrijednosti",
        "Motor i dalje nema snage pri višem opterećenju",
      ],
      questions: [
        "Najvjerovatniji uzrok (1 konkretna stvar)",
        "Zašto ECU ne baca grešku",
        "Kako bi to dokazao u praksi",
      ],
      hint: [
        "Nije problem u vakumu",
        "Nije kvar turbine",
        "Nije direktno problem u dovodu goriva",
        "Nešto guši motor, ali senzori na prvi pogled izgledaju uredno",
      ],
      answer_main: "DPF je djelomično začepljen i stvara previsok povratni pritisak u izduvu.",
      answer_why_no_code:
        "Vrijednosti mogu ostati blizu granica tolerancije, ali pod većim opterećenjem povratni pritisak postaje dovoljno visok da motor izgubi snagu bez jasnog koda greške.",
      answer_proof: [
        "Očitati diferencijalni pritisak DPF-a na leru i pod opterećenjem",
        "Pratiti povratni pritisak izduva tokom test vožnje",
        "Provjeriti soot load i ash load ako su dostupni u live data",
        "Uporediti ponašanje vozila prije i poslije prisilne regeneracije ili čišćenja ako je opravdano",
      ],
      accepted_answers: [
        "dpf",
        "začepljen dpf",
        "djelomično začepljen dpf",
        "dpf pravi previsok povratni pritisak",
        "previsok backpressure zbog dpf-a",
        "začepljen izduv zbog dpf-a",
        "izduv guši motor zbog dpf-a",
        "restrikcija u dpf-u",
        "dpf restrikcija",
        "prevelik otpor u izduvu zbog dpf-a",
      ],
      partial_answers: [
        "začepljen izduv",
        "previsok povratni pritisak u izduvu",
        "backpressure",
        "restrikcija u izduvu",
        "izduv guši motor",
        "problem sa protokom izduva",
        "nešto guši motor na izduvu",
      ],
      scoring_notes: {
        directionWeight: 0.6,
        precisionWeight: 0.25,
        reasoningWeight: 0.15,
        difficulty: "hard",
        titleMustNotRevealAnswer: true,
        languageLocked: "bs",
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