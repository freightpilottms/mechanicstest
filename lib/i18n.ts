export const translations = {
  bs: {
    rank: "Rank",
    recognized: "Prepoznato",
    mostLikelyCause: "Najvjerovatniji uzrok",
    bonus: "Bonus",
    diagnosis: "Blizina dijagnoze",

    ranks: {
      correct: "Master Mechanic",
      very_close: "Advanced Mechanic",
      partial: "Intermediate Mechanic",
      weak: "Beginner",
      wrong: "Incorrect",
    },
  },

  en: {
    rank: "Rank",
    recognized: "Recognized",
    mostLikelyCause: "Most likely cause",
    bonus: "Bonus",
    diagnosis: "Diagnosis",

    ranks: {
      correct: "Master Mechanic",
      very_close: "Advanced Mechanic",
      partial: "Intermediate Mechanic",
      weak: "Beginner",
      wrong: "Incorrect",
    },
  },
};

export function t(lang: "bs" | "en", key: string) {
  const parts = key.split(".");
  let value: any = translations[lang];

  for (const p of parts) {
    value = value?.[p];
  }

  return value || key;
}