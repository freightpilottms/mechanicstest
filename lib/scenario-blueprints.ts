import type { ScenarioSeed } from "@/lib/scenario-seeds";

export type ScenarioBlueprint = {
  family: string;
  workshopFocus: string;
  customerComplaint: string[];
  roadTest: string[];
  keyClues: string[];
  proofSteps: string[];
  dtcGuidance: string;
  acceptedBosnianSlang: string[];
  closeButIncomplete: string[];
  neverMixWith: string[];
};

type ScenarioLike = {
  title?: string;
  symptoms?: string[];
  driving?: string[];
  extra?: string[];
  key_details?: string[];
  hint?: string[];
  answer_main?: string;
  answer_why_no_code?: string;
  answer_proof?: string[];
};

const BLUEPRINTS: Record<string, ScenarioBlueprint> = {
  boost_leak_charge_pipe_microcrack: {
    family: "boost_intake",
    workshopFocus: "Turbo motor izgubi snagu samo kad traži boost; ler i lagana vožnja mogu biti uredni.",
    customerComplaint: [
      "Auto normalno pali i vozi lagano, ali pri jačem gasu nema onaj potisak.",
      "Mušterija čuje blago šištanje pod gasom ili kaže da auto ne vuče na preticanju.",
    ],
    roadTest: [
      "Simptom se ponavlja pod boostom, posebno uzbrdo ili pri preticanju.",
      "Kad se gas pusti, auto se smiri i ne ponaša se kao kvar točka ili ovjesa.",
    ],
    keyClues: [
      "Traženi boost i stvarni boost se razilaze pod opterećenjem.",
      "Mogući su masni tragovi oko crijeva interkulera ili charge pipea.",
      "MAF/MAP podaci imaju smisla tek u vožnji, ne na leru.",
    ],
    proofSteps: [
      "Smoke test usisa/interkulera.",
      "Log traženog i stvarnog boosta u trećoj ili četvrtoj brzini.",
      "Vizuelno savijati i pregledati crijeva pod pritiskom.",
    ],
    dtcGuidance: "Može biti P0299 ili samo trag u live data; kod ne smije sam otkriti kvar.",
    acceptedBosnianSlang: ["puklo crijevo interkulera", "pušta boost", "crijevo turbine", "boost curi", "charge pipe"],
    closeButIncomplete: ["slab boost", "problem oko turbine", "usis pušta", "interkuler sistem"],
    neverMixWith: ["udarac u rupu", "motanje volana", "ležaj točka", "zveckanje u točku", "sipanje goriva"],
  },
  intercooler_hose_split_under_boost: {
    family: "boost_intake",
    workshopFocus: "Crijevo interkulera se otvara tek pod pritiskom, pa auto gubi snagu kad turbo napuni.",
    customerComplaint: [
      "Na laganom gasu je skoro normalan, ali kad turbo krene puniti auto odjednom oslabi.",
      "Čuje se šištanje ili puhanje iz prednjeg dijela auta pod jačim gasom.",
    ],
    roadTest: [
      "Problem se ne vezuje za brzinu točkova nego za opterećenje motora.",
      "Najlakše se uhvati uzbrdo ili u preticanju.",
    ],
    keyClues: [
      "Stvarni pritisak turbine kasni za traženim.",
      "Oko crijeva može biti uljnog filma.",
      "Nema potrebe spominjati rupe, ovjes ili volan.",
    ],
    proofSteps: ["Smoke test", "Pressure test usisa", "Live data boost requested/actual", "Vizuelni pregled crijeva"],
    dtcGuidance: "Može imati underboost kod ili samo slab boost u live data.",
    acceptedBosnianSlang: ["crijevo interkulera", "puklo crijevo", "pušta pritisak turbine", "boost leak", "pušta boost"],
    closeButIncomplete: ["problem turbine", "slab pritisak turbine", "usis pušta"],
    neverMixWith: ["udarac u rupu", "zveckanje", "ležaj", "kugla", "selen", "sipanje goriva"],
  },
  vacuum_control_leak_turbo: {
    family: "boost_intake",
    workshopFocus: "Vakum ne povuče geometriju/wastegate kako treba, pa turbo kasni ili ne puni pod opterećenjem.",
    customerComplaint: [
      "Auto je trom na srednjem gasu i nekad tek kasnije povuče.",
      "Problem se osjeti uzbrdo ili kad se traži jače ubrzanje.",
    ],
    roadTest: [
      "Ler je miran, a simptom se vidi tek kad se traži pritisak turbine.",
      "Može biti povremeno, posebno kad su crijeva topla i mekša.",
    ],
    keyClues: [
      "Vakum na aktuatoru nije stabilan.",
      "Traženi boost i stvarni boost se ne poklope u trenutku opterećenja.",
      "Nema mehaničkog lupanja ovjesa niti veze s rupama.",
    ],
    proofSteps: ["Mjeriti vakum ručnom pumpom", "Provjeriti vakum crijeva i elektroventil", "Log boosta u vožnji"],
    dtcGuidance: "Može baciti underboost/overboost, ali često je samo loš odziv u live data.",
    acceptedBosnianSlang: ["vakum crijevo", "pušta vakum", "vakum turbine", "ventil vakuma", "aktuator turbine"],
    closeButIncomplete: ["turbina ne puni", "problem oko turbine", "slab boost"],
    neverMixWith: ["udarac u rupu", "točak", "motanje", "ležaj", "sipanje goriva"],
  },
  dpf_partial_restriction: {
    family: "dpf_exhaust",
    workshopFocus: "Izduv je zagušen pod opterećenjem; motor pali i radi fino, ali ne diše kad treba protok.",
    customerComplaint: [
      "Auto radi mirno, ali na jačem gasu kao da se zaguši i neće da nastavi vući.",
      "Mušterija kaže da auto ide normalno do jedne mjere, pa kao da udari u zid.",
    ],
    roadTest: [
      "Najizraženije je pod opterećenjem, uzbrdo ili na višim obrtajima.",
      "Nema veze s rupama, volanom ili brzinom točkova.",
    ],
    keyClues: [
      "Diferencijalni pritisak DPF-a raste previše pod gasom.",
      "Soot/ash load ili istorija regeneracija daju kontekst.",
      "Boost može izgledati skoro normalno, ali motor ne izbacuje izduv kako treba.",
    ],
    proofSteps: ["Mjeriti diferencijalni pritisak DPF-a", "Log pod opterećenjem", "Provjeriti soot/ash load", "Provjeriti uslove regeneracije"],
    dtcGuidance: "Može biti bez aktivnog koda, DPF lampica ili kod diferencijalnog pritiska, zavisno od faze.",
    acceptedBosnianSlang: ["začepljen dpf", "dpf štopa", "izduv zagušen", "povratni pritisak", "auspuh ga guši"],
    closeButIncomplete: ["problem izduva", "dpf problem", "nešto ga guši", "slab protok izduva"],
    neverMixWith: ["udarac u rupu", "zveckanje u točku", "motanje volana", "ležaj", "kugla"],
  },
  dpf_diff_pressure_sensor_offset: {
    family: "dpf_exhaust",
    workshopFocus: "Senzor diferencijalnog pritiska laže ili ima offset, pa DPF logika ide pogrešnim putem.",
    customerComplaint: [
      "Pali se DPF upozorenje, ali auto se ne ponaša uvijek kao stvarno začepljen.",
      "Regeneracije se čudno ponašaju ili se ponavljaju bez jasnog razloga.",
    ],
    roadTest: [
      "Na leru ili ugašenom motoru senzor može pokazivati nelogičan pritisak.",
      "Podaci se ne slažu s realnim ponašanjem auta.",
    ],
    keyClues: [
      "Offset se vidi prije paljenja ili na leru.",
      "Crijeva senzora mogu biti zapušena, puknuta ili puna kondenzata.",
      "Ne praviti priču o udarcu u rupu ili ovjesu.",
    ],
    proofSteps: ["Provjeriti vrijednost senzora na kontaktu", "Pregledati crijeva senzora", "Uporediti s manometrom", "Log regeneracije"],
    dtcGuidance: "DTC može biti za diferencijalni pritisak, ali ne smije direktno dati rješenje u naslovu.",
    acceptedBosnianSlang: ["senzor diferencijalnog pritiska", "dpf senzor laže", "crijeva dpf senzora", "offset senzora"],
    closeButIncomplete: ["dpf problem", "problem regeneracije", "loš podatak pritiska"],
    neverMixWith: ["rupa", "točak", "zveckanje", "motanje volana", "ležaj"],
  },
  egr_stuck_open: {
    family: "egr_exhaust",
    workshopFocus: "EGR ostaje otvoren kad ne treba, pa motor dobija previše izduvnih gasova.",
    customerComplaint: [
      "Auto cuka ili se guši na laganom gasu, a na jačem gasu bude bolje.",
      "Na leru može biti nemiran, naročito kad je motor topao.",
    ],
    roadTest: [
      "Simptom je najjači u djelimičnom opterećenju.",
      "Pun gas često sakrije problem jer ECU zatvara EGR.",
    ],
    keyClues: [
      "Commanded i actual EGR se ne slažu.",
      "Usis može biti zaprljan čađom.",
      "Ne spajati s rupama, ležajem ili ovjesom.",
    ],
    proofSteps: ["Gledati commanded/actual EGR", "Aktivacioni test", "Privremeno isključenje testom gdje je dozvoljeno", "Pregled zaprljanosti"],
    dtcGuidance: "Može biti EGR flow kod ili ništa ako zapinje samo u jednom području.",
    acceptedBosnianSlang: ["egr zapinje", "egr ostao otvoren", "egr ventil", "vraća previše izduva"],
    closeButIncomplete: ["problem usisa", "miješanje zraka", "čadi u usisu"],
    neverMixWith: ["udarac u rupu", "ležaj", "kugla", "selen", "zveckanje u točku"],
  },
  fuel_filter_restriction: {
    family: "fuel_supply",
    workshopFocus: "Filter ograniči dotok goriva kad motor traži količinu.",
    customerComplaint: [
      "Auto pali, ali pod gasom zastane ili nema snage kad se traži više goriva.",
      "Na malom gasu je bolje nego pri jačem ubrzanju.",
    ],
    roadTest: [
      "Simptom prati opterećenje motora, ne brzinu točka.",
      "Može biti gore uzbrdo ili pri preticanju.",
    ],
    keyClues: [
      "Pritisak ili protok goriva padne pod opterećenjem.",
      "Problem se može pojaviti poslije lošeg goriva, ali ne smije se koristiti za kvarove ovjesa.",
      "Filter je servisni dio, ne izmišljati ECU senzorsku dramu.",
    ],
    proofSteps: ["Provjeriti protok/pritisak goriva", "Pregled filtera i kućišta", "Uporediti prije/poslije zamjene filtera"],
    dtcGuidance: "Može biti low fuel pressure pod opterećenjem ili bez koda.",
    acceptedBosnianSlang: ["filter goriva začepljen", "filter štopa", "nema dotoka goriva", "slab protok goriva"],
    closeButIncomplete: ["problem goriva", "dovod goriva", "slab pritisak goriva"],
    neverMixWith: ["udarac u rupu", "motanje volana", "ležaj", "zveckanje u ovjesu"],
  },
  air_in_fuel_line: {
    family: "fuel_supply",
    workshopFocus: "Zrak u dovodu pravi teško paljenje ili prekide, posebno nakon stajanja.",
    customerComplaint: [
      "Ujutro duže vergla, a kad upali poslije radi normalnije.",
      "Nekad se vide mjehurići u prozirnom crijevu goriva.",
    ],
    roadTest: [
      "Problem je najviše oko starta i prvih minuta rada.",
      "U vožnji može kratko trznuti ako povuče zrak.",
    ],
    keyClues: [
      "Gorivo se vraća ili sistem izgubi priming nakon stajanja.",
      "Nema veze s rupom, točkom ili kočnicama.",
    ],
    proofSteps: ["Provjeriti crijeva i spojeve", "Gledati mjehuriće", "Test nepovratnog ventila", "Provjeriti kućište filtera"],
    dtcGuidance: "Često nema koda jer je problem mehaničko/usisavanje zraka u gorivu.",
    acceptedBosnianSlang: ["vuče zrak u gorivo", "zrak u crijevu", "povuče fals na gorivu", "gubi gorivo nazad"],
    closeButIncomplete: ["problem dovoda goriva", "filter kućište", "slab start zbog goriva"],
    neverMixWith: ["udarac u rupu", "ležaj točka", "motanje", "zveckanje"],
  },
  fuel_pressure_regulator_lazy: {
    family: "fuel_pressure",
    workshopFocus: "Regulator kasni, pa rail/pritisak ne prati zahtjev u prelaznom režimu.",
    customerComplaint: [
      "Auto zastane na gasu pa tek onda povuče.",
      "Nekad upali normalno, nekad mu treba duže verglanje.",
    ],
    roadTest: [
      "Simptom se vidi u prelazu s laganog na jači gas.",
      "Nema mehaničkog lupanja ni veze s volanom.",
    ],
    keyClues: [
      "Traženi i stvarni pritisak goriva se razilaze kratko, pa se vrate.",
      "Filter i dovod mogu biti uredni.",
    ],
    proofSteps: ["Log rail/fuel pressure requested/actual", "Provjeriti regulator i instalaciju", "Uporediti hladno/toplo ako je relevantno"],
    dtcGuidance: "Može biti rail pressure regulation kod ili samo trag u live data.",
    acceptedBosnianSlang: ["regulator pritiska", "regulator goriva kasni", "ventil na pumpi", "rail pritisak bježi"],
    closeButIncomplete: ["pritisak goriva", "pumpa goriva", "rail problem"],
    neverMixWith: ["rupa", "točak", "ležaj", "kugla", "zveckanje ovjesa"],
  },
  injector_leakoff_excessive: {
    family: "fuel_injection",
    workshopFocus: "Jedna dizna vraća previše goriva na povrat, pa rail ne drži pritisak pri startu ili opterećenju.",
    customerComplaint: [
      "Topao motor duže vergla, a kad upali radi skoro normalno.",
      "Nekad zatrese ili zastane pod gasom bez jasnog razloga.",
    ],
    roadTest: [
      "Problem je vezan za pritisak goriva, ne za brzinu točkova.",
      "Može se pogoršati na toplom motoru.",
    ],
    keyClues: [
      "Leak-off test pokaže jednu diznu van ostalih.",
      "Rail pressure pri verglanju ili opterećenju ne dođe gdje treba.",
    ],
    proofSteps: ["Leak-off test dizni", "Log rail pressure pri verglanju", "Korekcije dizni kao pomoćni trag"],
    dtcGuidance: "Može biti nizak rail pressure pri startu ili bez jasnog koda.",
    acceptedBosnianSlang: ["dizna pušta na povrat", "prevelik leak off", "dizna vraća gorivo", "povrat dizne"],
    closeButIncomplete: ["dizna", "rail pressure", "problem ubrizgavanja"],
    neverMixWith: ["udarac u rupu", "ležaj", "motanje", "kugla", "zveckanje točka"],
  },
  camshaft_sensor_signal_drop: {
    family: "sensors_sync",
    workshopFocus: "Signal bregaste povremeno nestane, najčešće na toplom ili u prelaznom režimu.",
    customerComplaint: [
      "Auto nekad duže vergla ili se kratko ugasi pa kasnije upali.",
      "Problem je povremen i često nestane kad se auto ohladi.",
    ],
    roadTest: [
      "Nema stalnog mehaničkog zvuka.",
      "Simptom je elektronski/povremen, ne prati brzinu točkova.",
    ],
    keyClues: [
      "Signal bregaste nestane u freeze frameu ili osciloskopu.",
      "Korelacija radilica-bregasta može biti sumnjiva samo u trenutku kvara.",
    ],
    proofSteps: ["Osciloskop signala", "Provjeriti konektor i instalaciju", "Uporediti hladno/toplo", "Freeze frame"],
    dtcGuidance: "Može biti camshaft position signal kod, ali nekad ostane pending.",
    acceptedBosnianSlang: ["senzor bregaste", "bregasta gubi signal", "senzor faze", "signal bregaste prekida"],
    closeButIncomplete: ["senzor", "sinhronizacija", "problem paljenja"],
    neverMixWith: ["rupa", "ležaj", "ovjes", "motanje volana", "kočiona kliješta"],
  },
  crankshaft_sensor_intermittent_hot: {
    family: "sensors_sync",
    workshopFocus: "Senzor radilice prekida kad se ugrije; auto se ugasi ili neće upaliti dok se ne ohladi.",
    customerComplaint: [
      "Topao motor se ugasi ili neće ponovo upaliti nakon kratkog stajanja.",
      "Kad se ohladi, opet pali kao da ništa nije bilo.",
    ],
    roadTest: [
      "Obrtaji pri verglanju mogu nestati na dijagnostici.",
      "Simptom nije vezan za rupe, volan ili točkove.",
    ],
    keyClues: [
      "RPM signal nestaje u trenutku no-starta.",
      "Kvar je termički i povremen.",
    ],
    proofSteps: ["Gledati RPM pri verglanju", "Osciloskop radilice", "Zagrijavanje senzora", "Provjera instalacije"],
    dtcGuidance: "Može biti crankshaft signal kod ili ništa ako se signal vrati.",
    acceptedBosnianSlang: ["senzor radilice", "radilica gubi signal", "senzor obrtaja", "crank senzor"],
    closeButIncomplete: ["senzor paljenja", "nema obrtaja", "problem signala"],
    neverMixWith: ["udarac u rupu", "ležaj točka", "zveckanje ovjesa", "kočnice"],
  },
  alternator_output_intermittent: {
    family: "charging_starting",
    workshopFocus: "Punjenje pada povremeno, najlakše pod električnim opterećenjem.",
    customerComplaint: [
      "Povremeno se pali lampica akumulatora ili elektronika poludi na kratko.",
      "Nakon vožnje auto nekad teže upali jer akumulator nije dopunjen.",
    ],
    roadTest: [
      "Simptom se pojača s potrošačima: svjetla, ventilator, grijač stakla.",
      "Nema veze s brzinom točka ni rupama.",
    ],
    keyClues: [
      "Napon punjenja padne ili osciluje.",
      "Masa i remen se provjeravaju prije zamjene alternatora.",
    ],
    proofSteps: ["Mjeriti punjenje pod opterećenjem", "Provjeriti remen i remenicu", "Load test akumulatora", "Provjeriti mase"],
    dtcGuidance: "Može biti charging system kod ili samo nizak napon u modulima.",
    acceptedBosnianSlang: ["alternator ne puni", "punjenje pada", "regler alternatora", "slabo puni"],
    closeButIncomplete: ["akumulator", "struja", "punjenje"],
    neverMixWith: ["udarac u rupu", "motanje volana", "ležaj", "dpf", "turbo"],
  },
  engine_ground_high_resistance: {
    family: "charging_starting",
    workshopFocus: "Loša masa pravi čudne električne simptome, sporo verglanje ili lažne greške.",
    customerComplaint: [
      "Nekad vergla tromo iako je akumulator dobar.",
      "Povremeno iskaču nepovezane greške ili svjetla zatamne pri startu.",
    ],
    roadTest: [
      "Simptom se javlja pri startu ili velikom električnom opterećenju.",
      "Nema logike da se veže za ovjes ili rupu osim ako je masa fizički oštećena, što ne koristiti bez potrebe.",
    ],
    keyClues: [
      "Pad napona između motora i šasije je previsok.",
      "Spoj mase može biti oksidiran ili labav.",
    ],
    proofSteps: ["Voltage drop test mase", "Pregled i čišćenje spojeva mase", "Test pri verglanju"],
    dtcGuidance: "Može proizvesti gomilu sekundarnih low-voltage grešaka, ali ne jedan direktan kod.",
    acceptedBosnianSlang: ["loša masa", "masa motora", "kontakt mase", "oksidirala masa"],
    closeButIncomplete: ["struja", "akumulator", "instalacija"],
    neverMixWith: ["ležaj", "motanje", "dpf", "egr", "zveckanje u točku"],
  },
  starter_solenoid_intermittent: {
    family: "charging_starting",
    workshopFocus: "Anlaser povremeno ne dobije ili ne prenese kontakt preko solenoida.",
    customerComplaint: [
      "Okrene ključ i nekad samo klikne, a nekad upali normalno.",
      "Problem je najčešći pri startu, prije bilo kakve vožnje.",
    ],
    roadTest: [
      "Nema road-test simptoma jer se kvar dešava pri paljenju.",
      "Kad upali, motor radi normalno.",
    ],
    keyClues: [
      "Napon na komandi anlasera postoji, ali anlaser ne okrene svaki put.",
      "Akumulator i kleme moraju biti potvrđeni dobri.",
    ],
    proofSteps: ["Mjeriti napon na solenoidu", "Voltage drop kablova", "Test anlasera kad se kvar pojavi"],
    dtcGuidance: "Obično nema ECU koda za sam solenoid anlasera.",
    acceptedBosnianSlang: ["anlaser", "automat anlasera", "solenoid anlasera", "samo klikne"],
    closeButIncomplete: ["problem starta", "struja paljenja", "akumulator ako nije precizno"],
    neverMixWith: ["vožnja preko rupa", "ležaj", "dpf", "turbo", "kočnice"],
  },
  front_wheel_bearing_humming: {
    family: "chassis_noise",
    workshopFocus: "Hučanje prati brzinu točka i mijenja se kad se rastereti/optereći strana auta.",
    customerComplaint: [
      "Hučanje raste s brzinom, kao avion u kabini.",
      "Zvuk se mijenja u blagoj krivini lijevo/desno.",
    ],
    roadTest: [
      "Nema veze s obrtajima motora ni gasom.",
      "Pri promjeni opterećenja lijevo/desno zvuk se pojača ili smanji.",
    ],
    keyClues: [
      "Zvuk ostaje i kad se pusti gas.",
      "Guma i balans se isključuju pregledom.",
      "Ne smije se spominjati gubitak snage, turbo ili DPF.",
    ],
    proofSteps: ["Probna vožnja sa slalom opterećenjem", "Podizanje auta i slušanje ležaja", "Provjera lufta i guma"],
    dtcGuidance: "Nema korisnog ECU koda za običan ležaj točka.",
    acceptedBosnianSlang: ["ležaj točka", "lager točka", "huči ležaj", "ležaj prednjeg točka"],
    closeButIncomplete: ["guma huči", "nešto oko točka", "glavčina ako je povezano"],
    neverMixWith: ["gubitak snage", "ne vuče", "turbo", "dpf", "egr", "rail", "sipanje goriva"],
  },
  wheel_bearing_front_hub_worn: {
    family: "chassis_noise",
    workshopFocus: "Ležaj/glavčina pravi hučanje ili grublji zvuk koji prati brzinu točka.",
    customerComplaint: [
      "Što brže vozi, to se više čuje hučanje s prednje strane.",
      "Zvuk nije vezan za motor nego za kotrljanje auta.",
    ],
    roadTest: [
      "Zvuk se mijenja kad se auto blago prebaci lijevo/desno.",
      "Može početi nakon rupe, ali bez ikakvog gubitka snage.",
    ],
    keyClues: [
      "Zvuk ostaje u leru dok se auto kotrlja.",
      "Nema trzanja motora, boosta ni DPF priče.",
    ],
    proofSteps: ["Slušanje u vožnji", "Pregled lufta", "Stetoskop na dizalici", "Provjera guma"],
    dtcGuidance: "Bez korisnog ECU koda, osim ako ABS senzor sekundarno strada, što ne smije biti glavni trag.",
    acceptedBosnianSlang: ["ležaj točka", "lager", "glavčina", "hučanje točka"],
    closeButIncomplete: ["guma", "točak huči", "prednji trap ako nije precizno"],
    neverMixWith: ["gubitak snage", "turbo", "dpf", "gorivo", "egr", "rail"],
  },
  outer_cv_joint_clicking: {
    family: "chassis_noise",
    workshopFocus: "Vanjska kinetika klika pri punom motanju i laganom gasu.",
    customerComplaint: [
      "Klikće kad smota volan i kreće s mjesta.",
      "Najviše se čuje na parkingu, u krug ili pri punom motanju.",
    ],
    roadTest: [
      "U pravcu se skoro ne čuje.",
      "Zvuk prati opterećenje zgloba pri motanju, ne motor.",
    ],
    keyClues: [
      "Manžetna može biti puknuta ili masna oko zgloba.",
      "Nema gubitka snage, DPF-a, goriva ni turbine.",
    ],
    proofSteps: ["Probna vožnja u krug lijevo/desno", "Pregled manžetne", "Pregled lufta u zglobu"],
    dtcGuidance: "Nema ECU koda za kinetički zglob.",
    acceptedBosnianSlang: ["kinetika", "homokinetički zglob", "vanjski zglob", "klika pri motanju"],
    closeButIncomplete: ["poluosovina", "zglob", "nešto u točku"],
    neverMixWith: ["gubitak snage", "turbo", "dpf", "rail", "sipanje goriva"],
  },
  stabilizer_link_worn: {
    family: "chassis_noise",
    workshopFocus: "Štangica stabilizatora lupka preko sitnih neravnina, bez uticaja na motor.",
    customerComplaint: [
      "Lupka naprijed preko sitnih rupa i kocke.",
      "Na ravnom se skoro ne čuje, a preko malih neravnina zvecka.",
    ],
    roadTest: [
      "Zvuk je najjači na maloj brzini preko neravnina.",
      "Nema veze s gasom, obrtajima ili snagom.",
    ],
    keyClues: [
      "Luft u štangici ili kuglicama stabilizatora.",
      "Ne koristiti simptome motora.",
    ],
    proofSteps: ["Pregled štangica na dizalici", "Pajser test lufta", "Probna vožnja preko sitnih neravnina"],
    dtcGuidance: "Nema ECU koda za štangicu stabilizatora.",
    acceptedBosnianSlang: ["štangica stabilizatora", "stabilizator štangica", "lupka štangica", "spojnica stabilizatora"],
    closeButIncomplete: ["prednji trap", "nešto u ovjesu", "kugla ako nije precizno"],
    neverMixWith: ["gubitak snage", "ne vuče", "turbo", "dpf", "gorivo", "auspuh"],
  },
  control_arm_bushing_worn: {
    family: "chassis_noise",
    workshopFocus: "Selen vilice dozvoli pomjeranje točka/trapa pri kočenju, kretanju ili preko neravnina.",
    customerComplaint: [
      "Tupi udarac se čuje pri kretanju ili kočenju.",
      "Auto malo pliva ili šeta preko neravnina.",
    ],
    roadTest: [
      "Simptom je u trapu, ne u motoru.",
      "Može se osjetiti promjena pravca pri kočenju.",
    ],
    keyClues: [
      "Selen je ispucao ili se vilica pomjera pod opterećenjem.",
      "Nema DPF, turbo ili gorivo priče.",
    ],
    proofSteps: ["Vizuelni pregled selena", "Pajser test", "Provjera geometrije ako treba", "Probna vožnja kočenje/kretanje"],
    dtcGuidance: "Nema ECU koda za selen vilice.",
    acceptedBosnianSlang: ["selen vilice", "seleni", "vilica ima luft", "zadnji selen vilice"],
    closeButIncomplete: ["prednji trap", "ovjes", "kugla/vilica ako nije precizno"],
    neverMixWith: ["gubitak snage", "turbo", "dpf", "gorivo", "rail"],
  },
  front_brake_caliper_sticking: {
    family: "brake_drag",
    workshopFocus: "Kliješta zapinju i drže točak, pa se grije, smrdi ili vuče u stranu.",
    customerComplaint: [
      "Poslije gradske vožnje jedan točak smrdi na kočnice i felga je vruća.",
      "Auto kao da je malo zakočen i nekad vuče u stranu.",
    ],
    roadTest: [
      "Problem se pojača nakon više kočenja.",
      "Kad se pusti gas, auto slabije klizi nego što treba.",
    ],
    keyClues: [
      "Temperatura jednog diska/felge je veća od druge strane.",
      "Klip ili klizači kočionih kliješta zapinju.",
    ],
    proofSteps: ["Mjeriti temperaturu diskova", "Pregled klizača i klipa", "Provjeriti slobodno okretanje točka", "Provjeriti crijevo kočnice"],
    dtcGuidance: "Obično nema ECU koda; ABS kod nije glavni trag osim ako je sekundaran.",
    acceptedBosnianSlang: ["kočiona kliješta zapinju", "čeljust koči", "klizači zapekli", "točak ostaje zakočen"],
    closeButIncomplete: ["kočnice drže", "disk se grije", "problem kočnica"],
    neverMixWith: ["turbo", "dpf", "egr", "rail", "senzor radilice", "gubitak snage motora"],
  },
  rear_brake_caliper_dragging: {
    family: "brake_drag",
    workshopFocus: "Zadnja kliješta ili ručna kočnica blago drže, pa se zadnji točak grije.",
    customerComplaint: [
      "Poslije kratke vožnje zadnja felga je vruća i osjeti se miris kočnica.",
      "Auto kao da se ne kotrlja slobodno.",
    ],
    roadTest: [
      "Simptom se javlja nakon kočenja ili korištenja ručne.",
      "Nema veze s obrtajima motora.",
    ],
    keyClues: [
      "Jedan zadnji disk je znatno topliji.",
      "Mehanizam ručne ili klizači mogu zapinjati.",
    ],
    proofSteps: ["Provjera temperature", "Pregled kliješta i ručne", "Slobodno okretanje točka na dizalici"],
    dtcGuidance: "Najčešće bez korisnog koda.",
    acceptedBosnianSlang: ["zadnja kliješta drže", "čeljust zapela", "ručna ne vraća", "zadnji točak koči"],
    closeButIncomplete: ["kočnice", "disk se grije", "točak drži"],
    neverMixWith: ["turbo", "dpf", "egr", "rail", "senzor"],
  },
  engine_mount_collapsed: {
    family: "mounts_vibration",
    workshopFocus: "Nosač motora prenosi vibraciju u karoseriju, posebno na leru ili pri kretanju.",
    customerComplaint: [
      "Auto trese u leru više nego prije, posebno kad se ubaci u brzinu.",
      "Pri kretanju se osjeti udar ili ljuljanje motora.",
    ],
    roadTest: [
      "Vibracija se mijenja kad se motor optereti, ali ne prati brzinu točka.",
      "Na većoj brzini može skoro nestati.",
    ],
    keyClues: [
      "Motor se previše pomjera pri dodavanju gasa na mjestu.",
      "Nema preskakanja paljenja ako su korekcije/parametri uredni.",
    ],
    proofSteps: ["Vizuelni pregled nosača", "Power-brake test pažljivo", "Provjera curenja hidrauličnog nosača"],
    dtcGuidance: "Nema ECU koda za običan mehanički nosač.",
    acceptedBosnianSlang: ["nosač motora", "sjeo nosač", "hidro nosač", "motor se ljulja"],
    closeButIncomplete: ["vibracija motora", "nosači", "zamajac ako nije precizno"],
    neverMixWith: ["ležaj točka", "dpf", "turbo", "sipanje goriva", "udarac u rupu kao glavni razlog"],
  },
  engine_mount_hydraulic_failure: {
    family: "mounts_vibration",
    workshopFocus: "Hidraulični nosač izgubi prigušenje i pusti vibraciju u kabinu.",
    customerComplaint: [
      "Na leru kabina trese, a motor po parametrima radi uredno.",
      "Vibracija je jača kad je auto u brzini ili klima uključena.",
    ],
    roadTest: [
      "Simptom je najjači pri maloj brzini i stajanju.",
      "Ne prati rupe ni brzinu točka.",
    ],
    keyClues: [
      "Nosač može biti mastan/ispuhan.",
      "Dizne i paljenje nisu glavni pravac ako motor radi ravnomjerno.",
    ],
    proofSteps: ["Pregled nosača", "Load test u mjestu", "Uporediti vibraciju P/N/D ili kvačilo"],
    dtcGuidance: "Bez korisnog ECU koda osim ako auto ima aktivne nosače, tada kod može biti sekundaran.",
    acceptedBosnianSlang: ["hidraulični nosač", "nosač motora", "nosač pustio", "vibrira zbog nosača"],
    closeButIncomplete: ["nosači", "vibracija u leru", "motor trese"],
    neverMixWith: ["ležaj", "dpf", "turbo", "gorivo", "rupa"],
  },
  gearbox_mount_softened: {
    family: "mounts_vibration",
    workshopFocus: "Nosač mjenjača dozvoli pomjeranje pogona pri promjeni opterećenja.",
    customerComplaint: [
      "Pri puštanju i dodavanju gasa osjeti se udar ili zatrese ručica mjenjača.",
      "U kabini se osjeti trzaj kad pogon promijeni opterećenje.",
    ],
    roadTest: [
      "Simptom je pri promjeni gas-pušten gas, ne preko rupa.",
      "Motor može raditi sasvim uredno.",
    ],
    keyClues: [
      "Mjenjač/pogon se previše pomjera.",
      "Nema misfire ili rail problema.",
    ],
    proofSteps: ["Pregled nosača mjenjača", "Opteretiti pogon na mjestu", "Provjera ostalih nosača"],
    dtcGuidance: "Nema ECU koda za nosač mjenjača.",
    acceptedBosnianSlang: ["nosač mjenjača", "mjenjač se pomjera", "nosač pogona", "sjeo nosač mjenjača"],
    closeButIncomplete: ["nosači", "vibracija pogona", "zamajac ako nije precizno"],
    neverMixWith: ["dpf", "turbo", "ležaj točka", "sipanje goriva"],
  },
  transmission_mount_softened: {
    family: "mounts_vibration",
    workshopFocus: "Nosač mjenjača prenosi vibraciju ili udar pri promjeni opterećenja.",
    customerComplaint: [
      "Pri kretanju ili prebacivanju opterećenja osjeti se tupi udar.",
      "Ručica ili pod auta zatrese kad se doda pa pusti gas.",
    ],
    roadTest: [
      "Simptom prati opterećenje pogona, ne neravnine.",
      "Nema pada snage motora.",
    ],
    keyClues: ["Nosač je mekan/puknut.", "Pogon ima prevelik hod pri gas-pušten gas."],
    proofSteps: ["Pregled nosača", "Load test pogona", "Provjera lufta u pogonu"],
    dtcGuidance: "Nema ECU koda.",
    acceptedBosnianSlang: ["nosač mjenjača", "sjeo nosač", "mjenjač lupa", "nosač transmisije"],
    closeButIncomplete: ["nosači", "pogon lupa", "vibracija mjenjača"],
    neverMixWith: ["dpf", "turbo", "točak huči", "sipanje goriva"],
  },
  thermostat_stuck_open: {
    family: "cooling",
    workshopFocus: "Termostat ostaje otvoren, motor se sporo grije ili pada temperatura na otvorenoj cesti.",
    customerComplaint: [
      "Temperatura teško dođe do radne ili pada na otvorenoj cesti.",
      "Grijanje je slabije kad se vozi nizbrdo ili lagano.",
    ],
    roadTest: [
      "Pod opterećenjem temperatura poraste, a na laganoj vožnji padne.",
      "Nema veze s rupama, točkom ili zveckanjem.",
    ],
    keyClues: [
      "Veliki krug se otvara prerano.",
      "Gornje/donje crijevo se grije nelogično rano.",
    ],
    proofSteps: ["Live data temperature", "Provjera crijeva pri hladnom startu", "Termostat test/zamjena po proceduri"],
    dtcGuidance: "Može biti thermostat rationality kod ili bez koda ako je blago.",
    acceptedBosnianSlang: ["termostat ostao otvoren", "termostat pušta", "motor se hladi", "ne drži temperaturu"],
    closeButIncomplete: ["hlađenje", "temperatura pada", "rashladni sistem"],
    neverMixWith: ["udarac u rupu", "ležaj", "turbo", "gorivo", "zveckanje u ovjesu"],
  },
  thermostat_stuck_partially_open: {
    family: "cooling",
    workshopFocus: "Termostat je djelimično otvoren, pa temperatura bježi dole u laganoj vožnji.",
    customerComplaint: [
      "U gradu dođe do 90, ali na otvorenom ili nizbrdo temperatura padne.",
      "Grijanje osjeti promjenu kad motor izgubi temperaturu.",
    ],
    roadTest: [
      "Veće opterećenje vrati temperaturu gore.",
      "Lagano opterećenje je najgore.",
    ],
    keyClues: ["Nema curenja rashladne tečnosti.", "Veliki krug kreće prerano."],
    proofSteps: ["Pratiti coolant temp live data", "Provjeriti crijeva hladnjaka", "Uporediti opterećenje i temperaturu"],
    dtcGuidance: "Često nema koda jer nije električni kvar.",
    acceptedBosnianSlang: ["termostat djelimično otvoren", "termostat šteka", "ne drži temperaturu"],
    closeButIncomplete: ["termostat", "hlađenje", "temperatura pada"],
    neverMixWith: ["rupa", "ležaj", "dpf", "turbo", "gorivo"],
  },
  thermostat_housing_internal_fault: {
    family: "cooling",
    workshopFocus: "Kućište termostata interno krivo reguliše protok ili temperaturu.",
    customerComplaint: [
      "Temperatura se ponaša nelogično: nekad ode gore, nekad ostane hladniji nego treba.",
      "Grijanje i temperatura variraju bez vidljivog curenja.",
    ],
    roadTest: [
      "Simptom prati režim grijanja/hlađenja, ne rupe ili brzinu točka.",
      "Može biti gore u gradu ili pod opterećenjem, zavisno od kvara.",
    ],
    keyClues: ["Live data temperature ne prati očekivan rad termostata.", "Kućište može imati poznatu boljku na motoru."],
    proofSteps: ["Live data coolant temp", "Provjera rada termostata/kućišta", "Pressure test ako ima sumnje na curenje"],
    dtcGuidance: "Može biti kod za termostat/grijač termostata ili bez koda.",
    acceptedBosnianSlang: ["kućište termostata", "termostat kućište", "termostat šteka", "regulacija temperature"],
    closeButIncomplete: ["termostat", "hlađenje", "temperatura motora"],
    neverMixWith: ["udarac u rupu", "ležaj", "zveckanje ovjesa", "gorivo"],
  },
  water_pump_flow_reduced: {
    family: "cooling",
    workshopFocus: "Pumpa vode nema dovoljan protok pod opterećenjem, pa temperatura raste i grijanje može varirati.",
    customerComplaint: [
      "Temperatura raste kad se auto optereti, a u laganoj vožnji se smiri.",
      "Grijanje zna oslabiti ili temperatura čudno varira.",
    ],
    roadTest: [
      "Uzbrdo ili pod opterećenjem je gore.",
      "Nema veze s točkom, rupom ili volanom.",
    ],
    keyClues: ["Protok kroz rashladni sistem je slab.", "Termostat i ventilatori nisu dovoljni kao objašnjenje."],
    proofSteps: ["Provjeriti cirkulaciju", "Live data temperature", "Pressure/flow provjera po proceduri"],
    dtcGuidance: "Obično bez direktnog koda ako je mehanička pumpa.",
    acceptedBosnianSlang: ["vodena pumpa", "pumpa vode slab protok", "ne vrti vodu", "slaba cirkulacija"],
    closeButIncomplete: ["hlađenje", "pregrijava se", "rashladni sistem"],
    neverMixWith: ["rupa", "ležaj", "turbo", "dpf", "gorivo"],
  },
  head_gasket_combustion_leak: {
    family: "head_gasket",
    workshopFocus: "Kompresija ulazi u rashladni sistem; simptomi se vežu za pritisak, vodu i opterećenje.",
    customerComplaint: [
      "Tvrda crijeva i izbacivanje vode nakon vožnje.",
      "Gubi vodu bez jasnog vanjskog curenja.",
    ],
    roadTest: [
      "Pod opterećenjem se pritisak u sistemu brže napravi.",
      "Temperatura može biti normalna dok se pritisak ne nakupi.",
    ],
    keyClues: ["CO2 test može biti pozitivan.", "Pritisak ostaje u sistemu i kad se ohladi."],
    proofSteps: ["CO2 test", "Pressure test", "Provjera mjehurića u posudi", "Leak-down po potrebi"],
    dtcGuidance: "ECU često nema direktan kod za dihtung glave.",
    acceptedBosnianSlang: ["dihtung glave", "nabija kompresiju u vodu", "gura pritisak u rashladni", "puše u vodu"],
    closeButIncomplete: ["gubi vodu", "pritisak u sistemu", "glava motora"],
    neverMixWith: ["rupa", "ležaj", "motanje", "turbo kao glavni trag", "dpf"],
  },
  head_gasket_coolant_into_cylinder: {
    family: "head_gasket",
    workshopFocus: "Rashladna tečnost ulazi u cilindar; start, bijeli dim ili gubitak vode su glavni tragovi.",
    customerComplaint: [
      "Ujutro malo zatrese i izbaci bijel dim pa se smiri.",
      "Gubi rashladnu tečnost, a nigdje ne curi vani.",
    ],
    roadTest: [
      "Simptom je najjači nakon stajanja.",
      "Pod opterećenjem može porasti pritisak rashladnog sistema.",
    ],
    keyClues: ["Jedan cilindar može biti vlažan ili svjećica/grijač opran.", "CO2 ili pressure test daju trag."],
    proofSteps: ["Pressure test preko noći", "Pregled cilindra kamerom", "CO2 test", "Leak-down"],
    dtcGuidance: "Može baciti misfire/preskakanje kao sekundarni trag, ali ne direktan dihtung kod.",
    acceptedBosnianSlang: ["dihtung glave", "voda ulazi u cilindar", "pije vodu u motor", "bijeli dim zbog vode"],
    closeButIncomplete: ["gubi vodu", "glava", "rashladna u motoru"],
    neverMixWith: ["rupa", "ležaj", "ovjes", "dpf kao glavni trag"],
  },
  head_gasket_pressurizing_cooling_system: {
    family: "head_gasket",
    workshopFocus: "Dihtung glave pravi pritisak u rashladnom sistemu naročito pod opterećenjem.",
    customerComplaint: [
      "Posuda rashladne tečnosti nabije pritisak i zna izbaciti vodu.",
      "Crijeva budu tvrda i kad temperatura nije ekstremna.",
    ],
    roadTest: [
      "Uzbrdo ili jači gas brže naprave pritisak.",
      "Nakon hlađenja pritisak može ostati.",
    ],
    keyClues: ["CO2 u posudi", "Nema velikog vanjskog curenja.", "Ventilator/termostat nisu cijela priča."],
    proofSteps: ["CO2 test", "Pressure test", "Leak-down", "Praćenje pritiska pod opterećenjem"],
    dtcGuidance: "Najčešće bez direktnog ECU koda.",
    acceptedBosnianSlang: ["dihtung glave", "nabija pritisak u vodu", "puše kompresiju", "pritisak u rashladnom"],
    closeButIncomplete: ["rashladni sistem", "gubi vodu", "glava"],
    neverMixWith: ["rupa", "točak", "ležaj", "dpf", "egr"],
  },
  head_gasket_minor_coolant_entry: {
    family: "head_gasket",
    workshopFocus: "Mala količina rashladne ulazi u cilindar, često bez velikog pregrijavanja.",
    customerComplaint: [
      "Polako gubi vodu, a vani se ne vidi curenje.",
      "Na hladno kratko zatrese ili izbaci paru pa se smiri.",
    ],
    roadTest: [
      "Simptom se vidi nakon stajanja ili pod pritiskom sistema.",
      "Nije kvar ovjesa ni točka.",
    ],
    keyClues: ["Pressure test preko noći može spustiti nivo.", "Jedan cilindar može biti čist/opran."],
    proofSteps: ["Pressure test", "Kamera u cilindar", "CO2 test", "Leak-down"],
    dtcGuidance: "Može biti bez koda ili sekundarni misfire na hladno.",
    acceptedBosnianSlang: ["dihtung glave", "voda u cilindar", "pije vodu", "rashladna ulazi u motor"],
    closeButIncomplete: ["gubi vodu", "glava", "rashladni sistem"],
    neverMixWith: ["rupa", "ležaj", "turbo", "dpf"],
  },
  oil_rings_internal: {
    family: "oil_internal",
    workshopFocus: "Motor troši ulje preko karika/klipne grupe bez vidljivog curenja.",
    customerComplaint: [
      "Vlasnik stalno dolijeva ulje, a nigdje ne kaplje.",
      "Nema uvijek plavog dima, ali nivo ulja pada između servisa.",
    ],
    roadTest: [
      "Snaga može biti normalna.",
      "Problem je potrošnja kroz kilometražu, ne jedan režim vožnje.",
    ],
    keyClues: ["PCV se provjerava, ali poznata boljka može biti klipna grupa.", "Compression/leak-down daju kontekst."],
    proofSteps: ["Mjeriti stvarnu potrošnju ulja", "Leak-down/compression", "Provjera PCV-a", "Kamera po potrebi"],
    dtcGuidance: "ECU ne mjeri direktno potrošnju ulja, često nema koda.",
    acceptedBosnianSlang: ["karike", "uljne karike", "klipna grupa", "troši ulje preko karika"],
    closeButIncomplete: ["troši ulje", "pcv", "motor sagorijeva ulje"],
    neverMixWith: ["rupa", "ležaj", "ovjes", "dpf kao glavni uzrok"],
  },
};

