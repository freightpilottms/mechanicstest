import type { NextApiRequest, NextApiResponse } from "next";
import { findScenarioBySignature, insertScenario } from "../../lib/scenario-storage";
import { makeScenarioSignature } from "../../lib/scenario-signature";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const locale = String(req.query.locale || req.query.lang || "bs").toLowerCase() === "en" ? "en" : "bs";

    const baseScenario =
      locale === "bs"
        ? {
            brand: "BMW",
            platform_type: "modern_diesel_cr_turbo_dpf_chain",
            category: "Air flow / Turbo / Intake",
            root_cause_id: "boost_leak_intercooler_hose_loose_after_service",
            root_cause_label: "Labavo crijevo intercoolera / boost leak nakon rada oko usisa",
            difficulty: "medium" as const,
            title: "Gubitak snage pod opterećenjem nakon nedavnog rada oko usisa",
            vehicle: "BMW F10 520d",
            year: 2012,
            power_kw: 135,
            symptoms: [
              "Auto pali normalno i na leru radi uredno",
              "Pri laganoj vožnji ne djeluje posebno problematično",
              "Pod jačim gasom slabije vuče nego ranije",
              "Povremeno se čuje jače šištanje zraka pri ubrzanju",
            ],
            driving: [
              "Do nižih obrtaja ide pristojno",
              "Kad se traži jače ubrzanje auto ostaje bez daha",
              "Na uzbrdici je problem izraženiji",
              "Nema grubog rada motora ni preskakanja",
            ],
            extra: [
              "Problem se pojavio nakon skidanja dijelova usisa radi drugog servisa",
              "Nema jakog crnog dima",
              "Nema jasne aktivne greške koja odmah vodi na tačan kvar",
            ],
            key_details: [
              "Turbo pokušava da puni, ali stvarni rezultat nije uvjerljiv pod opterećenjem",
              "Na vizuelnom pregledu ništa ne mora odmah upasti u oči",
              "Kvar je više primjetan u vožnji nego na mjestu",
            ],
            questions: [
              "Koji je najvjerovatniji konkretan uzrok?",
              "Zašto problem može proći bez jasnog koda greške?",
              "Kako bi ovo najbrže dokazao u praksi?",
            ],
            hint: [
              "Ne zvuči kao klasičan problem goriva",
              "Kvar je vjerovatnije na putu zraka pod pritiskom",
              "Veza sa nedavnim radom oko usisa nije slučajna",
            ],
            answer_main:
              "Najvjerovatniji uzrok je labavo ili loše naleglo crijevo intercoolera, odnosno boost leak na spoju koji je diran tokom servisa.",
            answer_why_no_code:
              "Ako je curenje umjereno, ECU može i dalje držati vrijednosti blizu dozvoljenih granica, posebno bez stalnog odstupanja. Problem se najviše osjeti tek pod opterećenjem kada motor traži veći protok i pritisak zraka.",
            answer_proof: [
              "Vizuelno pregledati sve spojeve charge sistema koji su dirani tokom servisa",
              "Provjeriti tragove masnoće oko spojeva intercooler crijeva",
              "Uradi smoke test ili pressure test usisnog sistema",
              "Na test vožnji uporediti traženi i stvarni boost",
            ],
            accepted_answers: [
              "labavo crijevo intercoolera",
              "spalo crijevo intercoolera",
              "boost leak na crijevu intercoolera",
              "propusta spoj charge pipe",
              "curenje zraka na usisu pod pritiskom",
              "labav spoj poslije usisa",
            ],
            partial_answers: [
              "boost leak",
              "curenje zraka",
              "problem na intercooleru",
              "problem na usisu pod pritiskom",
              "propusta charge pipe",
            ],
            scoring_notes: {
              directionWeight: 0.55,
              precisionWeight: 0.3,
              reasoningWeight: 0.15,
              difficulty: "medium",
              titleMustNotRevealAnswer: true,
              languageLocked: "bs",
              realismFocus: "fault-first, coherent trigger, workshop-style wording",
            },
          }
        : {
            brand: "BMW",
            platform_type: "modern_diesel_cr_turbo_dpf_chain",
            category: "Air flow / Turbo / Intake",
            root_cause_id: "boost_leak_intercooler_hose_loose_after_service",
            root_cause_label: "Loose intercooler hose / boost leak after intake-side work",
            difficulty: "medium" as const,
            title: "Loss of power under load after recent work around the intake system",
            vehicle: "BMW F10 520d",
            year: 2012,
            power_kw: 135,
            symptoms: [
              "Engine starts normally and idles smoothly",
              "Light driving feels mostly normal",
              "Under stronger acceleration the car feels noticeably weaker",
              "A stronger hissing air noise is sometimes heard during acceleration",
            ],
            driving: [
              "At lower load it feels acceptable",
              "When stronger acceleration is requested the engine feels flat",
              "The problem is more noticeable uphill",
              "No obvious misfire or rough running is present",
            ],
            extra: [
              "The issue started after components around the intake system were removed for unrelated service work",
              "There is no heavy black smoke",
              "There is no single obvious fault code directly pointing to the cause",
            ],
            key_details: [
              "Turbo response is attempted, but the result is weak under load",
              "A quick visual check may not immediately reveal the issue",
              "The fault is easier to feel on the road than at idle",
            ],
            questions: [
              "What is the single most likely root cause?",
              "Why might the ECU not set a clear fault code for this?",
              "How would you prove it quickly in practice?",
            ],
            hint: [
              "This does not primarily feel like a fuel delivery problem",
              "The fault is more likely somewhere in the pressurized air path",
              "The timing with recent intake-side work is probably important",
            ],
            answer_main:
              "The most likely cause is a loose or poorly seated intercooler hose, causing a boost leak at a connection disturbed during service.",
            answer_why_no_code:
              "If the leak is moderate, measured values may remain close enough to target to avoid a clear hard fault, especially until load rises. The real weakness appears when the engine requests significantly more air under boost.",
            answer_proof: [
              "Visually inspect every charge-air connection disturbed during recent service",
              "Look for oil mist traces around intercooler hose joints",
              "Perform a smoke test or pressure test on the intake/charge system",
              "Compare requested vs actual boost during a road test",
            ],
            accepted_answers: [
              "loose intercooler hose",
              "boost leak at intercooler hose",
              "charge pipe connection leak",
              "boost leak after service",
              "loose charge air hose",
            ],
            partial_answers: [
              "boost leak",
              "air leak under boost",
              "charge pipe problem",
              "intercooler hose issue",
            ],
            scoring_notes: {
              directionWeight: 0.55,
              precisionWeight: 0.3,
              reasoningWeight: 0.15,
              difficulty: "medium",
              titleMustNotRevealAnswer: true,
              languageLocked: "en",
              realismFocus: "fault-first, coherent trigger, workshop-style wording",
            },
          };

    const signature = makeScenarioSignature({
      brand: baseScenario.brand,
      vehicle: baseScenario.vehicle,
      rootCauseId: baseScenario.root_cause_id,
      difficulty: baseScenario.difficulty,
      title: baseScenario.title,
      locale,
    });

    const existing = await findScenarioBySignature(signature);

    if (existing) {
      return res.status(200).json({
        ok: true,
        message: "Scenario already exists",
        existing,
      });
    }

    const inserted = await insertScenario({
      ...baseScenario,
      signature,
      locale,
      language: locale,
    });

    return res.status(200).json({
      ok: true,
      inserted,
      signature,
    });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error: error?.message || "Unknown error",
    });
  }
}
