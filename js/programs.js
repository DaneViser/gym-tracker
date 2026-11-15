// Ready-made program library (pure data, no imports): PROGRAMS, REFS, X (exercise names).
// The picker sheet is in library.js; starter.js builds the translation index from this file.
//
// Every text is [en, sr]. Rules that keep users' data safe:
//  - Exercise ids are SHARED across programs: the same movement always has the same id (squat, bench,
//    hipthrust…), so switching programs keeps progress charts and strength badges continuous.
//    A different movement needs a different id (goblet ≠ squat, dbrdl ≠ rdl).
//  - Workout ids are UNIQUE across all programs (saved ticks are keyed by them). Never change an existing id.
//  - Limits (normalizeState cuts longer text): workout title 40, sub 60, exercise name 60, sets 30 chars.
//    tools/check.js checks all of this, plus that en and sr names hit the same strength badge.
//
// How the programs were built (sources in REFS, shown in the app under "Based on research"):
//  - Beginners: 2–3 full-body days, 8–12 reps, multi-joint lifts first (ACSM 2009).
//  - Muscle: each muscle about twice a week (Schoenfeld 2016), more weekly sets = more growth with
//    diminishing returns (Pelland 2024), sets taken close to failure, 1–3 reps in reserve (Refalo 2023).
//  - Strength: heavier loads (3–6 reps) build more strength (Lopez 2021); frequency helps mainly by adding volume (Grgic 2018).
//  - Women and men respond alike in relative terms (Roberts 2020), so every program is for both.
//  - Glutes: hip thrust and squat grow the glutes similarly, squat adds quads (Plotkin 2023; Contreras 2015).
//  - Fat loss: lifting during a diet keeps muscle (Sardeli 2018); cardio does not blunt gains (Schumann 2022).
//  - Short on time: weekly volume matters more than frequency (Iversen 2021); WHO 2020: 2+ strength days.
//  - 50+: strength + fast "power" reps + balance (NSCA, Fragala 2019).
//  - Home: push-ups match a similar bench press (Kikuchi 2017); light loads work when sets are hard (Lopez 2021).

// Exercise names, by id.
export const X = {
  squat: ["Squat", "Čučanj"],
  bench: ["Bench press", "Bench press (ravna klupa)"],
  deadlift: ["Deadlift", "Mrtvo dizanje"],
  ohp: ["Standing overhead press", "Potisak iznad glave iz stajanja"],
  pullups: ["Pull-ups", "Zgibovi"],
  latpd: ["Lat pulldown", "Lat mašina (povlačenje)"],
  row: ["Row (cable / machine)", "Veslanje (sajla / mašina)"],
  bbrow: ["Barbell row", "Veslanje sa šipkom"],
  dbrow: ["One-arm dumbbell row", "Veslanje bučicom jednom rukom"],
  rdl: ["Romanian deadlift", "Rumunsko mrtvo dizanje"],
  dbrdl: ["Dumbbell Romanian deadlift", "Rumunsko mrtvo dizanje sa bučicama"],
  hipthrust: ["Hip thrust", "Hip thrust (potisak kukom)"],
  glutebridge: ["Single-leg glute bridge", "Glute most na jednoj nozi"],
  bss: ["Bulgarian split squat", "Bugarski čučanj"],
  legpress: ["Leg press", "Leg press (potisak nogama)"],
  legcurl: ["Leg curls", "Pregib nogu (leg curl)"],
  quadext: ["Leg extensions", "Opružanje nogu (leg extension)"],
  lunges: ["Walking lunges", "Iskoraci u hodu"],
  goblet: ["Goblet squat", "Goblet čučanj"],
  calf: ["Calf raises", "Podizanje na prste (listovi)"],
  incdb: ["Incline dumbbell press", "Kosi potisak bučicama"],
  dbpress: ["Dumbbell chest press", "Potisak bučicama za grudi"],
  mchest: ["Machine chest press", "Mašina za grudi (potisak)"],
  chestfly: ["Chest fly (cable / machine)", "Razvlačenje za grudi (sajla / mašina)"],
  dips: ["Dips", "Propadanja na razboju"],
  pushups: ["Push-ups", "Sklekovi"],
  pike: ["Pike push-ups", "Pike sklekovi"],
  dbohp: ["Dumbbell shoulder press", "Potisak bučicama za ramena"],
  mpress: ["Machine shoulder press", "Potisak za ramena na mašini"],
  sidedelt: ["Side delt raises", "Lateralna podizanja"],
  facepull: ["Face pulls", "Face pull"],
  biceps: ["Biceps curls", "Pregib za biceps"],
  triceps: ["Triceps pushdowns", "Triceps na sajli"],
  invrow: ["Inverted rows (sturdy table or bar)", "Australijski zgibovi (čvrst sto ili šipka)"],
  plank: ["Plank", "Plank"],
  sideplank: ["Side plank", "Bočni plank"],
  deadbug: ["Dead bug", "Dead bug"],
  hkr: ["Hanging knee raises", "Podizanje kolena u visu"],
  farmer: ["Farmer's carry", "Farmerski hod"],
  suitcase: ["Suitcase carry", "Nošenje kofera (jednom rukom)"],
  swings: ["Kettlebell swings", "Zamasi girjom"],
  stepups: ["Step-ups", "Penjanje na klupu (step-up)"],
  abduction: ["Hip abduction (machine or band)", "Abdukcija kuka (mašina ili guma)"],
  kickback: ["Cable kickbacks", "Zabacivanje noge na sajli"],
  backext: ["Back extensions", "Hiperekstenzije"],
  sitstand: ["Sit-to-stand, fast up", "Ustajanje sa stolice, brzo gore"],
  balance: ["Single-leg balance", "Stajanje na jednoj nozi"],
  intervals: ["Intervals (bike / rower)", "Intervali (bicikl / veslanje)"],
  easycardio: ["Brisk walk or easy cardio", "Brzo hodanje ili lagan kardio"]
};