const ALIASES: Record<string, string> = {
  oil_consumption_without_visible_smoke: "oil_rings_internal",
};

const FAMILY_FORBIDDEN: Record<string, string[]> = {
  chassis_noise: [
    "gubitak snage",
    "ne vuce",
    "ne vuče",
    "turbo",
    "boost",
    "dpf",
    "egr",
    "rail",
    "dizna",
    "gorivo",
    "auspuh gusi",
    "auspuh guši",
  ],
  brake_drag: ["turbo", "dpf", "egr", "rail", "dizna", "boost", "senzor radilice"],
  mounts_vibration: ["dpf", "egr", "boost", "rail", "ležaj točka", "lager točka", "sipanje goriva"],
  boost_intake: ["udarac u rupu", "rupa", "ležaj točka", "lager", "kugla", "selen", "motanje volana"],
  dpf_exhaust: ["udarac u rupu", "rupa", "ležaj", "kugla", "selen", "motanje volana", "zveckanje u točku"],
  egr_exhaust: ["udarac u rupu", "rupa", "ležaj", "kugla", "selen", "motanje volana"],
  fuel_supply: ["udarac u rupu", "rupa", "ležaj", "kugla", "selen", "motanje volana", "zveckanje točka"],
  fuel_pressure: ["udarac u rupu", "rupa", "ležaj", "kugla", "selen", "motanje volana"],
  fuel_injection: ["udarac u rupu", "rupa", "ležaj", "kugla", "selen", "motanje volana"],
  sensors_sync: ["udarac u rupu", "rupa", "ležaj", "kugla", "selen", "kočiona kliješta"],
  charging_starting: ["dpf", "egr", "turbo", "boost", "ležaj", "motanje volana"],
  cooling: ["udarac u rupu", "rupa", "ležaj", "kugla", "selen", "motanje volana", "zveckanje"],
  head_gasket: ["udarac u rupu", "rupa", "ležaj", "kugla", "selen", "motanje volana", "zveckanje"],
  oil_internal: ["udarac u rupu", "rupa", "ležaj", "kugla", "selen", "motanje volana", "zveckanje"],
};

