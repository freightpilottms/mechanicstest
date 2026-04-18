export type Difficulty = "easy" | "medium" | "hard";
export type GameMode = "all" | "eu" | "us" | "asia";

export type ScenarioAnswers = {
  main: string;
  whyNoCode: string;
  proof: string[];
};

export type ScenarioScoring = {
  mainDirectionKeywords: string[];
  partialDirectionKeywords: string[];
  exactComponentKeywords: string[];
  reasoningKeywords: string[];
};

export type MockQuestion = {
  id: number;
  mode: GameMode;
  difficulty: Difficulty;
  levelLabel: string;
  title: string;
  vehicle: string;
  symptoms: string[];
  driving: string[];
  extra: string[];
  keyDetails: string[];
  questions: string[];
  hint: string[];
  answers: ScenarioAnswers;
  scoring: ScenarioScoring;
};

export const TIME_LIMITS: Record<Difficulty, number> = {
  easy: 180,
  medium: 180,
  hard: 180,
};

export const DIFFICULTY_LABELS = {
  easy: { en: "Easy", bs: "Lako" },
  medium: { en: "Medium", bs: "Srednje" },
  hard: { en: "Hard", bs: "Teško" },
} as const;

export const mockQuestions: MockQuestion[] = [
  {
    id: 1,
    mode: "eu",
    difficulty: "hard",
    levelLabel: "Advanced",
    title: "POWER LOSS (TRICKY)",
    vehicle: "BMW F10 520d",
    symptoms: [
      "Auto pali normalno",
      "Na leru radi perfektno",
      "Nema lampica",
      "Nema dima",
    ],
    driving: [
      "Do ~2200 rpm ide OK",
      "Preko toga kao da udari u zid",
      "Ne ubrzava dalje kako treba",
      "Nema trzanja",
      "Osjećaj kao da je motor zagušen",
    ],
    extra: [
      "Turbo se čuje",
      "Nema limp mode",
      "Dijagnostika čista",
    ],
    keyDetails: [
      "MAF očitanja su normalna",
      "Boost pressure je blizu traženog",
      "Auto i dalje nema snage",
    ],
    questions: [
      "Najvjerovatniji uzrok (1 konkretna stvar)",
      "Zašto ECU ne baca grešku",
      "Kako bi to dokazao u praksi",
    ],
    hint: [
      "Nije vakum",
      "Nije turbo",
      "Nije gorivo direktno",
      "Nešto guši motor, ali svi senzori izgledaju OK",
    ],
    answers: {
      main: "DPF djelimično začepljen / previsok backpressure",
      whyNoCode:
        "Vrijednosti mogu ostati unutar tolerancije pa ECU ne vidi kvar kao hard fault, ali pod opterećenjem izduv već guši motor.",
      proof: [
        "Očitati diferencijalni pritisak DPF-a",
        "Gledati backpressure pod opterećenjem",
        "Provjeriti soot/ash load",
        "Test vožnja uz live data",
      ],
    },
    scoring: {
      mainDirectionKeywords: ["dpf", "backpressure", "zacepljen izduv", "začepljen izduv", "gusenje izduva", "gušenje izduva"],
      partialDirectionKeywords: ["izduv", "auspuh", "restriction", "gusi motor", "guši motor", "ne dise", "ne diše"],
      exactComponentKeywords: ["dpf", "filter cestica", "filter čestica"],
      reasoningKeywords: ["toleranc", "live data", "diferencijalni pritisak", "pressure drop", "opterecen", "opterećen"],
    },
  },
  {
    id: 2,
    mode: "eu",
    difficulty: "hard",
    levelLabel: "Advanced",
    title: "WARM START NO START",
    vehicle: "Audi A4 B8 2.0 TDI",
    symptoms: [
      "Vergla normalno",
      "Akumulator dobar",
      "Ponekad upali iz prve",
      "Kad upali radi sasvim uredno",
    ],
    driving: [
      "Kad jednom upali, auto vuče normalno",
      "Nema dima",
      "Nema trzanja",
      "Ne gubi snagu u vožnji",
    ],
    extra: [
      "Problem se češće javlja na toplom motoru",
      "Nema stalne greške",
      "Gorivo i filter djeluju uredno",
    ],
    keyDetails: [
      "Rail pressure pri verglanju nekad ostane prenizak za paljenje",
      "Kad motor upali, pressure poslije bude normalan",
      "Kvar je vezan baš za fazu startovanja",
    ],
    questions: [
      "Najvjerovatniji uzrok (1 konkretna stvar)",
      "Zašto dijagnostika često ostane skoro prazna",
      "Kako bi to dokazao u praksi",
    ],
    hint: [
      "Nije anlaser",
      "Nije akumulator",
      "Nije klasično 'nema goriva uopšte'",
      "Problem je u regulaciji pritiska pri startu",
    ],
    answers: {
      main: "SCV / regulator količine na visokotlačnoj pumpi koji na toplom ne dozira kako treba",
      whyNoCode:
        "Pritisak samo povremeno ostane ispod praga za paljenje i ne traje dovoljno dugo da ECU uvijek zapiše jasan fault code.",
      proof: [
        "Uporediti traženi i stvarni rail pressure pri verglanju toplog motora",
        "Probati hladan vs topao start live data",
        "Testirati regulator / zamjena probnim ispravnim dijelom",
      ],
    },
    scoring: {
      mainDirectionKeywords: ["scv", "regulator kolicine", "regulator količine", "metering valve", "regulator na pumpi", "ventil na pumpi"],
      partialDirectionKeywords: ["rail pressure", "pritisak goriva", "visokotlacna pumpa", "visokotlačna pumpa", "regulacija pritiska"],
      exactComponentKeywords: ["scv", "suction control valve", "regulator kolicine", "regulator količine"],
      reasoningKeywords: ["topao", "verglanj", "live data", "trazeni", "traženi", "stvarni pressure"],
    },
  },
  {
    id: 3,
    mode: "eu",
    difficulty: "medium",
    levelLabel: "Intermediate",
    title: "JERK AT CONSTANT SPEED",
    vehicle: "VW Passat B7 2.0 TDI",
    symptoms: [
      "Na leru radi mirno",
      "Kod lagane vožnje na konstantnom gasu auto blago cuka",
      "Kod jačeg gasa simptom skoro nestane",
      "Nema lampica niti dima",
    ],
    driving: [
      "Najizraženije oko 80–100 km/h",
      "Pod opterećenjem vuče korektno",
      "Nema limp moda",
    ],
    extra: [
      "Problem je stabilan i ponovljiv",
      "Nema velikih odstupanja rail pressure",
      "Filter goriva je nov",
    ],
    keyDetails: [
      "Simptom je najgori kad EGR radi u part-load režimu",
      "Kod punog gasa problem slabi",
      "Dijagnostika ne prijavljuje očit kvar",
    ],
    questions: [
      "Najvjerovatniji uzrok",
      "Zašto ECU često ne prijavi grešku",
      "Kako bi potvrdio kvar",
    ],
    hint: [
      "Nije klasična dizna",
      "Nije zamajac",
      "Gledaj šta je aktivno baš pri laganom opterećenju",
    ],
    answers: {
      main: "EGR ventil koji zapinje ili pogrešno dozira pri djelimičnom opterećenju",
      whyNoCode:
        "Ventil može još raditi unutar granične tolerancije i praviti samo lošu mješavinu u uskom radnom području bez jasnog DTC-a.",
      proof: [
        "Posmatrati commanded vs actual EGR",
        "Probna vožnja sa privremeno isključenim / blokiranim EGR testom",
        "Provjera zaprljanosti i mehaničkog zapinjanja",
      ],
    },
    scoring: {
      mainDirectionKeywords: ["egr", "egr ventil", "recirkulacija"],
      partialDirectionKeywords: ["zrak", "mjesavina", "mešavina", "usis", "part load"],
      exactComponentKeywords: ["egr", "egr ventil"],
      reasoningKeywords: ["lagano opterecenje", "lagano opterećenje", "constant speed", "commanded", "actual"],
    },
  },
  {
    id: 4,
    mode: "eu",
    difficulty: "easy",
    levelLabel: "Easy",
    title: "DPF LIGHT AFTER CITY DRIVE",
    vehicle: "VW Golf 6 1.6 TDI",
    symptoms: [
      "Auto ima normalnu snagu",
      "Nakon 10–15 minuta gradske vožnje pali se DPF lampica",
      "Ventilator često radi",
      "Potrošnja je malo veća",
    ],
    driving: [
      "Na otvorenoj cesti zna biti bolje",
      "Nema velikog dima",
      "Nema izraženog gubitka snage",
    ],
    extra: [
      "Auto se većinom vozi kratke relacije",
      "Regeneracije su vjerovatno prekidane",
      "Nema drugih ozbiljnih grešaka",
    ],
    keyDetails: [
      "Problem je vezan za stil vožnje i uslove regeneracije",
      "Lampica dolazi nakon kraćih gradskih vožnji",
      "Auto još nije u teškom limp modu",
    ],
    questions: [
      "Najvjerovatniji uzrok",
      "Zašto ECU ne baca odmah veliki kvar",
      "Kako bi potvrdio stanje",
    ],
    hint: [
      "Nije turbo",
      "Nije MAF",
      "Gledaj regeneraciju i soot load",
    ],
    answers: {
      main: "DPF zapunjen čađi zbog prekinutih / neuspjelih regeneracija",
      whyNoCode:
        "Sistem još vidi stanje kao servisno upozorenje i pokušava regeneraciju prije nego pređe u teži fault.",
      proof: [
        "Provjeriti soot load i history regeneracija",
        "Očitati diferencijalni pritisak DPF-a",
        "Napraviti kontrolisanu prisilnu ili uslovnu regeneraciju ako parametri dozvoljavaju",
      ],
    },
    scoring: {
      mainDirectionKeywords: ["dpf", "regeneracij", "cadj", "čađ"],
      partialDirectionKeywords: ["izduv", "kratke relacije", "filter"],
      exactComponentKeywords: ["dpf"],
      reasoningKeywords: ["soot", "diferencijalni pritisak", "regeneracij", "gradska voznja", "gradska vožnja"],
    },
  },
  {
    id: 5,
    mode: "eu",
    difficulty: "medium",
    levelLabel: "Intermediate",
    title: "TEMPERATURE DROPS DOWNHILL",
    vehicle: "Audi Q5 2.0 TDI",
    symptoms: [
      "Motor dostigne 90°C u gradu",
      "Uzbrdo ostaje blizu 90°C",
      "Nizbrdo temperatura primjetno pada",
      "Grijanje kabine radi",
    ],
    driving: [
      "Na laganom opterećenju teže održava temperaturu",
      "Pod većim opterećenjem se vrati gore",
      "Nema lampica",
    ],
    extra: [
      "Nema curenja rashladne tečnosti",
      "Ventilator se ne ponaša nenormalno",
      "Problem je konstantan duže vrijeme",
    ],
    keyDetails: [
      "Motor se previše hladi kad nema opterećenja",
      "Simptom je tipičan za prevelik protok rashladne tečnosti",
      "Nije problem očitanja na tabli nego stvarne temperature",
    ],
    questions: [
      "Najvjerovatniji uzrok",
      "Zašto ECU ne javlja grešku",
      "Kako bi to dokazao",
    ],
    hint: [
      "Nije pumpa vode",
      "Nije senzor kao glavni uzrok",
      "Gledaj regulaciju temperature motora",
    ],
    answers: {
      main: "Termostat zaglavljen djelimično otvoren",
      whyNoCode:
        "Motor ipak postiže radnu temperaturu u određenim uslovima pa ECU to ne vidi kao jasan električni kvar komponente.",
      proof: [
        "Pratiti realnu temperaturu rashladne tečnosti u vožnji",
        "Uporediti ponašanje gornjeg crijeva i temperature pri hladnom startu",
        "Provjeriti da li veliki krug prerano otvara",
      ],
    },
    scoring: {
      mainDirectionKeywords: ["termostat", "otvoren termostat"],
      partialDirectionKeywords: ["hladjenje", "hlađenje", "rashladna", "prehladjuje", "prehlađuje"],
      exactComponentKeywords: ["termostat"],
      reasoningKeywords: ["nizbrdo", "bez opterecenja", "bez opterećenja", "veliki krug", "realna temperatura"],
    },
  },
  {
    id: 6,
    mode: "eu",
    difficulty: "medium",
    levelLabel: "Intermediate",
    title: "COLD START RATTLE",
    vehicle: "Audi A6 3.0 TDI",
    symptoms: [
      "Na hladan start se čuje zveket par sekundi",
      "Kad se digne uljni pritisak, zvuk nestane",
      "Topao start je dosta tiši",
      "Nema lampica",
    ],
    driving: [
      "U vožnji motor radi uredno",
      "Nema posebnog pada snage",
      "Nema stalne buke nakon starta",
    ],
    extra: [
      "Problem je izraženiji nakon stajanja preko noći",
      "Zvuk dolazi iz zadnjeg dijela motora",
      "Uljni servis ne rješava simptom",
    ],
    keyDetails: [
      "Zvuk je kratak i vezan za prvi trenutak podmazivanja",
      "Tipično za zatezač / lanac koji ostane bez napona",
      "Nije klasičan donji kraj motora",
    ],
    questions: [
      "Najvjerovatniji uzrok",
      "Zašto ECU ne prijavljuje grešku",
      "Kako potvrditi sumnju",
    ],
    hint: [
      "Nije remen agregata",
      "Gledaj razvod i zatezanje",
      "Bitan je momenat neposredno nakon paljenja",
    ],
    answers: {
      main: "Istrošen lanac / hidraulični zatezač lanca razvoda",
      whyNoCode:
        "Mehanički problem može praviti buku prije nego što odstupanje faze postane dovoljno veliko za korelacionu grešku senzora.",
      proof: [
        "Slušati hladan start i lokaciju zvuka",
        "Provjeriti adaptacije / korelaciju faze ako su dostupne",
        "Mehanička inspekcija razvoda po proceduri",
      ],
    },
    scoring: {
      mainDirectionKeywords: ["lanac", "zatezac", "zatezač", "razvod"],
      partialDirectionKeywords: ["timing", "faza", "mehanicki zvuk", "mehanički zvuk"],
      exactComponentKeywords: ["lanac", "zatezac", "zatezač"],
      reasoningKeywords: ["hladan start", "uljni pritisak", "korelacija", "faza"],
    },
  },
  {
    id: 7,
    mode: "eu",
    difficulty: "easy",
    levelLabel: "Easy",
    title: "WEAK THROTTLE RESPONSE",
    vehicle: "VW Golf 6 1.6 TDI",
    symptoms: [
      "Auto pali i radi normalno",
      "Odaziv na gas djeluje tromo stalno",
      "Nema dima",
      "Nema limp mode",
    ],
    driving: [
      "Tromost je stalna, ne samo povremena",
      "Potrošnja je približno normalna",
      "Auto nije potpuno bez snage, samo lijen",
    ],
    extra: [
      "Dijagnostika ne izbacuje ništa bitno",
      "Turbo sistem djeluje uredno",
      "Nema izrazitog mehaničkog zvuka",
    ],
    keyDetails: [
      "Problem je više u odazivu nego u maksimalnoj snazi",
      "Često se osjeti kao zadržavanje izduvnih gasova ili loš protok usisa",
      "Nije nužno veliki kvar",
    ],
    questions: [
      "Najvjerovatniji uzrok",
      "Zašto nema greške",
      "Kako potvrditi",
    ],
    hint: [
      "Nije nužno turbo",
      "Gledaj dio koji upravlja protokom svježeg zraka / miješanjem zraka",
      "Kod ovih motora zna praviti 'trom' osjećaj bez lampice",
    ],
    answers: {
      main: "EGR ili usisna zaklopka / throttle flap koja ostaje djelimično otvorena-zatvorena i kvari odziv",
      whyNoCode:
        "Komponenta još funkcioniše dovoljno blizu zadatih vrijednosti pa nema jasan električni fault, ali odziv motora trpi.",
      proof: [
        "Gledati commanded vs actual položaj EGR / throttle flap",
        "Aktivacioni test komponente",
        "Vizuelna provjera zaprljanosti i mehaničkog zapinjanja",
      ],
    },
    scoring: {
      mainDirectionKeywords: ["egr", "throttle flap", "zaklopka", "usisna zaklopka"],
      partialDirectionKeywords: ["usis", "zrak", "odaziv", "protok zraka", "protok vazduha"],
      exactComponentKeywords: ["egr", "throttle flap", "zaklopka"],
      reasoningKeywords: ["commanded", "actual", "aktivacioni test", "zapinjanje"],
    },
  },
  {
    id: 8,
    mode: "eu",
    difficulty: "easy",
    levelLabel: "Easy",
    title: "LOW OIL LEVEL QUESTION",
    vehicle: "Audi A4 B8",
    symptoms: [
      "Digitalni pokazivač ulja je između MIN i MAX",
      "Nema uljne lampice",
      "Vlasnik pita da li mora odmah doliti",
    ],
    driving: [
      "Motor radi normalno",
      "Nema posebnih simptoma u vožnji",
      "Pitanje je više preventivno nego kvar",
    ],
    extra: [
      "Nema vidljivih curenja",
      "Vlasnik želi sigurnu preporuku",
      "Nije prijavljen nizak pritisak ulja",
    ],
    keyDetails: [
      "Pokazivač nije na minimumu nego unutar dozvoljenog raspona",
      "To nije isto što i warning stanje",
      "Bitno je razlikovati servisni savjet od kvara",
    ],
    questions: [
      "Najtačniji odgovor kupcu",
      "Zašto ECU ne javlja grešku",
      "Kako bi savjetovao provjeru",
    ],
    hint: [
      "Nije kvar sam po sebi",
      "Gledaj šta znači MIN-MAX raspon",
      "Bitna je preporuka, ne samo dijagnoza",
    ],
    answers: {
      main: "Nivo je još u dozvoljenom rasponu; ne mora hitno dolijevati ako je između MIN i MAX, ali treba pratiti i po potrebi dopuniti odgovarajuće ulje.",
      whyNoCode:
        "Sistem javlja upozorenje tek kad nivo padne ispod praga, a ovdje je još u normalnom rasponu.",
      proof: [
        "Ponoviti mjerenje po pravilnoj proceduri na ravnom",
        "Potvrditi specifikaciju ulja prije dolijevanja",
        "Pratiti trend potrošnje ulja kroz vrijeme",
      ],
    },
    scoring: {
      mainDirectionKeywords: ["izmedju min i max", "između min i max", "ne mora odmah", "u granici", "normalno"],
      partialDirectionKeywords: ["ulje", "pracenje", "praćenje", "dopuniti po potrebi"],
      exactComponentKeywords: ["min", "max", "odgovarajuce ulje", "odgovarajuće ulje"],
      reasoningKeywords: ["procedura", "ravno", "specifikacija", "trend"],
    },
  },
  {
    id: 9,
    mode: "eu",
    difficulty: "hard",
    levelLabel: "Advanced",
    title: "VIBRATION UNDER ACCELERATION",
    vehicle: "Audi A6 C7 3.0 TDI Quattro",
    symptoms: [
      "Volan trese pod ubrzanjem",
      "Mjenjač / ručica takođe vibrira",
      "Na leru je uglavnom mirno",
      "Nema lampica",
    ],
    driving: [
      "Najizraženije pri jačem gasu",
      "Kad pustiš gas vibracija slabi",
      "Nije tipično samo pri jednoj brzini kao balans točka",
    ],
    extra: [
      "Motor sam po sebi radi fino",
      "Nema promašaja paljenja",
      "Problem se prenosi kroz pogon",
    ],
    keyDetails: [
      "Simptom je opterećenjski, ne ler problem",
      "Vibracija se osjeti kroz kompletan drivetrain",
      "Tipično za homokinetiku / kardanski sklop pod momentom",
    ],
    questions: [
      "Najvjerovatniji uzrok",
      "Zašto ECU ne vidi grešku",
      "Kako bi dokazao kvar",
    ],
    hint: [
      "Nije dizna",
      "Nije turbo",
      "Gledaj mehanički pogon pod opterećenjem",
    ],
    answers: {
      main: "Unutrašnji homokinetički zglob / poluosovina ili kardanski zglob koji vibrira pod opterećenjem",
      whyNoCode:
        "To je mehanički problem pogona bez elektronskog nadzora, pa ECU nema šta prijaviti dok nema pratećeg senzorskog odstupanja.",
      proof: [
        "Probna vožnja pod opterećenjem i rasterećenjem",
        "Pregled lufta i zazora poluosovina / zglobova",
        "Provjera da li se vibracija mijenja po strani ili podizanjem vozila",
      ],
    },
    scoring: {
      mainDirectionKeywords: ["poluosovina", "homokineticki", "homokinetički", "kardan", "zglob pogona"],
      partialDirectionKeywords: ["drivetrain", "pogon", "vibracija pod opterecenjem", "vibracija pod opterećenjem"],
      exactComponentKeywords: ["unutrasnji homokineticki", "unutrašnji homokinetički", "poluosovina", "kardan"],
      reasoningKeywords: ["opterecenje", "opterećenje", "rasterecenje", "rasterećenje", "luft"],
    },
  },
  {
    id: 10,
    mode: "eu",
    difficulty: "medium",
    levelLabel: "Intermediate",
    title: "OIL CONSUMPTION WITHOUT VISIBLE SMOKE",
    vehicle: "Audi A5 1.8 TFSI",
    symptoms: [
      "Motor radi uredno",
      "Vlasnik redovno dolijeva ulje",
      "Nema vidljivih curenja",
      "Nema plavog dima u normalnoj vožnji",
    ],
    driving: [
      "Snaga je uglavnom normalna",
      "Problem je dugotrajan i progresivan",
      "Nije vezan samo za jedan režim vožnje",
    ],
    extra: [
      "Poznat problem na ovom motoru",
      "PCV može biti provjeren, ali često nije glavni uzrok",
      "Vlasnik traži pravi razlog, ne samo sipanje ulja",
    ],
    keyDetails: [
      "Ulje nestaje bez vanjskog curenja",
      "Nema nužno velikog dima jer se ulje sagorijeva postepeno",
      "Tipično za konstrukcijski problem klipova / karika",
    ],
    questions: [
      "Najvjerovatniji uzrok",
      "Zašto ECU ne baca grešku",
      "Kako bi potvrdio sumnju",
    ],
    hint: [
      "Nije samo semering turbine",
      "Nije nužno odmah PCV",
      "Poznata boljka ovog motora",
    ],
    answers: {
      main: "Istrošene / problematične uljne karike i klipna grupa na 1.8 TFSI",
      whyNoCode:
        "ECU ne mjeri direktno potrošnju ulja pa bez sekundarnog senzorskog problema nema jasan DTC.",
      proof: [
        "Praćenje stvarne potrošnje ulja kroz kilometražu",
        "Compression / leak-down test po potrebi",
        "Provjera PCV-a kao isključenje, ali fokus na klipnu grupu",
      ],
    },
    scoring: {
      mainDirectionKeywords: ["karike", "klipovi", "klipna grupa", "piston rings"],
      partialDirectionKeywords: ["trosi ulje", "troši ulje", "unutrasnje sagorijevanje ulja", "unutrašnje sagorijevanje ulja"],
      exactComponentKeywords: ["karike", "uljne karike", "klipovi"],
      reasoningKeywords: ["compression", "leak down", "pcv", "potrosnja ulja", "potrošnja ulja"],
    },
  },
];

export function getQuestionsForMode(mode: string) {
  if (mode === "all") return mockQuestions;

  const filtered = mockQuestions.filter((question) => question.mode === mode);
  return filtered.length ? filtered : mockQuestions;
}
