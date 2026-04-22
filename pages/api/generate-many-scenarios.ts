import type { NextApiRequest, NextApiResponse } from "next";
import { getOpenAI } from "../../lib/openai";
import {
  insertScenario,
  findScenarioBySignature,
} from "../../lib/scenario-storage";
import { makeScenarioSignature } from "../../lib/scenario-signature";
import {
  getRandomScenarioSeed,
  type ScenarioSeed,
} from "../../lib/scenario-seeds";

type SupportedLocale = "en" | "bs";

type ScenarioAIResponse = {
  brand: string;
  platform_type: string;
  category: string;
  root_cause_id: string;
  root_cause_label: string;
  difficulty: "easy" | "medium" | "hard";
  title: string;
  vehicle: string;
  year?: number;
  power_kw?: number;
  engine_code?: string;
  fuel_type?: string;
  induction?: string;
  timing_type?: string;
  has_start_stop?: boolean;
  has_dpf?: boolean;
  emission_standard?: string;
  symptoms: string[];
  driving: string[];
  extra: string[];
  key_details: string[];
  questions: string[];
  hint: string[];
  answer_main: string;
  answer_why_no_code: string;
  answer_proof: string[];
  accepted_answers: string[];
  partial_answers: string[];
  scoring_notes: Record<string, any>;
};

function getLocaleFromReq(req: NextApiRequest): SupportedLocale {
  const raw = String(req.query.locale || req.query.lang || "en").toLowerCase();
  return raw === "bs" ? "bs" : "en";
}

function getDifficultyGuide(
  difficulty: "easy" | "medium" | "hard",
  locale: SupportedLocale
) {
  if (locale === "bs") {
    if (difficulty === "easy") {
      return `
TEŽINA EASY:
- Scenarij treba imati jasnije i prepoznatljivije simptome
- 1 do 2 jaka traga smiju voditi prema tačnom uzroku
- Hint može biti koristan, ali ne smije direktno otkrivati kvar
- accepted_answers treba da sadrži 5 do 8 realnih sinonima ili prirodnih formulacija
- partial_answers treba da sadrži 4 do 6 bliskih, ali manje preciznih odgovora
`;
    }

    if (difficulty === "medium") {
      return `
TEŽINA MEDIUM:
- Scenarij treba imati mješavinu korisnih i djelimično dvosmislenih simptoma
- Hint smije pomoći, ali ne smije biti dovoljan sam po sebi
- Mora postojati barem jedan simptom koji traži mehaničko razmišljanje
- accepted_answers treba da sadrži 6 do 10 realnih sinonima ili formulacija
- partial_answers treba da sadrži 5 do 8 odgovora koji su blizu tačnog uzroka
`;
    }

    return `
TEŽINA HARD:
- Scenarij treba biti realan, ali zahtjevniji za zaključivanje
- Simptomi ne smiju biti lažni, ali ne moraju svi direktno voditi na odgovor
- Hint može biti varljiv ili samo djelimično koristan
- U scenarij ubaci 1 do 2 sekundarna traga koji mogu navesti na pogrešan pravac ako se ne razmišlja dobro
- accepted_answers treba da sadrži 8 do 12 realnih sinonima ili formulacija
- partial_answers treba da sadrži 6 do 10 bliskih, ali nepotpunih odgovora
`;
  }

  if (difficulty === "easy") {
    return `
EASY DIFFICULTY:
- The scenario should include clearer, more recognizable symptoms
- 1 to 2 strong clues may point toward the correct cause
- The hint may help, but must not directly reveal the fault
- accepted_answers should contain 5 to 8 realistic synonyms or natural phrasings
- partial_answers should contain 4 to 6 close but less precise answers
`;
  }

  if (difficulty === "medium") {
    return `
MEDIUM DIFFICULTY:
- The scenario should mix helpful clues with some ambiguity
- The hint may help, but must not be sufficient by itself
- At least one symptom should require mechanic-style reasoning
- accepted_answers should contain 6 to 10 realistic synonyms or phrasings
- partial_answers should contain 5 to 8 answers that are close to the correct cause
`;
  }

  return `
HARD DIFFICULTY:
- The scenario should be realistic but more demanding to solve
- Symptoms must not be fake, but they do not all need to point directly to the answer
- The hint may be misleading or only partially helpful
- Include 1 to 2 secondary clues that may send a weak diagnostician in the wrong direction
- accepted_answers should contain 8 to 12 realistic synonyms or phrasings
- partial_answers should contain 6 to 10 close but incomplete answers
`;
}