function normalizeText(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "dj")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(normalizeText(term)));
}

function defaultBlueprint(seed: ScenarioSeed): ScenarioBlueprint {
  return {
    family: "generic",
    workshopFocus:
      "Jedan konkretan kvar sa logičnim simptomima koji se ne smiju miješati s nepovezanim sistemima.",
    customerComplaint: [
      "Mušterija opisuje jedan glavni simptom koji direktno ima veze s datim kvarom.",
    ],
    roadTest: [
      "Probna vožnja ili radionička provjera potvrđuje isti sistem, bez nepovezanih tragova.",
    ],
    keyClues: [
      `Root cause mora ostati: ${seed.root_cause_label}.`,
      "Ne dodavati udarce u rupu, sipanje goriva, zveckanje ili ECU kodove ako ne pripadaju ovom kvaru.",
    ],
    proofSteps: ["Potvrditi kvar praktičnim testom u radionici.", "Uporediti očekivane i stvarne parametre ako sistem ima live data."],
    dtcGuidance: "DTC koristiti samo ako je realan i ne otkriva direktno odgovor.",
    acceptedBosnianSlang: [seed.root_cause_label],
    closeButIncomplete: [seed.category],
    neverMixWith: ["nepovezani sistemi", "random timeline", "lažni simptomi"],
  };
}

