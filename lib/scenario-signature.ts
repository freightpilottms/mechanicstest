export function makeScenarioSignature(input: {
  brand: string;
  vehicle: string;
  rootCauseId: string;
  difficulty: string;
  title: string;
  locale?: string;
}) {
  return [
    input.locale || "en",
    input.brand,
    input.vehicle,
    input.rootCauseId,
    input.difficulty,
    input.title,
  ]
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildScenarioFingerprint(input: {
  locale?: string;
  brand?: string;
  vehicle?: string;
  rootCauseId?: string;
  symptoms?: string[];
  questions?: string[];
  answerMain?: string;
}) {
  const normalize = (value: unknown) =>
    String(value || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const firstSymptoms = Array.isArray(input.symptoms)
    ? input.symptoms.slice(0, 3).map(normalize).join("|")
    : "";

  const firstQuestion = Array.isArray(input.questions)
    ? normalize(input.questions[0] || "")
    : "";

  const answerMain = normalize(input.answerMain || "");

  return [
    normalize(input.locale || "en"),
    normalize(input.brand || ""),
    normalize(input.vehicle || ""),
    normalize(input.rootCauseId || ""),
    firstSymptoms,
    firstQuestion,
    answerMain,
  ]
    .filter(Boolean)
    .join("::");
}