function getLanguageRules(locale: SupportedLocale) {
  if (locale === "bs") {
    return `
JEZIK I TERMINOLOGIJA:
- Sav tekst mora biti na prirodnom bosanskom jeziku
- Ne miješaj engleski i bosanski
- Ne koristi bukvalno prevedene izraze iz engleskog
- Piši kao da iskusan mehaničar opisuje kvar drugom mehaničaru
- Koristi prirodne izraze kao:
  - ler
  - preskakanje paljenja
  - motanje volana
  - motanje u krug
  - hučanje
  - kliktanje
  - zveckanje
  - curenje rashladne tečnosti
  - gubitak pritiska turbine
  - gašenje motora
  - zastajkivanje
  - vibracije u leru
  - zanošenje pri kočenju
- Izbjegavaj neprirodne fraze poput:
  - full lock
  - rough idle
  - boost leak
  - misfire
  - low boost
- Primjer loše fraze:
  "Zveckanje pri motanju u pun lock"
- Primjer dobre fraze:
  "Zveckanje pri punom motanju volana"
  "Preskakanje pri motanju u krug"
`;
  }

  return `
LANGUAGE AND TERMINOLOGY:
- All text must be natural English
- Do not mix languages
- Write like an experienced mechanic describing a realistic diagnostic case
`;
}

function getVarietyRules(locale: SupportedLocale) {
  if (locale === "bs") {
    return `
RAZNOLIKOST SCENARIJA:
- Nemoj praviti scenarije koji se stalno vrte oko zraka, goriva i istih senzora
- Daj realnu raznolikost između ovih grupa kvarova:
  - hlađenje i gubitak rashladne tečnosti
  - dihtung glave i unutrašnji kvarovi motora
  - turbo / vakuum / usis / EGR / DPF
  - gorivo i pritisak goriva
  - paljenje / sinkronizacija / senzori
  - ležaj točka
  - kinetički zglob
  - nosači motora / mjenjača
  - ovjes / seleni / kugle / stabilizator
  - kočnice / diskovi / kliješta / ABS
  - elektrika / mase / akumulator / alternator / starter
- Neki scenariji smiju imati DTC kod kao hint
- Neki scenariji ne smiju imati nikakav DTC
- Neki scenariji smiju imati DTC koji nije dovoljan da direktno otkrije odgovor
- Koristi i mehaničke kvarove bez ECU grešaka
`;
  }

  return `
SCENARIO VARIETY:
- Do not overuse air-flow, fuel-flow, and generic sensor scenarios
- Create realistic variety across:
  - cooling system and coolant loss
  - head gasket and internal engine faults
  - turbo / vacuum / intake / EGR / DPF
  - fuel delivery and pressure
  - ignition / synchronization / sensor issues
  - wheel bearing
  - CV joint
  - engine mounts / transmission mounts
  - suspension / bushings / ball joints / stabilizer links
  - brakes / discs / calipers / ABS
  - electrical / grounds / battery / alternator / starter
- Some scenarios may include a DTC as a hint
- Some scenarios should have no DTC at all
- Some scenarios may include a DTC that is incomplete or only partially helpful
- Use mechanical failures too, not just ECU-related systems
`;
}

