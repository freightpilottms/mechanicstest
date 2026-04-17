export function makeScenarioSignature(input: {
    brand: string;
    vehicle: string;
    rootCauseId: string;
    difficulty: string;
    title: string;
  }) {
    return [
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