// Sets text: written in English, the Serbian version is made by these swaps (or pass [en, sr]).
const SR_SETS = [[/\/ side/g, "/ strana"], [/\/ leg/g, "/ nozi"], [/ each/g, " svaka"], [/max reps/g, "maks. ponavljanja"],
  [/ hard \//g, " jako /"], [/ easy/g, " lagano"]];
const sets = s => Array.isArray(s) ? s : [s, SR_SETS.reduce((a, [re, to]) => a.replace(re, to), s)];
const e = (id, s, o = {}) => Object.assign({ id, name: o.name || X[id], sets: sets(s) }, o.optional ? { optional: true } : {});
const opt = (id, s) => e(id, s, { optional: true });
const w = (id, dow, title, sub, ex) => ({ id, dow, altDow: null, title, sub, ex });

// Research behind the programs: short citation + the finding in one line.
export const REFS = {
  acsm09: ["ACSM position stand, Med Sci Sports Exerc 2009",
    ["Beginners: 2–3 days a week, 8–12 reps, mostly multi-joint lifts.", "Početnici: 2–3 dana nedeljno, 8–12 ponavljanja, uglavnom višezglobne vežbe."]],
  schoenfeld16: ["Schoenfeld, Ogborn & Krieger, Sports Med 2016",
    ["Training each muscle twice a week builds more muscle than once.", "Trening svakog mišića 2× nedeljno gradi više mišića nego 1×."]],
  pelland24: ["Pelland et al., dose-response meta-regressions, 2024",
    ["More weekly sets = more growth, with diminishing returns.", "Više serija nedeljno = veći rast, uz sve manji dobitak."]],
  refalo23: ["Refalo et al., Sports Med 2023",
    ["Hard sets close to failure grow muscle best; 1–3 reps short is enough.", "Teške serije blizu otkaza najbolje grade mišić; 1–3 ponavljanja pre otkaza je dovoljno."]],
  lopez21: ["Lopez et al., Med Sci Sports Exerc 2021",
    ["Heavy and light loads build similar muscle if sets are hard; heavy loads build more strength.", "Teški i laki tegovi grade sličnu masu ako su serije teške; teški grade više snage."]],
  grgic18: ["Grgic et al., Sports Med 2018",
    ["Strength follows weekly volume; more sessions are an easy way to add it.", "Snaga prati nedeljni obim; više treninga je lak način da ga dodaš."]],
  roberts20: ["Roberts, Nuckols & Krieger, J Strength Cond Res 2020",
    ["Women and men gain muscle and leg strength at a similar rate.", "Žene i muškarci dobijaju mišiće i snagu nogu sličnom brzinom."]],
  plotkin23: ["Plotkin et al., Front Physiol 2023",
    ["Hip thrusts and squats grew the glutes about the same; squats also grew the thighs.", "Hip thrust i čučanj su podjednako razvili gluteus; čučanj je razvio i butine."]],
  contreras15: ["Contreras et al., J Appl Biomech 2015",
    ["Hip thrusts activate the glutes more than squats.", "Hip thrust aktivira gluteus više od čučnja."]],
  iversen21: ["Iversen et al., Sports Med 2021",
    ["Short workouts work: weekly volume matters more than how often you train.", "Kratki treninzi rade: bitniji je nedeljni obim nego koliko često treniraš."]],
  who20: ["WHO guidelines, Br J Sports Med 2020",
    ["Adults: strength training 2+ days a week and 150–300 min of moderate cardio.", "Odrasli: trening snage 2+ dana nedeljno i 150–300 min umerenog kardija."]],
  fragala19: ["NSCA position statement, Fragala et al., J Strength Cond Res 2019",
    ["Strength, power and balance training keeps older adults strong and independent.", "Trening snage, eksplozivnosti i ravnoteže čuva snagu i samostalnost starijih."]],
  sardeli18: ["Sardeli et al., Nutrients 2018",
    ["Lifting while dieting prevented almost all muscle loss.", "Trening sa tegovima tokom dijete sprečio je skoro sav gubitak mišića."]],
  schumann22: ["Schumann et al., Sports Med 2022",
    ["Adding cardio does not reduce muscle or strength gains.", "Dodavanje kardija ne smanjuje rast mišića ni snage."]],
  kikuchi17: ["Kikuchi & Nakazato, J Exerc Sci Fit 2017",
    ["Push-ups built chest and triceps as well as a similar bench press.", "Sklekovi su razvili grudi i triceps kao i sličan bench press."]]
};

// How to progress (shared by several programs).
const HOW = {
  double: ["Pick a weight you can lift for the low end of the rep range. Add reps each week; when every set reaches the top of the range, add the smallest weight step. End most sets with 1–3 reps left in the tank.",
    "Izaberi teg sa kojim možeš donji broj ponavljanja. Svake nedelje dodaj ponavljanja; kad u svim serijama stigneš do gornjeg broja, dodaj najmanji korak tega. Većinu serija završi kad ti ostanu 1–3 ponavljanja u rezervi."],
  linear: ["Start light enough that all 5 × 5 feel easy. Every session you finish all reps, add 2.5 kg to bench, press and row and 5 kg to squat and deadlift. Miss twice in a row: take 10% off and build back up. Rest 2–3 minutes between heavy sets.",
    "Počni sa tegom sa kojim su svih 5 × 5 lagani. Svaki put kad završiš sva ponavljanja, dodaj 2,5 kg na bench, potisak i veslanje, a 5 kg na čučanj i mrtvo dizanje. Ako dva puta zaredom ne uspeš: skini 10% i ponovo gradi. Odmaraj 2–3 minuta između teških serija."],
  work: ["Heavy basics first, carries and core last. Add reps, then weight, like in the rest of the app. For carries add distance first, then weight. Keep your back straight and brace before every lift.",
    "Prvo teške osnovne vežbe, nošenja i trup na kraju. Dodaj ponavljanja, pa teg, kao i inače. Kod nošenja prvo produži razdaljinu, pa dodaj teg. Drži leđa prava i zategni trup pre svakog podizanja."],
  fatloss: ["Keep the weights heavy and try to hold your numbers: the calorie deficit burns the fat, the lifting keeps the muscle. Use the calorie calculator at the top and aim for about 0.5 kg a week. A cardio day can simply be a brisk walk.",
    "Drži teške tegove i trudi se da zadržiš brojke: kalorijski deficit topi masnoću, a tegovi čuvaju mišiće. Koristi kalkulator kalorija na vrhu i ciljaj oko 0,5 kg nedeljno. Kardio dan može biti i brza šetnja."],
  home: ["Add reps first. When you reach the top of the range, make it harder: lower slowly (3 s), add a pause, use a harder version or heavier dumbbells. Go close to failure: with light weights the last reps are the ones that count.",
    "Prvo dodaj ponavljanja. Kad stigneš do gornjeg broja, otežaj: spuštaj polako (3 s), dodaj pauzu, uzmi težu varijantu ili teže bučice. Idi blizu otkaza: sa lakim tegom poslednja ponavljanja su ona koja se računaju."],
  fifty: ["Use weights where the last 2–3 reps feel hard. Lift fast, lower slowly: that power helps on stairs and when you catch your balance. Add weight a little every few weeks. If a joint hurts (not the muscle), go lighter or pick an easier version.",
    "Koristi teg kod kog su poslednja 2–3 ponavljanja teška. Podiži brzo, spuštaj polako: ta eksplozivnost pomaže na stepenicama i kad hvataš ravnotežu. Dodaj malo tega na svakih par nedelja. Ako boli zglob (ne mišić), smanji teg ili uzmi lakšu varijantu."]
};

// goals: strength | muscle | fatloss | health | home    level: beginner | intermediate | advanced
export const PROGRAMS = [
  { id: "work", goals: ["strength"], level: "intermediate", mins: "60–75",
    title: ["Strength for physical work", "Snaga za fizički posao"],
    desc: ["Upper/lower split built for people who lift, carry and work on their feet: heavy basics plus carries, floor-to-shoulder lifts and core.",
      "Podela gornji/donji za ljude koji podižu, nose i rade na nogama: teške osnovne vežbe plus nošenja, podizanje sa poda do ramena i trup."],
    how: HOW.work, refs: ["lopez21", "grgic18", "schumann22"],
    workouts: [
      { id: "upper1", dow: 1, altDow: null, title: ["Upper 1", "Gornji 1"], sub: ["Push, pull, shoulder health", "Guranje, vučenje, zdravlje ramena"], ex: [
        { id: "bench", name: ["Bench press / machine chest press", "Bench press / mašina za grudi"], sets: ["3–4 × 6–10", "3–4 × 6–10"] },
        { id: "mpress", name: ["Machine shoulder press", "Potisak za ramena na mašini"], sets: ["3 × 8–10", "3 × 8–10"] },
        { id: "pullups", name: ["Pull-ups", "Zgibovi"], sets: ["lots of sets", "puno serija"] },
        { id: "row", name: ["Row (cable / machine)", "Veslanje (sajla / mašina)"], sets: ["3 × 10–12", "3 × 10–12"] },
        { id: "sidedelt", name: ["Side delt raises", "Lateralna podizanja"], sets: ["3 × 12–15", "3 × 12–15"] },
        { id: "facepull", name: ["Face pulls", "Face pull"], sets: ["3 × 15", "3 × 15"] },
        { id: "biceps", name: ["Biceps", "Biceps"], sets: ["1–2 exercises", "1–2 vežbe"], optional: true },
        { id: "triceps", name: ["Triceps", "Triceps"], sets: ["1–2 exercises", "1–2 vežbe"], optional: true },
        { id: "grip1", name: ["Farmer's carry (replaces forearms)", "Farmerski hod (umesto podlaktica)"], sets: ["3 × 30 m", "3 × 30 m"] }
      ]},
      { id: "lowerA", dow: 2, altDow: 3, title: ["Lower A", "Donji A"], sub: ["Strength day", "Dan snage"], ex: [
        { id: "squat", name: ["Squat", "Čučanj"], sets: ["3–4 × 5–8", "3–4 × 5–8"] },
        { id: "rdl", name: ["Romanian deadlift", "Rumunsko mrtvo dizanje"], sets: ["3 × 8", "3 × 8"] },
        { id: "bss", name: ["Bulgarian split squat", "Bugarski čučanj"], sets: ["3 × 8 / side", "3 × 8 / strana"] },
        { id: "legcurlA", name: ["Leg curls", "Pregib nogu (leg curl)"], sets: ["3 × 10–12", "3 × 10–12"] },
        { id: "farmer", name: ["Farmer's carry, heavy", "Farmerski hod, teško"], sets: ["4 × 30–40 m", "4 × 30–40 m"] },
        { id: "deadbug", name: ["Dead bug or Pallof press", "Dead bug ili Pallof potisak"], sets: ["3 × 8–10 / side", "3 × 8–10 / strana"] }
      ]},
      { id: "upper2", dow: 5, altDow: null, title: ["Upper 2", "Gornji 2"], sub: ["Standing press, rotation", "Potisak iz stajanja, rotacija"], ex: [
        { id: "bench", name: ["Bench press / machine chest press", "Bench press / mašina za grudi"], sets: ["3–4 × 6–10", "3–4 × 6–10"] },
        { id: "ohp", name: ["Standing overhead press (DB or barbell)", "Potisak iznad glave iz stajanja (bučice ili šipka)"], sets: ["3 × 6–8", "3 × 6–8"] },
        { id: "pullups", name: ["Pull-ups", "Zgibovi"], sets: ["lots of sets", "puno serija"] },
        { id: "row", name: ["Row (cable / machine)", "Veslanje (sajla / mašina)"], sets: ["3 × 10–12", "3 × 10–12"] },
        { id: "sidedelt", name: ["Side delt raises", "Lateralna podizanja"], sets: ["3 × 12–15", "3 × 12–15"] },
        { id: "facepull", name: ["Face pulls", "Face pull"], sets: ["3 × 15", "3 × 15"] },
        { id: "landmine", name: ["Landmine rotations", "Landmine rotacije"], sets: ["3 × 8 / side", "3 × 8 / strana"] },
        { id: "biceps", name: ["Biceps", "Biceps"], sets: ["1–2 exercises", "1–2 vežbe"], optional: true },
        { id: "triceps", name: ["Triceps", "Triceps"], sets: ["1–2 exercises", "1–2 vežbe"], optional: true },
        { id: "grip2", name: ["Plate pinch carry (replaces forearms)", "Nošenje ploča štipanjem (umesto podlaktica)"], sets: ["3 × 30 m", "3 × 30 m"] }
      ]},
      { id: "lowerB", dow: 6, altDow: null, title: ["Lower B", "Donji B"], sub: ["Work simulation day", "Dan simulacije posla"], ex: [
        { id: "deadlift", name: ["Trap bar or conventional deadlift", "Mrtvo dizanje (trap šipka ili klasično)"], sets: ["3 × 5", "3 × 5"] },
        { id: "sandbag", name: ["Sandbag / KB floor to shoulder", "Džak / girja od poda do ramena"], sets: ["4 × 5 / side", "4 × 5 / strana"] },
        { id: "swings", name: ["Kettlebell swings", "Zamasi girjom"], sets: ["3 × 15", "3 × 15"] },
        { id: "legext", name: ["Leg extensions + leg curls", "Opružanje + pregib nogu"], sets: ["2–3 × 12 each", "2–3 × 12 svaka"], optional: true },
        { id: "suitcase", name: ["Suitcase carry", "Nošenje kofera (jednom rukom)"], sets: ["3 × 30 m / side", "3 × 30 m / strana"] },
        { id: "backext", name: ["Back extensions", "Hiperekstenzije"], sets: ["3 × 12–15", "3 × 12–15"] },
        { id: "sideplank", name: ["Side plank", "Bočni plank"], sets: ["3 × 30–45 s / side", "3 × 30–45 s / strana"] }
      ]}
    ]},

  { id: "fb3", goals: ["muscle", "strength"], level: "beginner", mins: "45–60",
    title: ["Beginner full body", "Celo telo za početnike"],
    desc: ["The classic way to start: three full-body days, mostly machines and dumbbells, every muscle trained three times a week.",
      "Klasičan početak: tri treninga za celo telo, uglavnom mašine i bučice, svaki mišić tri puta nedeljno."],
    how: HOW.double, refs: ["acsm09", "schoenfeld16", "refalo23", "roberts20"],
    workouts: [
      w("fb3a", 0, ["Full body A", "Celo telo A"], ["Squat, chest, back", "Čučanj, grudi, leđa"], [
        e("squat", "3 × 8–12"), e("dbpress", "3 × 8–12"), e("latpd", "3 × 8–12"), e("legcurl", "2 × 10–15"), e("plank", "3 × 30–45 s")]),
      w("fb3b", 2, ["Full body B", "Celo telo B"], ["Hinge, shoulders, row", "Pregib kukova, ramena, veslanje"], [
        e("rdl", "3 × 8–12"), e("dbohp", "3 × 8–12"), e("row", "3 × 10–12"), e("legpress", "3 × 10–12"), opt("biceps", "2 × 10–15")]),
      w("fb3c", 4, ["Full body C", "Celo telo C"], ["Glutes, incline, single leg", "Gluteus, kosi potisak, jedna noga"], [
        e("hipthrust", "3 × 8–12"), e("incdb", "3 × 8–12"), e("dbrow", "3 × 10–12 / side"), e("lunges", "2 × 10 / leg"), opt("triceps", "2 × 10–15")])
    ]},

  { id: "fb2", goals: ["health", "muscle"], level: "beginner", mins: "40–50",
    title: ["Busy: full body 2× a week", "Zauzeti: celo telo 2× nedeljno"],
    desc: ["The minimum that clearly works: two full-body sessions a week. Good for busy weeks, coming back after a break, or next to a sport.",
      "Minimum koji sigurno radi: dva treninga za celo telo nedeljno. Za zauzete nedelje, povratak posle pauze ili uz neki sport."],
    how: HOW.double, refs: ["iversen21", "who20", "acsm09"],
    workouts: [
      w("fb2a", 0, ["Full body A", "Celo telo A"], ["Squat, chest, back", "Čučanj, grudi, leđa"], [
        e("squat", "3 × 6–10"), e("dbpress", "3 × 8–12"), e("latpd", "3 × 8–12"), e("rdl", "2 × 8–10"), e("plank", "2 × 30–60 s")]),
      w("fb2b", 3, ["Full body B", "Celo telo B"], ["Legs, shoulders, row", "Noge, ramena, veslanje"], [
        e("legpress", "3 × 10–12"), e("dbohp", "3 × 8–12"), e("row", "3 × 10–12"), e("hipthrust", "2 × 8–12"), e("pushups", "2 × max reps")])
    ]},

  { id: "str5", goals: ["strength"], level: "beginner", mins: "45–60",
    title: ["Barbell strength 5 × 5", "Snaga sa šipkom 5 × 5"],
    desc: ["The well-known 5 × 5 approach: a few big barbell lifts, heavy and often, adding weight every session. Fastest way to get strong in your first year.",
      "Poznati 5 × 5 pristup: nekoliko velikih vežbi sa šipkom, teško i često, sa dodavanjem tega svaki trening. Najbrži put do snage u prvoj godini."],
    how: HOW.linear, refs: ["lopez21", "grgic18", "acsm09"],
    workouts: [
      w("str5a", 0, ["Day A", "Dan A"], ["Squat, bench, row", "Čučanj, bench, veslanje"], [
        e("squat", "5 × 5"), e("bench", "5 × 5"), e("bbrow", "5 × 5"), opt("plank", "2 × 30–60 s")]),
      w("str5b", 2, ["Day B", "Dan B"], ["Squat, press, deadlift", "Čučanj, potisak, mrtvo dizanje"], [
        e("squat", "5 × 5"), e("ohp", "5 × 5"), e("deadlift", "1 × 5"), e("pullups", "3 × max reps")]),
      w("str5c", 4, ["Day C", "Dan C"], ["Squat, bench, row", "Čučanj, bench, veslanje"], [
        e("squat", "5 × 5"), e("bench", "5 × 5"), e("bbrow", "5 × 5"), opt("dips", "3 × max reps")])
    ]},

  { id: "ul4", goals: ["muscle"], level: "intermediate", mins: "60–75",
    title: ["Upper / lower for muscle", "Gornji / donji za mišićnu masu"],
    desc: ["Four days, every muscle twice a week with 10–16 hard sets: the best-supported setup for building muscle once beginner gains slow down.",
      "Četiri dana, svaki mišić dva puta nedeljno sa 10–16 teških serija: najbolje potkrepljena podela za rast mišića kad početnički napredak uspori."],
    how: HOW.double, refs: ["schoenfeld16", "pelland24", "refalo23", "roberts20"],
    workouts: [
      w("ul4ua", 0, ["Upper A", "Gornji A"], ["Heavy press and row", "Težak potisak i veslanje"], [
        e("bench", "4 × 6–8"), e("bbrow", "4 × 8–10"), e("dbohp", "3 × 8–12"), e("latpd", "3 × 10–12"),
        e("sidedelt", "3 × 12–20"), opt("triceps", "2 × 10–15"), opt("biceps", "2 × 10–15")]),
      w("ul4la", 1, ["Lower A", "Donji A"], ["Squat focus", "Fokus na čučanj"], [
        e("squat", "4 × 6–8"), e("rdl", "3 × 8–10"), e("legpress", "3 × 10–12"), e("legcurl", "3 × 10–12"), e("calf", "4 × 10–15")]),
      w("ul4ub", 3, ["Upper B", "Gornji B"], ["Incline, pull-ups, arms", "Kosi potisak, zgibovi, ruke"], [
        e("incdb", "4 × 8–10"), e("pullups", "4 × 6–10"), e("dbrow", "3 × 10–12 / side"), e("chestfly", "3 × 12–15"),
        e("sidedelt", "3 × 12–20"), e("biceps", "3 × 10–15"), e("triceps", "3 × 10–15")]),
      w("ul4lb", 4, ["Lower B", "Donji B"], ["Glutes and hamstrings", "Gluteus i zadnja loža"], [
        e("hipthrust", "4 × 8–12"), e("bss", "3 × 8–12 / leg"), e("quadext", "3 × 12–15"), e("legcurl", "3 × 10–15"),
        e("calf", "4 × 10–15"), opt("hkr", "3 × 10–15")])
    ]},

  { id: "ppl6", goals: ["muscle"], level: "advanced", mins: "60–75",
    title: ["Push / pull / legs", "Guranje / vučenje / noge"],
    desc: ["Six days for experienced lifters who love the gym: each muscle twice a week with high volume. Fewer days? Run push, pull, legs once (3 days).",
      "Šest dana za iskusne koji vole teretanu: svaki mišić dva puta nedeljno, veliki obim. Manje dana? Uradi guranje, vučenje, noge jednom (3 dana)."],
    how: HOW.double, refs: ["schoenfeld16", "pelland24", "refalo23"],
    workouts: [
      w("pplpa", 0, ["Push A", "Guranje A"], ["Chest, shoulders, triceps", "Grudi, ramena, triceps"], [
        e("bench", "4 × 5–8"), e("dbohp", "3 × 8–12"), e("incdb", "3 × 8–12"), e("sidedelt", "3 × 12–20"), e("triceps", "3 × 10–15")]),
      w("pplla", 1, ["Pull A", "Vučenje A"], ["Back, rear delts, biceps", "Leđa, zadnja ramena, biceps"], [
        e("pullups", "4 × 6–10"), e("bbrow", "3 × 8–10"), e("latpd", "3 × 10–12"), e("facepull", "3 × 15"), e("biceps", "3 × 10–15")]),
      w("ppllga", 2, ["Legs A", "Noge A"], ["Squat focus", "Fokus na čučanj"], [
        e("squat", "4 × 5–8"), e("rdl", "3 × 8–10"), e("legpress", "3 × 10–12"), e("legcurl", "3 × 10–12"), e("calf", "4 × 10–15")]),
      w("pplpb", 3, ["Push B", "Guranje B"], ["Shoulders, chest, triceps", "Ramena, grudi, triceps"], [
        e("ohp", "4 × 5–8"), e("dbpress", "3 × 8–12"), e("dips", "3 × 8–12"), e("chestfly", "3 × 12–15"), e("sidedelt", "3 × 12–20")]),
      w("ppllb", 4, ["Pull B", "Vučenje B"], ["Back width, biceps", "Širina leđa, biceps"], [
        e("latpd", "4 × 8–12"), e("dbrow", "3 × 10–12 / side"), e("row", "3 × 10–12"), e("facepull", "3 × 15"), e("biceps", "3 × 10–15")]),
      w("ppllgb", 5, ["Legs B", "Noge B"], ["Glutes, single leg", "Gluteus, jedna noga"], [
        e("hipthrust", "4 × 8–12"), e("bss", "3 × 8–12 / leg"), e("quadext", "3 × 12–15"), e("legcurl", "3 × 12–15"), e("calf", "4 × 10–15")])
    ]},

  { id: "glutes4", goals: ["muscle"], level: "beginner", mins: "50–65",
    title: ["Glutes & legs focus", "Fokus na gluteus i noge"],
    desc: ["Two lower days heavy on glutes, two lighter upper days, plus a glute finisher. Very popular with women, works the same for anyone.",
      "Dva dana za donji deo sa naglaskom na gluteus, dva lakša za gornji, plus završnica za gluteus. Veoma popularno kod žena, a radi isto za svakoga."],
    how: HOW.double, refs: ["plotkin23", "contreras15", "roberts20", "schoenfeld16"],
    workouts: [
      w("glq", 0, ["Glutes & quads", "Gluteus i kvadricepsi"], ["Hip thrust and squat", "Hip thrust i čučanj"], [
        e("hipthrust", "4 × 6–10"), e("squat", "3 × 6–10"), e("bss", "3 × 8–12 / leg"), e("abduction", "3 × 12–20"), opt("calf", "3 × 10–15")]),
      w("glua", 1, ["Upper A", "Gornji A"], ["Press and pull", "Potisak i vučenje"], [
        e("dbpress", "3 × 8–12"), e("latpd", "3 × 8–12"), e("dbohp", "3 × 8–12"), e("row", "3 × 10–12"), opt("sidedelt", "2 × 12–20")]),
      w("glh", 3, ["Glutes & hamstrings", "Gluteus i zadnja loža"], ["Hinge and step-ups", "Pregib kukova i step-up"], [
        e("rdl", "4 × 8–10"), e("hipthrust", "3 × 10–15"), e("stepups", "3 × 10 / leg"), e("legcurl", "3 × 10–15"), e("backext", "3 × 12–15")]),
      w("glub", 5, ["Upper B + glutes", "Gornji B + gluteus"], ["Upper body, glute finisher", "Gornji deo, završnica za gluteus"], [
        e("incdb", "3 × 8–12"), e("dbrow", "3 × 10–12 / side"), e("facepull", "3 × 15"), e("kickback", "3 × 12–15 / side"),
        e("abduction", "3 × 15–20"), opt("plank", "2 × 30–60 s")])
    ]},

  { id: "cut", goals: ["fatloss"], level: "beginner", mins: "45–60",
    title: ["Fat loss: lift + cardio", "Mršavljenje: tegovi + kardio"],
    desc: ["Three full-body strength days to keep your muscle while you lose fat, plus two cardio days. Pair it with the calorie calculator.",
      "Tri treninga snage za celo telo da sačuvaš mišiće dok topiš masnoću, plus dva kardio dana. Kombinuj sa kalkulatorom kalorija."],
    how: HOW.fatloss, refs: ["sardeli18", "schumann22", "who20", "lopez21"],
    workouts: [
      w("cuta", 0, ["Strength A", "Snaga A"], ["Full body + swings", "Celo telo + zamasi"], [
        e("squat", "3 × 6–10"), e("dbpress", "3 × 8–12"), e("latpd", "3 × 8–12"), e("rdl", "2 × 8–10"), e("swings", "4 × 15")]),
      w("cuti", 1, ["Cardio intervals", "Kardio intervali"], ["Short and hard", "Kratko i jako"], [
        e("intervals", "8 × 30 s hard / 90 s easy"), opt("plank", "3 × 30–60 s")]),
      w("cutb", 2, ["Strength B", "Snaga B"], ["Full body + carries", "Celo telo + nošenje"], [
        e("legpress", "3 × 10–12"), e("dbohp", "3 × 8–12"), e("row", "3 × 10–12"), e("hipthrust", "3 × 8–12"), e("farmer", "4 × 30 m")]),
      w("cutc", 4, ["Strength C", "Snaga C"], ["Full body + circuit", "Celo telo + kružni"], [
        e("goblet", "3 × 10–12"), e("incdb", "3 × 8–12"), e("dbrow", "3 × 10–12 / side"), e("lunges", "2 × 10 / leg"), e("pushups", "2 × max reps")]),
      w("cute", 5, ["Easy cardio", "Lagan kardio"], ["Walk, bike or swim", "Hodanje, bicikl ili plivanje"], [
        e("easycardio", "40–60 min")])
    ]},

  { id: "home3", goals: ["home", "muscle"], level: "beginner", mins: "35–45",
    title: ["Home: dumbbells + bodyweight", "Kod kuće: bučice + sopstvena težina"],
    desc: ["No gym needed: a pair of dumbbells, a chair and the floor. Light weights build muscle too, as long as the sets are hard.",
      "Bez teretane: par bučica, stolica i pod. I laki tegovi grade mišiće, samo da serije budu teške."],
    how: HOW.home, refs: ["kikuchi17", "lopez21", "refalo23"],
    workouts: [
      w("homea", 0, ["Home A", "Kuća A"], ["Squat, push, row", "Čučanj, guranje, veslanje"], [
        e("goblet", "3 × 10–15"), e("pushups", "3 × 8–20"), e("dbrow", "3 × 10–15 / side"), e("dbrdl", "3 × 10–15"), e("plank", "3 × 30–60 s")]),
      w("homeb", 2, ["Home B", "Kuća B"], ["Single leg, shoulders", "Jedna noga, ramena"], [
        e("bss", "3 × 8–15 / leg"), e("pike", "3 × 6–12"), e("invrow", "3 × 8–15"), e("glutebridge", "3 × 10–20 / leg"), e("deadbug", "3 × 8 / side")]),
      w("homec", 4, ["Home C", "Kuća C"], ["Lunges, press, hinge", "Iskoraci, potisak, pregib"], [
        e("lunges", "3 × 10 / leg"), e("dbohp", "3 × 8–15"), e("dbrow", "3 × 10–15 / side"), e("dbrdl", "3 × 10–15"),
        e("pushups", "2 × max reps"), e("sideplank", "2 × 30 s / side")])
    ]},

  { id: "fifty", goals: ["health"], level: "beginner", mins: "40–50",
    title: ["Strong & healthy 50+", "Snaga i zdravlje 50+"],
    desc: ["Joint-friendly machines, fast \"power\" reps and balance work: what research recommends to stay strong, mobile and independent with age.",
      "Mašine koje štede zglobove, brza \"eksplozivna\" ponavljanja i ravnoteža: ono što nauka preporučuje da sa godinama sačuvaš snagu, pokretljivost i samostalnost."],
    how: HOW.fifty, refs: ["fragala19", "who20", "acsm09"],
    workouts: [
      w("fiftya", 0, ["Day A", "Dan A"], ["Legs, chest, back, balance", "Noge, grudi, leđa, ravnoteža"], [
        e("legpress", "2–3 × 8–12"), e("mchest", "2–3 × 8–12"), e("latpd", "2–3 × 8–12"), e("sitstand", "3 × 6–8"),
        e("balance", "3 × 30 s / leg"), e("farmer", "3 × 20–30 m")]),
      w("fiftyb", 3, ["Day B", "Dan B"], ["Step-ups, shoulders, core", "Step-up, ramena, trup"], [
        e("stepups", "2–3 × 8 / leg"), e("row", "2–3 × 10–12"), e("mpress", "2 × 10–12"), e("glutebridge", "2 × 10 / leg"),
        e("suitcase", "3 × 20 m / side"), e("deadbug", "2 × 8 / side")])
    ]}
];