function describeSeedTechnicalSpec(seed: ScenarioSeed, locale: SupportedLocale) {
  const yes = locale === "bs" ? "da" : "yes";
  const no = locale === "bs" ? "ne" : "no";

  return `
TECHNICAL VEHICLE SPECIFICATION (MUST STAY TRUE):
- vehicle: ${seed.vehicle}
- year: ${seed.year ?? "unknown"}
- power_kw: ${seed.power_kw ?? "unknown"}
- engine_code: ${seed.engine_code ?? "unknown"}
- fuel_type: ${seed.fuel_type ?? "unknown"}
- induction: ${seed.induction ?? "unknown"}
- timing_type: ${seed.timing_type ?? "unknown"}
- has_start_stop: ${seed.has_start_stop === undefined ? "unknown" : seed.has_start_stop ? yes : no}
- has_dpf: ${seed.has_dpf === undefined ? "unknown" : seed.has_dpf ? yes : no}
- emission_standard: ${seed.emission_standard ?? "unknown"}
`;
}

function buildPrompt(seed: ScenarioSeed, locale: SupportedLocale) {
  const languageInstruction =
    locale === "bs"
      ? "Napravi JEDAN realan automobilski dijagnostički scenario na bosanskom jeziku."
      : "Generate ONE realistic automotive diagnostic scenario in English.";

  const question1 =
    locale === "bs"
      ? "Najvjerovatniji uzrok (1 konkretna stvar)"
      : "Most likely cause (1 specific thing)";

  const question2 =
    locale === "bs"
      ? "Zašto ECU ne baca grešku"
      : "Why the ECU does not set a fault code";

  const question3 =
    locale === "bs"
      ? "Kako bi to dokazao u praksi"
      : "How would you prove it in practice";

  const difficultyGuide = getDifficultyGuide(seed.difficulty, locale);
  const languageRules = getLanguageRules(locale);
  const varietyRules = getVarietyRules(locale);
  const technicalSpec = describeSeedTechnicalSpec(seed, locale);

  return `
${languageInstruction}

YOU MUST USE THESE FIXED INPUTS:
- brand: ${seed.brand}
- vehicle: ${seed.vehicle}
- platform_type: ${seed.platform_type}
- category: ${seed.category}
- difficulty: ${seed.difficulty}
- root_cause_id: ${seed.root_cause_id}
- root_cause_label: ${seed.root_cause_label}

${technicalSpec}

SCENARIO CONTEXT (MUST BE USED):
- Temperature condition: ${seed.context.temperature}
- Load condition: ${seed.context.load}
- Behavior pattern: ${seed.context.behavior}
- Failure timeline: ${seed.context.timeline}

STRICT RULES:
- Only automotive diagnostics
- Only one concrete root cause, exactly the one provided above
- Brand / vehicle / platform / category / root cause must stay compatible
- The failure MUST be mechanically possible for this exact vehicle configuration
- Before writing, internally verify that the failure is possible on this exact vehicle
- If the provided root cause would be unrealistic on this exact vehicle, keep the root cause but describe the case only in a technically believable way for this platform
- Never mention start-stop if has_start_stop is false
- Never mention DPF regeneration, DPF restriction, or DPF-related logic if has_dpf is false
- Never mention timing chain for a timing-belt engine unless that engine truly uses a chain
- Never mention timing belt for a timing-chain engine unless that engine truly uses a belt
- Never use diesel-only causes for petrol vehicles, and never use petrol-only causes for diesel vehicles
- Do not add useless facts that are obvious for that engine family
- Do not add trivia like belt/chain unless it matters diagnostically
- Return ONLY valid JSON
- Do not include markdown
- Do not invent a different brand, vehicle, category, difficulty or root cause
- Keep the scenario educational, clear, realistic, and workshop-like
- Do NOT generate fake symptoms
- Do NOT make the case absurd or impossible
- Do NOT write a trick question
- Do NOT reveal the answer in the title
- The title must describe the COMPLAINT or SYMPTOM CONTEXT only
- The title must NOT contain:
  - the failed component
  - the exact diagnosis
  - the DTC code
  - the repair
- Bad title example:
  "Neispravan senzor radilice izaziva gašenje"
- Good title example:
  "Gašenje toplog motora nakon kraćeg zadržavanja"
- Bad title example:
  "Wheel bearing noise at speed"
- Good title example:
  "Hučanje koje raste sa brzinom i mijenja se u krivini"

${languageRules}

${varietyRules}

${difficultyGuide}

QUESTIONS MUST BE EXACTLY:
1. ${question1}
2. ${question2}
3. ${question3}

ACCEPTED ANSWERS / PARTIAL ANSWERS RULES:
- accepted_answers must contain realistic synonyms, mechanic-style paraphrases, and natural alternative phrasings for the SAME root cause
- partial_answers must contain close but incomplete answers that deserve partial credit
- Do not repeat the exact same phrase many times
- Make accepted_answers useful for semantic scoring
- Make partial_answers useful for near-miss scoring

JSON structure:
{
  "brand": "${seed.brand}",
  "platform_type": "${seed.platform_type}",
  "category": "${seed.category}",
  "root_cause_id": "${seed.root_cause_id}",
  "root_cause_label": "${seed.root_cause_label}",
  "difficulty": "${seed.difficulty}",
  "title": "...",
  "vehicle": "${seed.vehicle}",
  "year": ${seed.year ?? "null"},
  "power_kw": ${seed.power_kw ?? "null"},
  "engine_code": ${seed.engine_code ? `"${seed.engine_code}"` : "null"},
  "fuel_type": ${seed.fuel_type ? `"${seed.fuel_type}"` : "null"},
  "induction": ${seed.induction ? `"${seed.induction}"` : "null"},
  "timing_type": ${seed.timing_type ? `"${seed.timing_type}"` : "null"},
  "has_start_stop": ${typeof seed.has_start_stop === "boolean" ? String(seed.has_start_stop) : "null"},
  "has_dpf": ${typeof seed.has_dpf === "boolean" ? String(seed.has_dpf) : "null"},
  "emission_standard": ${seed.emission_standard ? `"${seed.emission_standard}"` : "null"},
  "symptoms": ["..."],
  "driving": ["..."],
  "extra": ["..."],
  "key_details": ["..."],
  "questions": [
    "${question1}",
    "${question2}",
    "${question3}"
  ],
  "hint": ["..."],
  "answer_main": "...",
  "answer_why_no_code": "...",
  "answer_proof": ["..."],
  "accepted_answers": ["..."],
  "partial_answers": ["..."],
  "scoring_notes": {
    "directionWeight": 0.6,
    "precisionWeight": 0.25,
    "reasoningWeight": 0.15,
    "difficulty": "${seed.difficulty}",
    "titleMustNotRevealAnswer": true,
    "languageLocked": "${locale}"
  }
}

QUALITY CHECK BEFORE RETURNING JSON:
- The title must NOT reveal the diagnosis
- The language must be consistent and natural
- The scenario must not feel generic
- The provided context must clearly influence the complaint and story
- The root cause must remain exactly the same as provided
- accepted_answers must be rich enough for synonym recognition
- partial_answers must support realistic partial credit
- The case must sound like a real workshop case, not a textbook paragraph
`;
}