export function getScenarioBlueprint(seed: ScenarioSeed): ScenarioBlueprint {
  const id = ALIASES[seed.root_cause_id] || seed.root_cause_id;

  if (BLUEPRINTS[id]) return BLUEPRINTS[id];

  if (seed.root_cause_id.includes("mount")) return BLUEPRINTS.engine_mount_collapsed;
  if (seed.root_cause_id.includes("head_gasket")) return BLUEPRINTS.head_gasket_pressurizing_cooling_system;
  if (seed.root_cause_id.includes("thermostat")) return BLUEPRINTS.thermostat_stuck_partially_open;
  if (seed.root_cause_id.includes("wheel_bearing")) return BLUEPRINTS.front_wheel_bearing_humming;

  return defaultBlueprint(seed);
}

export function buildScenarioBlueprintPrompt(seed: ScenarioSeed, locale: "en" | "bs") {
  const blueprint = getScenarioBlueprint(seed);
  const languageNote =
    locale === "bs"
      ? "Write the final JSON in natural Bosnian mechanic language. Keep common workshop abbreviations like ECU, DTC, DPF, EGR, MAF, MAP, rail and live data when they sound natural."
      : "Write the final JSON in natural English workshop language.";

  return `
REALISTIC WORKSHOP BLUEPRINT:
${languageNote}

This blueprint is mandatory. Do not invent a second symptom family.
${JSON.stringify(blueprint, null, 2)}

BLUEPRINT RULES:
- The scenario must sound like one coherent car that came into a real workshop.
- The title must be a complaint, not a diagnosis.
- Use one main symptom family only. Do not combine engine power loss with wheel/ovjes noise unless the root cause itself is brake drag or mount vibration and the link is explicit.
- customer complaint, symptoms, road test and hints must all point to the same root cause family.
- If the blueprint says no useful ECU code, do not invent a strong code.
- If you include a DTC, put it in hint or extra only, and make it partial/helpful, not the answer.
- Use the proof steps from the blueprint as the basis for answer_proof.
- accepted_answers must include the blueprint slang/synonyms.
- partial_answers must include close but incomplete answers from the blueprint.
- Never include any item from neverMixWith.
`;
}

