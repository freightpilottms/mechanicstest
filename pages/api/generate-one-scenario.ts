import type { NextApiRequest, NextApiResponse } from "next";
import { getOpenAI } from "../../lib/openai";
import { insertScenario, findScenarioBySignature } from "../../lib/scenario-storage";
import { makeScenarioSignature } from "../../lib/scenario-signature";
import { getRandomScenarioSeed, type ScenarioSeed } from "../../lib/scenario-seeds";

type SupportedLocale = "en" | "bs";

type AIResponse = {
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

function normalizeText(value: string) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueStrings(items: string[]) {
  return [...new Set(items.map((x) => String(x || "").trim()).filter(Boolean))];
}

function validateScenario(data: any): data is AIResponse {
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
    (data.year === undefined || typeof data.year === "number") &&
    (data.power_kw === undefined || typeof data.power_kw === "number") &&
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

function buildVehicleMeta(seed: ScenarioSeed) {
  const s = seed as any;
  return {
    year: typeof s.year === "number" ? s.year : undefined,
    power_kw: typeof s.power_kw === "number" ? s.power_kw : undefined,
    engine_code: typeof s.engine_code === "string" ? s.engine_code : undefined,
    fuel_type: typeof s.fuel_type === "string" ? s.fuel_type : undefined,
    induction: typeof s.induction === "string" ? s.induction : undefined,
    timing_type: typeof s.timing_type === "string" ? s.timing_type : undefined,
    has_start_stop: typeof s.has_start_stop === "boolean" ? s.has_start_stop : undefined,
    has_dpf: typeof s.has_dpf === "boolean" ? s.has_dpf : undefined,
    emission_standard: typeof s.emission_standard === "string" ? s.emission_standard : undefined,
  };
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
`;
}

function buildPrompt(seed: ScenarioSeed, locale: SupportedLocale, attempt = 1) {
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
  const meta = buildVehicleMeta(seed);

  const vehicleMetaBlock = `
VEHICLE EXACT SPECIFICATION:
- vehicle: ${seed.vehicle}
- year: ${meta.year ?? "unknown"}
- power_kw: ${meta.power_kw ?? "unknown"}
- engine_code: ${meta.engine_code ?? "unknown"}
- fuel_type: ${meta.fuel_type ?? "unknown"}
- induction: ${meta.induction ?? "unknown"}
- timing_type: ${meta.timing_type ?? "unknown"}
- has_start_stop: ${meta.has_start_stop ?? "unknown"}
- has_dpf: ${meta.has_dpf ?? "unknown"}
- emission_standard: ${meta.emission_standard ?? "unknown"}
`;

  const retryBlock =
    attempt > 1
      ? `
RETRY CORRECTION:
- Your previous output was rejected.
- Most likely reasons: title revealed the answer, unrealistic platform logic, or useless generic details.
- Fix those issues now.
- Be stricter and more realistic.
`
      : "";

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

${vehicleMetaBlock}

SCENARIO CONTEXT (MUST BE USED):
- Temperature condition: ${seed.context.temperature}
- Load condition: ${seed.context.load}
- Behavior pattern: ${seed.context.behavior}
- Failure timeline: ${seed.context.timeline}

STRICT RULES:
- Only automotive diagnostics
- Only one concrete root cause, exactly the one provided above
- Brand / vehicle / platform / category / root cause must stay compatible
- The failure MUST be mechanically possible for the exact engine/platform type
- Before generating, internally verify: "Is this fault realistically possible on this exact vehicle spec?"
- If not, do not improvise and do not force it; instead rewrite the scenario so it becomes realistic for this exact vehicle and exact root cause
- Never mention timing chain for a timing-belt engine unless that engine truly uses a chain
- Never mention timing belt for a timing-chain engine unless that engine truly uses a belt
- Never use diesel-only causes for petrol vehicles, and never use petrol-only causes for diesel vehicles
- If has_start_stop is false, never mention start-stop behavior or diagnosis
- If has_dpf is false, never build the complaint around DPF logic
- Do not state obvious background facts that add no diagnostic value
- Example of forbidden useless info: saying that a well-known engine uses a timing belt if that fact is not part of the diagnosis
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
  "year": ${meta.year ?? "null"},
  "power_kw": ${meta.power_kw ?? "null"},
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
- Remove useless details that do not help diagnosis
${retryBlock}
`;
}

function collectForbiddenTitlePhrases(data: AIResponse) {
  const raw = [
    data.root_cause_label,
    data.answer_main,
    ...data.accepted_answers,
    ...data.partial_answers,
  ]
    .flatMap((item) => normalizeText(item).split(" "))
    .filter(Boolean);

  const bannedSingles = [
    "sensor",
    "senzor",
    "injector",
    "dizna",
    "dizne",
    "pumpa",
    "pump",
    "turbo",
    "egr",
    "dpf",
    "alternator",
    "starter",
    "thermostat",
    "termostat",
    "bearing",
    "lezaj",
    "bearing",
    "injector",
    "radilice",
    "bregaste",
    "crankshaft",
    "camshaft",
    "fuel rail",
    "high pressure",
  ];

  return uniqueStrings([...raw, ...bannedSingles]).filter((term) => term.length >= 3);
}

function titleRevealsAnswer(data: AIResponse) {
  const title = normalizeText(data.title);
  if (!title) return true;

  const phrases = collectForbiddenTitlePhrases(data);

  for (const phrase of phrases) {
    if (!phrase) continue;
    if (title.includes(phrase)) return true;
  }

  return false;
}

function hasTooManyUselessDetails(data: AIResponse) {
  const joined = normalizeText([
    ...data.extra,
    ...data.key_details,
    ...data.hint,
  ].join(" | "));

  const suspicious = [
    "timing belt",
    "zupcasti remen",
    "remen razvoda",
    "timing chain",
    "lanac razvoda",
    "diesel engine",
    "benzinac",
    "dizel motor",
  ];

  let hits = 0;
  for (const s of suspicious) {
    if (joined.includes(normalizeText(s))) hits += 1;
  }

  return hits >= 2;
}

function sanitizeArrays(data: AIResponse): AIResponse {
  return {
    ...data,
    symptoms: uniqueStrings(data.symptoms),
    driving: uniqueStrings(data.driving),
    extra: uniqueStrings(data.extra),
    key_details: uniqueStrings(data.key_details),
    questions: uniqueStrings(data.questions),
    hint: uniqueStrings(data.hint),
    answer_proof: uniqueStrings(data.answer_proof),
    accepted_answers: uniqueStrings(data.accepted_answers),
    partial_answers: uniqueStrings(data.partial_answers),
  };
}

function scenarioMatchesSeed(data: AIResponse, seed: ScenarioSeed) {
  return (
    normalizeText(data.brand) === normalizeText(seed.brand) &&
    normalizeText(data.vehicle) === normalizeText(seed.vehicle) &&
    normalizeText(data.platform_type) === normalizeText(seed.platform_type) &&
    normalizeText(data.category) === normalizeText(seed.category) &&
    normalizeText(data.root_cause_id) === normalizeText(seed.root_cause_id) &&
    normalizeText(data.root_cause_label) === normalizeText(seed.root_cause_label) &&
    normalizeText(data.difficulty) === normalizeText(seed.difficulty)
  );
}

async function generateScenario(openai: any, model: string, seed: ScenarioSeed, locale: SupportedLocale) {
  let lastText = "";

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await openai.responses.create({
      model,
      reasoning: { effort: attempt === 1 ? "low" : "medium" },
      input: buildPrompt(seed, locale, attempt),
    });

    const text = response.output_text;
    lastText = text;

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      continue;
    }

    if (!validateScenario(parsed)) continue;

    const clean = sanitizeArrays(parsed);

    if (!scenarioMatchesSeed(clean, seed)) continue;
    if (titleRevealsAnswer(clean)) continue;
    if (hasTooManyUselessDetails(clean)) continue;

    return clean;
  }

  throw new Error(`Scenario generation failed validation after 3 attempts. Last raw output: ${lastText}`);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const openai = getOpenAI();
    const model = process.env.OPENAI_SCENARIO_MODEL || "gpt-5.4";
    const seed = getRandomScenarioSeed();
    const locale = getLocaleFromReq(req);

    const parsed = await generateScenario(openai, model, seed, locale);

    const signature = makeScenarioSignature({
      brand: parsed.brand,
      vehicle: parsed.vehicle,
      rootCauseId: parsed.root_cause_id,
      difficulty: parsed.difficulty,
      title: parsed.title,
      locale,
    });

    const existing = await findScenarioBySignature(signature);

    if (existing) {
      return res.status(200).json({
        ok: true,
        message: "Scenario already exists",
        existing,
        signature,
        seed,
      });
    }

    const inserted = await insertScenario({
      ...parsed,
      locale,
      language: locale,
      signature,
    });

    return res.status(200).json({
      ok: true,
      inserted,
      signature,
      seed,
      model,
    });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error: error?.message || "Unknown error",
    });
  }
}