function validateScenario(data: any): data is ScenarioAIResponse {
  return (
    data &&
    typeof data.brand === "string" &&
    typeof data.platform_type === "string" &&
    typeof data.category === "string" &&
    typeof data.root_cause_id === "string" &&
    typeof data.root_cause_label === "string" &&
    ["easy", "medium", "hard"].includes(data.difficulty) &&
    typeof data.title === "string" &&
    typeof data.vehicle === "string" &&
    Array.isArray(data.symptoms) &&
    Array.isArray(data.driving) &&
    Array.isArray(data.extra) &&
    Array.isArray(data.key_details) &&
    Array.isArray(data.questions) &&
    Array.isArray(data.hint) &&
    typeof data.answer_main === "string" &&
    typeof data.answer_why_no_code === "string" &&
    Array.isArray(data.answer_proof) &&
    Array.isArray(data.accepted_answers) &&
    Array.isArray(data.partial_answers) &&
    typeof data.scoring_notes === "object"
  );
}

function normalizeText(value: any) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleRevealsAnswer(title: string, rootCauseLabel: string, answerMain: string) {
  const haystack = normalizeText(title);
  const needles = [rootCauseLabel, answerMain]
    .map(normalizeText)
    .filter(Boolean);

  const bannedTokens = [
    "sensor",
    "senzor",
    "injector",
    "dizna",
    "pump",
    "pumpa",
    "turbo",
    "egr",
    "dpf",
    "bearing",
    "lezaj",
    "ležaj",
    "caliper",
    "klijesta",
    "kliješta",
    "alternator",
    "starter",
    "anlaser",
    "thermostat",
    "termostat",
    "head gasket",
    "dihtung glave",
    "cv joint",
    "kineticki",
    "kinetički",
    "mount",
    "nosac",
    "nosač",
  ];

  if (bannedTokens.some((token) => haystack.includes(normalizeText(token)))) {
    return true;
  }

  return needles.some((needle) => {
    if (!needle) return false;
    if (needle.length >= 6 && haystack.includes(needle)) return true;
    const parts = needle.split(" ").filter((part) => part.length >= 5);
    return parts.some((part) => haystack.includes(part));
  });
}