export function scenarioViolatesBlueprint(
  scenario: ScenarioLike,
  seed: ScenarioSeed
): string | null {
  const blueprint = getScenarioBlueprint(seed);
  const title = normalizeText(scenario.title);
  const body = normalizeText(
    [
      scenario.title,
      ...(scenario.symptoms || []),
      ...(scenario.driving || []),
      ...(scenario.extra || []),
      ...(scenario.key_details || []),
      ...(scenario.hint || []),
      scenario.answer_main,
      scenario.answer_why_no_code,
      ...(scenario.answer_proof || []),
    ].join(" ")
  );

  const forbidden = [
    ...(FAMILY_FORBIDDEN[blueprint.family] || []),
    ...blueprint.neverMixWith,
  ];

  if (containsAny(body, forbidden)) {
    return `Scenario mixes ${blueprint.family} with forbidden unrelated terms.`;
  }

  if (blueprint.family !== "fuel_supply" && blueprint.family !== "fuel_pressure") {
    if (containsAny(body, ["sipanje goriva", "nasuo gorivo", "točio gorivo", "refueling", "after refueling"])) {
      return "Scenario uses refueling even though the root cause is not fuel-supply related.";
    }
  }

  if (!["chassis_noise", "brake_drag", "mounts_vibration"].includes(blueprint.family)) {
    if (containsAny(body, ["udarac u rupu", "rupa", "preko rupe", "pothole"])) {
      return "Scenario uses pothole/road-impact context for a non-chassis fault.";
    }
  }

  if (blueprint.family === "chassis_noise" && containsAny(title, ["gubitak snage", "ne vuce", "ne vuče"])) {
    return "Chassis-noise title claims engine power loss.";
  }

  if (
    ["boost_intake", "dpf_exhaust", "egr_exhaust", "fuel_supply", "fuel_pressure", "fuel_injection"].includes(
      blueprint.family
    ) &&
    containsAny(title, ["zveckanje", "lupanje", "hučanje", "hucanje"])
  ) {
    return "Engine-performance title includes chassis/noise wording.";
  }

  return null;
}