function scenarioLooksTechnicallyWrong(
  parsed: ScenarioAIResponse,
  seed: ScenarioSeed
): string | null {
  const textBlob = normalizeText(
    [
      parsed.title,
      ...(parsed.symptoms || []),
      ...(parsed.driving || []),
      ...(parsed.extra || []),
      ...(parsed.key_details || []),
      ...(parsed.hint || []),
      parsed.answer_main,
      parsed.answer_why_no_code,
      ...(parsed.answer_proof || []),
    ].join(" ")
  );

  if (seed.has_start_stop === false && /start stop|startstop/.test(textBlob)) {
    return "Scenario mentions start-stop on a vehicle that should not have it.";
  }

  if (seed.has_dpf === false && /\bdpf\b|regeneration|regeneracija/.test(textBlob)) {
    return "Scenario mentions DPF logic on a vehicle that should not have it.";
  }

  if (seed.timing_type === "belt" && /\btiming chain\b|lanac razvoda|chain stretch/.test(textBlob)) {
    return "Scenario mentions timing chain on a belt-driven engine.";
  }

  if (seed.timing_type === "chain" && /\btiming belt\b|zupcasti remen|remen razvoda/.test(textBlob)) {
    return "Scenario mentions timing belt on a chain-driven engine.";
  }

  if (seed.fuel_type === "diesel" && /\bspark plug\b|svjecica|svjećica|coil pack|bobina/.test(textBlob)) {
    return "Scenario uses petrol-only ignition logic on a diesel vehicle.";
  }

  if (seed.fuel_type === "petrol" && /\bglow plug\b|grijac|grijač|common rail pressure regulator/.test(textBlob)) {
    return "Scenario uses diesel-only logic on a petrol vehicle.";
  }

  return null;
}

function sanitizeScenario(parsed: ScenarioAIResponse, seed: ScenarioSeed, locale: SupportedLocale): ScenarioAIResponse {
  return {
    ...parsed,
    brand: seed.brand,
    vehicle: seed.vehicle,
    platform_type: seed.platform_type,
    category: seed.category,
    difficulty: seed.difficulty,
    root_cause_id: seed.root_cause_id,
    root_cause_label: seed.root_cause_label,
    year: seed.year ?? parsed.year,
    power_kw: seed.power_kw ?? parsed.power_kw,
    engine_code: seed.engine_code ?? parsed.engine_code,
    fuel_type: seed.fuel_type ?? parsed.fuel_type,
    induction: seed.induction ?? parsed.induction,
    timing_type: seed.timing_type ?? parsed.timing_type,
    has_start_stop:
      typeof seed.has_start_stop === "boolean" ? seed.has_start_stop : parsed.has_start_stop,
    has_dpf: typeof seed.has_dpf === "boolean" ? seed.has_dpf : parsed.has_dpf,
    emission_standard: seed.emission_standard ?? parsed.emission_standard,
    scoring_notes: {
      ...(parsed.scoring_notes || {}),
      difficulty: seed.difficulty,
      titleMustNotRevealAnswer: true,
      languageLocked: locale,
      year: seed.year ?? parsed.year ?? null,
      power_kw: seed.power_kw ?? parsed.power_kw ?? null,
    },
  };
}

async function generateValidScenario(
  openai: ReturnType<typeof getOpenAI>,
  model: string,
  seed: ScenarioSeed,
  locale: SupportedLocale
): Promise<{ parsed: ScenarioAIResponse; raw: string }> {
  let lastRaw = "";
  let lastReason = "Unknown generation error";

  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await openai.responses.create({
      model,
      input: buildPrompt(seed, locale),
    });

    const text = response.output_text || "";
    lastRaw = text;

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      lastReason = `Attempt ${attempt}: AI returned invalid JSON`;
      continue;
    }

    if (!validateScenario(parsed)) {
      lastReason = `Attempt ${attempt}: AI returned invalid scenario shape`;
      continue;
    }

    if (titleRevealsAnswer(parsed.title, parsed.root_cause_label, parsed.answer_main)) {
      lastReason = `Attempt ${attempt}: Title reveals the answer`;
      continue;
    }

    const technicalIssue = scenarioLooksTechnicallyWrong(parsed, seed);
    if (technicalIssue) {
      lastReason = `Attempt ${attempt}: ${technicalIssue}`;
      continue;
    }

    return {
      parsed: sanitizeScenario(parsed, seed, locale),
      raw: text,
    };
  }

  throw new Error(lastReason + (lastRaw ? " | Raw: " + lastRaw.slice(0, 500) : ""));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const openai = getOpenAI();
    const model = process.env.OPENAI_SCENARIO_MODEL || "gpt-5.4";
    const count = Math.min(50, Math.max(1, Number(req.query.count || 1)));
    const locale = getLocaleFromReq(req);

    const created: any[] = [];
    const existing: any[] = [];
    const failed: any[] = [];

    for (let i = 0; i < count; i++) {
      const seed = getRandomScenarioSeed();

      try {
        const { parsed } = await generateValidScenario(openai, model, seed, locale);

        const signature = makeScenarioSignature({
          brand: parsed.brand,
          vehicle: parsed.vehicle,
          rootCauseId: parsed.root_cause_id,
          difficulty: parsed.difficulty,
          title: parsed.title,
          locale,
        });

        const exists = await findScenarioBySignature(signature);

        if (exists) {
          existing.push({
            signature,
            vehicle: parsed.vehicle,
            root_cause_id: parsed.root_cause_id,
            title: parsed.title,
          });
          continue;
        }

        const inserted = await insertScenario({
          ...parsed,
          locale,
          language: locale,
          signature,
        });

        created.push(inserted);
      } catch (err: any) {
        failed.push({
          vehicle: seed.vehicle,
          root_cause_id: seed.root_cause_id,
          difficulty: seed.difficulty,
          error: err?.message || "error",
        });
      }
    }

    return res.status(200).json({
      ok: true,
      requested: count,
      locale,
      createdCount: created.length,
      existingCount: existing.length,
      failedCount: failed.length,
      created,
      existing,
      failed,
    });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error: error?.message || "Unknown error",
    });
  }
}