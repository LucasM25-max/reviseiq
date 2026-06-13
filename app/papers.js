import { aiServiceMisconceptionExtractor, aiServiceQuestionGenerator, callGeminiSimple } from "./aiService.js";
import { ALL_SUBJECTS } from "./subjects.js";
import { B, C, I, stripHtml, uid } from "./ui.jsx";

export async function blurtAnalyse(notesText, blurtText) {
  return aiServiceMisconceptionExtractor(notesText, blurtText);
}

export async function generatePartedPaper(subjName, board, paper, mergedTopics) {
  var notesCtx = mergedTopics
    .flatMap(function (t) {
      return t.sections.flatMap(function (s) {
        return (s.notes || []).map(function (n) {
          return n.heading + ": " + stripHtml(n.body);
        });
      });
    })
    .slice(0, 12)
    .join("\n");
  var contextBlock = notesCtx
    ? "Revision content for context:\n" + notesCtx
    : "Use standard " + board + " GCSE " + subjName + " content.";
  var numGroups = paper.numGroups || 10;
  var specGuide = paper.specGuide || "";
  var totalMarks = paper.m || 80;
  var prompt =
    "You are an expert " +
    board +
    " GCSE " +
    subjName +
    " examiner and papersetter.\n" +
    "Generate a complete, realistic " +
    board +
    " GCSE " +
    subjName +
    ' mock exam: "' +
    paper.n +
    '".\n\n' +
    "CRITICAL MARKS REQUIREMENT: All parts across all questions MUST total EXACTLY " +
    totalMarks +
    " marks. Count carefully.\n" +
    "Time allowed: " +
    paper.d +
    " minutes.\n" +
    (paper.markDist ? "Mark distribution: " + paper.markDist + "\n" : "") +
    "\nSPECIFICATION GUIDANCE:\n" +
    specGuide +
    "\n" +
    "\nContext (use where relevant):\n" +
    contextBlock +
    "\n\n" +
    "Generate exactly " +
    numGroups +
    " numbered question groups.\n\n" +
    "STRUCTURE RULES:\n" +
    "- Each group is numbered (1, 2, 3...) and has 2-5 lettered parts: (a), (b), (c), (d), (e)\n" +
    "- Parts escalate in demand: (a) recall/state [1-2 marks] → middle partsdescribe/apply/calculate [2-4 marks] → final part explain/evaluate [4-9 marks]\n" +
    "- context field: optional shared stimulus (data table, scenario, diagram description, quote) —use empty string if none\n" +
    "- DO NOT include mark allocations in the question text\n" +
    "- Use authentic " +
    board +
    " command words: state, name, identify, describe, explain,calculate, evaluate, compare, suggest, justify, assess\n" +
    "- Mark schemes: detailed bullet-point using [1] per mark. Calculations: M1 method + A1answer. Extended: Level 1-3 or 1-4 descriptors + indicative content\n" +
    "- Cover DIVERSE topics — do not repeat the same topic twice\n" +
    "- Include at least one data-based or graph-based question\n\n" +
    "RESPOND ONLY with a valid JSON array. No markdown, no backticks, no extra text.\n" +
    "Each element:\n" +
    '{"id":"q1","type":"structured","number":1,"context":"stimulus text or emptystring","totalMarks":N,"parts":[\n' +
    ' {"label":"(a)","type":"short","marks":1,"text":"State...","markScheme":"• Correctanswer [1]"},\n' +
    ' {"label":"(b)","type":"short","marks":3,"text":"Describe...","markScheme":"• Point[1]\\n• Point [1]\\n• Point [1]"},\n' +
    '{"label":"(c)","type":"extended","marks":6,"text":"Evaluate...","markScheme":"Level 3(5-6): Detailed...\\nLevel 2 (3-4): Some...\\nLevel 1 (1-2): Basic...\\nIndicative content: ..."}\n' +
    "]}\n" +
    'For MCQ parts also include: "options":["A text","B text","C text","Dtext"],"answer":0,"explanation":"why A is correct"';
  var lastErr = null;
  for (var attempt = 0; attempt < 3; attempt++) {
    try {
      if (attempt > 0)
        await new Promise(function (res) {
          setTimeout(res, 1000 * attempt);
        });
      var raw = await callGeminiSimple(prompt, 7000);
      var fence = "`" + "`" + "`";
      raw = raw
        .split(fence + "json")
        .join("")
        .split(fence)
        .join("")
        .trim();
      var start = raw.indexOf("[");
      var end = raw.lastIndexOf("]");
      if (start < 0 || end < 0) throw new Error("No JSON array in response");
      raw = raw.slice(start, end + 1);
      var groups = JSON.parse(raw);
      if (!Array.isArray(groups) || !groups.length)
        throw new Error("Empty array");
      return groups.map(function (g) {
        return Object.assign({}, g, {
          id: g.id || "q" + (g.number || uid()),
          parts: (g.parts || []).map(function (p) {
            return Object.assign({}, p, {
              id: g.id + "-" + (p.label || uid()).replace(/[^a-z0-9]/gi, ""),
            });
          }),
        });
      });
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

export const MOCK_SPECS = {
  "maths:AQA": [
    {
      n: "Paper 1 – Non-Calculator",
      d: 90,
      m: 80,
      paperType: "parted",
      numGroups: 22,
      markDist:
        "Target EXACTLY 80 marks total. Start with 4–6 groups of 1–3 mark questions(recall/method), then 8–10 groups of 3–5 marks (application/multi-step), finish with 4–6 groupsof 5–8 marks (problem-solving/proof). A single 6-mark question should appear at least once.",
      specGuide:
        "AQA GCSE Maths Higher Tier — Paper 1 Non-Calculator. Cover: Number(fractions, surds, indices, standard form, HCF/LCM), Algebra (expanding brackets, factorising,solving equations/inequalities, sequences, simultaneous equations, quadratics, functions,proof), Ratio/Proportion/Rates (percentage change, direct/inverse proportion, compoundinterest), Geometry/Measures (angles, area, volume, circle theorems, transformations, vectors,Pythagoras), Probability, Statistics (averages, cumulative frequency, histograms). All questionsrequire written working. At least: one algebraic proof, one geometry question with circletheorems, one statistics interpretation. NO MCQs. Show method marks clearly.",
      desc: "1h 30min, 80 marks. No calculator allowed.",
      skills: ["Algebraic proof", "Circle theorems", "Show-that questions"],
    },
    {
      n: "Paper 2 – Calculator",
      d: 90,
      m: 80,
      paperType: "parted",
      numGroups: 22,
      markDist:
        "Target EXACTLY 80 marks. Mix 1-mark retrieval, 3-4 mark method, 5-6 markmulti-step reasoning. At least two questions with 5+ marks.",
      specGuide:
        "AQA GCSE Maths Higher Tier — Paper 2 Calculator. Include: trigonometry(sin/cos/tan, sine rule, cosine rule, 3D trig), bounds and error intervals, financial maths(compound/simple interest, depreciation), graph interpretation (distance-time, velocity-time,quadratic/cubic), reverse percentage, direct/inverse proportion, scatter graphs with correlation,similarity and congruence. Real-world context questions required. All written working shown.",
      desc: "1h 30min, 80 marks. Calculator allowed.",
      skills: ["Trigonometry", "Bounds", "Graph interpretation"],
    },
    {
      n: "Paper 3 – Calculator",
      d: 90,
      m: 80,
      paperType: "parted",
      numGroups: 22,
      markDist:
        "Target EXACTLY 80 marks. Synoptic — mix topics across questions. At least two6-mark questions requiring extended multi-step reasoning.",
      specGuide:
        "AQA GCSE Maths Higher Tier — Paper 3 Calculator. Synoptic paper —questions deliberately mix topics. Include: simultaneous equations (graphical and algebraic),circle theorems, vectors, enlargement/similar shapes, transformations, data analysis (box plots,cumulative frequency, histograms), algebraic fractions, iteration, further quadratics. At least two6-mark problem-solving questions. Heavier weighting on multi-step reasoning requiring 4+method steps.",
      desc: "1h 30min, 80 marks. Calculator allowed.",
      skills: ["Circle theorems", "Vectors", "Multi-step reasoning"],
    },
  ],
  "maths:Edexcel": [
    {
      n: "Paper 1 – Non-Calculator",
      d: 90,
      m: 80,
      paperType: "parted",
      numGroups: 22,
      markDist:
        "Target EXACTLY 80 marks. Start with short 1–2 mark recall questions; build to 4–6mark problem-solving. Each group should list marks clearly.",
      specGuide:
        "Edexcel GCSE Maths Higher Tier — Paper 1 Non-Calculator. Cover: indices andsurds, algebraic manipulation (expanding, factorising), solving linear and quadratic equations,sequences (nth term arithmetic and geometric), angles (parallel lines, polygons, circletheorems), area and volume (composite shapes, sector/arc), probability trees, averages fromfrequency tables. At least two groups should start with a 1-mark recall part before extending.NO MCQs.",
      desc: "1h 30min, 80 marks. No calculator allowed.",
      skills: ["Surds", "Algebraic fractions", "Angle proofs"],
    },
    {
      n: "Paper 2 – Calculator",
      d: 90,
      m: 80,
      paperType: "parted",
      numGroups: 22,
      markDist:
        "Target EXACTLY 80 marks. Include a balance of short (1–3 mark) and longer (4–6mark) questions.",
      specGuide:
        "Edexcel GCSE Maths Higher Tier — Paper 2 Calculator. Include: Pythagorastheorem in 2D and 3D, trigonometric ratios and graphs, cumulative frequency and box plots,scatter graphs and lines of best fit, ratio and proportion (recipe problems, map scales), standardform calculations, percentage change and reverse percentages, surface area and volume ofprisms/cylinders/cones/spheres.",
      desc: "1h 30min, 80 marks. Calculator allowed.",
      skills: ["3D Pythagoras", "Cumulative frequency", "Standard form"],
    },
    {
      n: "Paper 3 – Calculator",
      d: 90,
      m: 80,
      paperType: "parted",
      numGroups: 22,
      markDist:
        "Target EXACTLY 80 marks. More 5–6 mark multi-step questions than Papers 1and 2.",
      specGuide:
        "Edexcel GCSE Maths Higher Tier — Paper 3 Calculator. More demandingquestions. Include: circle theorems (tangent, chord, alternate segment), similar shapes andscale factors (area/volume scale factors), 3D trigonometry, conditional probability and Venndiagrams, set notation, further algebraic proof, transformations of graphs, iteration to find roots.Questions should require students to select and chain methods.",
      desc: "1h 30min, 80 marks. Calculator allowed.",
      skills: [
        "Circle theorems",
        "Conditional probability",
        "Graph transformations",
      ],
    },
  ],
  "bio:AQA": [
    {
      n: "Paper 1",
      d: 105,
      m: 100,
      paperType: "parted",
      numGroups: 9,
      markDist:
        "Target EXACTLY 100 marks. Section A: one group of exactly 4 MCQ parts (1 markeach, use type:mcq). Section B: 8 groups of structured questions mixing 1-mark recall, 2-markdescribe, 3-4 mark explain, ending each group with one 6-mark extended writing question(level-based mark scheme with L1/L2/L3 descriptors). Total MCQ = 4 marks; structured = 96marks.",
      specGuide:
        "AQA GCSE Biology Paper 1. Duration 1h 45min. Topics 1–4 only: (1) CellBiology — cell structure (animal/plant/bacterial), microscopy calculations, mitosis, cell cycle,stem cells, diffusion/osmosis/active transport with calculations; (2) Organisation — digestivesystem enzymes, food tests, heart/circulatory system, coronary heart disease, cancer, planttissue/transport; (3) Infection and Response — communicable diseases,bacteria/viruses/fungi/protists, immune system, vaccination, antibiotics, drug development; (4)Bioenergetics — photosynthesis (word/symbol equation, factors, uses of glucose),aerobic/anaerobic respiration, exercise effects, metabolism. Required practicals: osmosis inpotatoes, enzyme rate experiments, iodine test, Benedict's test. Include at least 2 mathsquestions (percentage change, magnification formula). Each group ends with a 6-marklevel-based extended writing question.",
      desc: "1h 45min, 100 marks. Topics 1–4: Cell Biology, Organisation, Infection & Response,Bioenergetics.",
      skills: [
        "Extended writing (6 marks)",
        "Maths skills",
        "Required practicals",
      ],
    },
    {
      n: "Paper 2",
      d: 105,
      m: 100,
      paperType: "parted",
      numGroups: 9,
      markDist:
        "Target EXACTLY 100 marks. Section A: one group of 4 MCQ parts. Section B: 8groups of structured questions, each ending with one 6-mark extended writing question.",
      specGuide:
        "AQA GCSE Biology Paper 2. Duration 1h 45min. Topics 5–7 only: (5)Homeostasis and Response — nervous system (CNS/receptors/effectors/reflex arc), hormones(endocrine system, ADH, blood glucose regulation, insulin/glucagon, diabetes,thermoregulation, menstrual cycle, fertility treatment, contraception, plant hormones/tropisms);(6) Inheritance, Variation and Evolution — DNA/genes/chromosomes/alleles, Mendel, geneticdiagrams (monohybrid cross, Punnett square, sex determination), variation, mutation, naturalselection, Darwin/Wallace, extinction, selective breeding, genetic engineering, cloning; (7)Ecology — ecosystems, food webs/chains, biotic/abiotic factors, adaptations, competition,sampling methods, human impacts on biodiversity, maintaining biodiversity,carbon/water/nitrogen cycles, decomposition, global warming. Include at least 2 mathsquestions. Each group ends with a 6-mark extended writing question.",
      desc: "1h 45min, 100 marks. Topics 5–7: Homeostasis, Inheritance, Ecology.",
      skills: [
        "Genetic diagrams",
        "Homeostasis mechanisms",
        "Ecology calculations",
      ],
    },
  ],
  "chem:AQA": [
    {
      n: "Paper 1",
      d: 105,
      m: 100,
      paperType: "parted",
      numGroups: 9,
      markDist:
        "Target EXACTLY 100 marks. One group of 4 MCQ parts (type:mcq). Eight groupsof structured questions, each ending with one 6-mark extended writing question. Include at least3 maths calculation questions.",
      specGuide:
        "AQA GCSE Chemistry Paper 1. Duration 1h 45min. Topics 1–5: (1) AtomicStructure and Periodic Table — atomic model history, subatomic particles, electronconfiguration, periodic table groups/periods, Group 1/7/0 properties, transition metals; (2)Bonding/Structure/Properties — ionic/covalent/metallic bonding, giant ionic/simplemolecular/giant covalent/metallic structures, allotropes of carbon, polymer properties; (3)Quantitative Chemistry — relative formula mass (Mr), moles, balancing equations, molecalculations (mass/Mr), limiting reactants, % yield, atom economy calculations; (4) ChemicalChanges — reactivity series, displacement reactions, extraction of metals, reduction,electrolysis (products at electrodes), acids/bases/neutralisation, making salts; (5) EnergyChanges — exothermic/endothermic reactions, bond energies, reaction profiles. Requiredpracticals: electrolysis, titration, temperature change. Maths: at least 2 mole calculationgroups.",
      desc: "1h 45min, 100 marks. Topics 1–5: Atomic structure, Bonding, Quantitative chemistry,Chemical changes, Energy.",
      skills: ["Mole calculations", "Electrolysis", "6-mark extended writing"],
    },
    {
      n: "Paper 2",
      d: 105,
      m: 100,
      paperType: "parted",
      numGroups: 9,
      markDist:
        "Target EXACTLY 100 marks. One group of 4 MCQ parts. Eight structured groupsending each with a 6-mark extended writing question.",
      specGuide:
        "AQA GCSE Chemistry Paper 2. Duration 1h 45min. Topics 6–10: (6) Rate andExtent of Chemical Change — collision theory, factors affecting rate(temperature/concentration/surface area/catalysts), rate calculations, reversible reactions, LeChatelier's principle; (7) Organic Chemistry — crude oil/fractional distillation, alkanes(combustion), cracking, alkenes (addition reactions, bromine water test), alcohols, carboxylicacids, condensation polymers, addition polymers; (8) Chemical Analysis — pure substances,paper chromatography (Rf values), gas tests (O2/CO2/H2/Cl2/NH3), flame tests, precipitatetests; (9) Atmospheric Science — evolution of Earth's atmosphere, greenhouse effect, airpollutants; (10) Using Resources — finite/renewable resources, water treatment, Haber process(conditions/equilibrium), life cycle assessment, carbon footprint, alternatives to plastics. IncludeRf value calculation and rate of reaction graph analysis.",
      desc: "1h 45min, 100 marks. Topics 6–10: Rates, Organic chemistry, Analysis, Atmosphere,Resources.",
      skills: [
        "Organic chemistry naming",
        "Rate calculations",
        "Haber process",
      ],
    },
  ],
  "phys:AQA": [
    {
      n: "Paper 1",
      d: 105,
      m: 100,
      paperType: "parted",
      numGroups: 9,
      markDist:
        "Target EXACTLY 100 marks. One group of 4 MCQ parts. Eight structured groups;each group must include at least one calculation with formula/substitution/answer/units. Eachgroup ends with one 6-mark extended writing question.",
      specGuide:
        "AQA GCSE Physics Paper 1. Duration 1h 45min. Topics 1–4: (1) Energy —energy stores and transfers, conservation of energy, kinetic/gravitational/elastic potential energycalculations (KE=½mv², GPE=mgh, Ee=½ke²), power (P=E/t, P=W/t), efficiency calculations,thermal conductivity, specific heat capacity (Q=mcΔT), required practical; (2) Electricity —current/potential difference/resistance (V=IR), series/parallel circuits, electrical power (P=IV,P=I²R), energy transfer (E=Pt, E=QV), static electricity, electric fields, mains supply, nationalgrid, transformers (Vp/Vs=np/ns); (3) Particle Model of Matter — density (ρ=m/V), states ofmatter, internal energy, specific heat capacity, specific latent heat (Q=mL), gaspressure/temperature/volume (pV=const, p/T=const); (4) Atomic Structure — nuclear modelhistory, atomic structure, isotopes, radioactive decay (alpha/beta/gamma), nuclear equations,half-life calculations, fission and fusion. Every group MUST show: formula stated → substitution→ working → answer with units.",
      desc: "1h 45min, 100 marks. Topics 1–4: Energy, Electricity, Particle model, Atomicstructure.",
      skills: [
        "Multi-step calculations",
        "Nuclear equations",
        "Energy efficiency",
      ],
    },
    {
      n: "Paper 2",
      d: 105,
      m: 100,
      paperType: "parted",
      numGroups: 9,

      markDist:
        "Target EXACTLY 100 marks. One group of 4 MCQ parts. Eight structured groupseach with at least one calculation and one 6-mark extended writing question.",
      specGuide:
        "AQA GCSE Physics Paper 2. Duration 1h 45min. Topics 5–8: (5) Forces —scalar/vector, resultant forces, moments (M=Fd), pressure (p=F/A, p=hρg),distance/speed/velocity/acceleration (v=u+at, v²=u²+2as, s=ut+½at²), Newton's laws, inertia,momentum (p=mv, conservation of momentum), stopping distances, drag; (6) Waves —transverse/longitudinal, wave equation (v=fλ), reflection/refraction/TIR, EM spectrum(properties/uses/dangers), sound, required practical (ripple tank/waves on string); (7)Magnetism and Electromagnetism — magnetic fields, motor effect (F=BIL), Fleming's left-handrule, induced EMF (generator effect), AC generator, transformers; (8) Space Physics — solarsystem, life cycle of stars, orbital motion, red-shift/Big Bang evidence. Every calculation group:formula → substitution → working → answer with units.",
      desc: "1h 45min, 100 marks. Topics 5–8: Forces, Waves, Electromagnetism, Space.",
      skills: ["Momentum calculations", "EM spectrum", "Wave equations"],
    },
  ],
  "bio:Edexcel": [
    {
      n: "Paper 1",
      d: 105,
      m: 100,
      paperType: "parted",
      numGroups: 7,
      markDist:
        "Target EXACTLY 100 marks. Section A: one group of exactly 10 MCQ parts (1mark each, use type:mcq). Section B: 6 groups of structured questions totalling 90 marks. Mix of2-mark describe, 3-mark explain, 4-mark analysis, 6-mark extended writing.",
      specGuide:
        "Edexcel GCSE Biology Paper 1. Duration 1h 45min. Topics 1–5: Key concepts ofbiology (cells, microscopy, diffusion, osmosis, enzymes), Cells and control (mitosis, cell cycle,stem cells, cancer), Genetics (DNA, meiosis, genetic inheritance, mutation), Natural selectionand genetic modification (adaptation, evolution, selective breeding, GMOs), Health, disease andthe development of medicines (communicable diseases, non-communicable diseases, drugdevelopment). Section A must be exactly 10 MCQs. Section B groups start with short recall andbuild to 6-mark extended writing. Include at least 2 practical-based questions.",
      desc: "1h 45min, 100 marks. Topics 1–5. Section A: 10 MCQs. Section B: structuredquestions.",
      skills: ["10 MCQs", "Genetic inheritance", "Extended writing"],
    },
    {
      n: "Paper 2",
      d: 105,
      m: 100,
      paperType: "parted",
      numGroups: 7,
      markDist:
        "Target EXACTLY 100 marks. One group of 10 MCQ parts. Six structured groupstotalling 90 marks. Final group should be a synoptic question linking multiple topics.",
      specGuide:
        "Edexcel GCSE Biology Paper 2. Duration 1h 45min. Topics 1–7 synoptic: Plantstructures and their functions (photosynthesis, transpiration, plant hormones), Animalcoordination, control and homeostasis (endocrine system, blood glucose regulation,thermoregulation, kidney/water balance), Exchange and transport in animals (circulatorysystem, heart, gas exchange, lung structure), Ecosystems and material cycles (foodchains/webs, population size, carbon cycle, water cycle, decomposition, biodiversity). Synopticquestions should link topics from Papers 1 and 2. Include data analysis. Section A: 10 MCQs. Atleast one 6-mark extended writing question.",
      desc: "1h 45min, 100 marks. Topics 1–7 synoptic. Section A: 10 MCQs.",
      skills: ["Synoptic questions", "Data analysis", "Homeostasis"],
    },
    {
      n: "Paper 3",
      d: 75,
      m: 70,
      paperType: "parted",
      numGroups: 5,

      markDist:
        "Target EXACTLY 70 marks. One group of 5 MCQ parts. Four structured groups;include extended analysis and evaluation questions.",
      specGuide:
        "Edexcel GCSE Biology Paper 3. Duration 1h 15min. Synoptic — focuses onpractical skills, data analysis, and experimental evaluation. Questions reference all 7 topicareas. Section A: 5 MCQs. Section B: 4 structured groups each based on a data set orexperimental scenario. Students must: describe patterns in data, suggest explanations, evaluatemethods, calculate means/percentages/rates, and draw conclusions. Include at least onequestion on planning an investigation (variables, controls, reliability).",
      desc: "1h 15min, 70 marks. Synoptic — practical skills and data analysis.",
      skills: ["Data analysis", "Experimental design", "Synoptic reasoning"],
    },
  ],
  "chem:Edexcel": [
    {
      n: "Paper 1",
      d: 105,
      m: 100,
      paperType: "parted",
      numGroups: 7,
      markDist:
        "Target EXACTLY 100 marks. One group of 10 MCQs. Six structured groups mixingshort-answer and calculation questions. At least 3 calculation questions (moles, Mr, percentageyield).",
      specGuide:
        "Edexcel GCSE Chemistry Paper 1. Duration 1h 45min. Topics 1–6: Atomicstructure (Bohr model, electron configuration, isotopes), Periodic Table (groups/periods, Group1/7/0 properties, transition metals), Structure, bonding and properties of matter(ionic/covalent/metallic, giant/simple structures, allotropes), Quantitative chemistry (moles, Mr,mole calculations, limiting reactants, percentage yield, concentration of solutions), Chemical andionic equations (balancing, state symbols), Electrolysis (products at electrodes, half equations).Section A: 10 MCQs. Section B: mole calculation questions MUST show formula → substitution→ answer → unit.",
      desc: "1h 45min, 100 marks. Topics 1–6. Section A: 10 MCQs. Section B: structured.",
      skills: [
        "Mole calculations",
        "Electrolysis half-equations",
        "Bonding structures",
      ],
    },
    {
      n: "Paper 2",
      d: 105,
      m: 100,
      paperType: "parted",
      numGroups: 7,
      markDist:
        "Target EXACTLY 100 marks. One group of 10 MCQs. Six structured groupssynoptic. Include rate calculations and organic chemistry naming.",
      specGuide:
        "Edexcel GCSE Chemistry Paper 2. Duration 1h 45min. Topics 1–9 synoptic:Acids, bases and salts (neutralisation, preparing salts, pH), Obtaining and using metals(reactivity series, extracting iron in blast furnace, aluminium by electrolysis, life cycleassessment), Reversible reactions and equilibria (Le Chatelier's principle, Haber processconditions/equilibrium), Organic chemistry (homologous series,alkanes/alkenes/alcohols/carboxylic acids/esters, addition/condensation polymerisation,cracking), Chemical analysis (chromatography Rf values, gas tests, flame tests, precipitatetests), Earth and atmospheric science (atmosphere composition, greenhouse effect, globalwarming, air pollution). Section A: 10 MCQs. Rf calculation and rate graph interpretationrequired.",
      desc: "1h 45min, 100 marks. Topics 1–9 synoptic. Section A: 10 MCQs.",
      skills: [
        "Organic naming",
        "Rf calculations",
        "Haber process equilibrium",
      ],
    },
  ],
  "phys:Edexcel": [
    {
      n: "Paper 1",
      d: 105,
      m: 100,
      paperType: "parted",
      numGroups: 7,

      markDist:
        "Target EXACTLY 100 marks. One group of 10 MCQs. Six structured groups. Everycalculation MUST show: formula → substitution → working → answer with units.",
      specGuide:
        "Edexcel GCSE Physics Paper 1. Duration 1h 45min. Topics 1–6: Motion(distance/displacement/speed/velocity/acceleration, s-t and v-t graphs, equations of motionv=u+at, v²=u²+2as, s=½(u+v)t), Forces and motion (Newton's laws, resultant force, F=ma,weight W=mg, friction, momentum p=mv, conservation of momentum, stopping distances),Conservation of energy (kinetic KE=½mv², gravitational GPE=mgh, elastic Ee=½ke², efficiency,power P=W/t), Waves (wave equation v=fλ, reflection, refraction, EM spectrum, sound), Lightand the EM spectrum (absorption/reflection/transmission, colour, uses of EM waves),Radioactivity (atomic structure, nuclear decay, half-life, uses of radiation). Section A: 10 MCQs.All calculations show full working.",
      desc: "1h 45min, 100 marks. Topics 1–6. Section A: 10 MCQs.",
      skills: ["Equations of motion", "Energy calculations", "Half-life"],
    },
    {
      n: "Paper 2",
      d: 105,
      m: 100,
      paperType: "parted",
      numGroups: 7,
      markDist:
        "Target EXACTLY 100 marks. One group of 10 MCQs. Six structured groupsincluding at least 2 electricity calculation groups and one space/astronomy group.",
      specGuide:
        "Edexcel GCSE Physics Paper 2. Duration 1h 45min. Topics 1–8 includingAstronomy: Astronomy (solar system, lifecycle of stars, red-shift, Big Bang), Energy —resources (renewable/non-renewable, advantages/disadvantages, power station efficiency),Electric circuits (current/voltage/resistance V=IR, series/parallel circuits, power P=IV and P=I²R,energy E=Pt), Static electricity (charge, electric fields, sparking), Magnetism and the motoreffect (magnetic fields, F=BIL, Fleming's left-hand rule), Electromagnetic induction (generatoreffect, AC generator, transformer equation Vp/Vs=np/ns), Particle model (density ρ=m/V, SHCQ=mcΔT, SLH Q=mL, gas laws). Section A: 10 MCQs. All calculations: formula → substitution→ answer → unit.",
      desc: "1h 45min, 100 marks. Topics 1–8 including Astronomy. Section A: 10 MCQs.",
      skills: ["Transformer calculations", "Circuit analysis", "Gas laws"],
    },
  ],
  "eng-lang:AQA": [
    {
      n: "Paper 1 – Explorations in Creative Reading & Writing",
      d: 105,
      m: 80,
      paperType: "structured",
      paperPrompt: "eng-lang-p1",
      desc: "1h 45min, 80 marks. Section A: 4 reading questions (40 marks). Section B: creativewriting (40 marks).",
      skills: [
        "Reading comprehension",
        "Language analysis",
        "Creative writing",
      ],
      configFields: [],
    },
    {
      n: "Paper 2 – Writers' Viewpoints & Perspectives",
      d: 105,
      m: 80,
      paperType: "comingSoon",
      desc: "Coming soon — non-fiction reading & transactional writing.",
      skills: [],
    },
  ],
  "eng-lit:AQA": [
    {
      n: "Paper 1 – Shakespeare & 19th-Century Novel",
      d: 105,
      m: 64,
      paperType: "structured",
      paperPrompt: "eng-lit-p1",
      desc: "1h 45min, 64 marks. Section A: Shakespeare (34 marks). Section B: 19th-centurynovel (30 marks).",
      skills: [
        "Shakespeare analysis",
        "19th-century prose",
        "Level-based mark schemes",
      ],

      configFields: [
        {
          id: "shakespeare",
          label: "Shakespeare text",
          type: "select",
          options: [
            "Macbeth",
            "Romeo andJuliet",
            "The Tempest",
            "The Merchant of Venice",
            "Much Ado About Nothing",
            "JuliusCaesar",
          ],
          default: "Macbeth",
        },
        {
          id: "novel",
          label: "19th-century novel",
          type: "select",
          options: [
            "A Christmas Carol",
            "TheStrange Case of Dr Jekyll and Mr Hyde",
            "Great Expectations",
            "Jane Eyre",
            "Frankenstein",
            "Prideand Prejudice",
            "The Sign of Four",
          ],
          default: "A Christmas Carol",
        },
      ],
    },
    {
      n: "Paper 2 – Modern Texts & Poetry",
      d: 135,
      m: 96,
      paperType: "comingSoon",
      desc: "Coming soon — modern prose/drama + poetry anthology.",
      skills: [],
    },
  ],
  "history:AQA": [
    {
      n: "Paper 1 – Understanding the Modern World",
      d: 105,
      m: 84,
      paperType: "comingSoon",
      desc: "Coming soon — Germany, Cold War, and conflict topics.",
      skills: [],
    },
    {
      n: "Paper 2 – Shaping the Nation (Elizabethan England)",
      d: 105,
      m: 40,
      paperType: "structured",
      paperPrompt: "history-p2-elizabethan",
      desc: "1h 45min, 40 marks. Section B: Elizabethan England c1568–1603 (interpretation,explain, account, historic environment).",
      skills: [
        "Interpretation analysis",
        "Explain significance",
        "Historic environment",
      ],
      configFields: [
        {
          id: "britishStudy",
          label: "British depth study",
          type: "select",
          options: ["Elizabethan Englandc1568-1603"],
          default: "Elizabethan England c1568-1603",
        },
        {
          id: "examYear",
          label: "Exam year (affects historic environmentquestion)",
          type: "select",
          options: ["2026", "2027", "2028"],
          default: "2026",
        },
      ],
    },
  ],
  "geography:AQA": [
    {
      n: "Paper 1 – Living with the PhysicalEnvironment",
      d: 90,
      m: 88,
      paperType: "parted",
      numGroups: 4,
      markDist:
        "Target EXACTLY 88 marks across 3 sections (3 groups of questions + 1 finalevaluation). Section A (Natural Hazards) ~30 marks, Section B (Living World) ~30 marks,Section C (UK Physical Landscapes) ~28 marks. Include: 1-mark name/state, 2-mark describe,4-mark explain, 6-mark extended, and one 9-mark essay with SPaG marks.",
      specGuide:
        "AQA GCSE Geography Paper 1. 1h 30min, 88 marks. THREE compulsorysections: SECTION A — The Challenge of Natural Hazards: tectonic hazards (plate tectonics,earthquakes, volcanoes — causes, effects, responses, prediction), weather hazards (tropicalstorms — distribution, causes, effects, responses), climate change (causes, effects, managing).SECTION B — The Living World: ecosystems (food webs, nutrient cycles), tropical rainforests(structure, biodiversity, deforestation causes/effects, sustainable management), hot deserts(adaptations, opportunities, challenges, desertification) OR cold environments. SECTION C —Physical Landscapes in the UK: either coastal landscapes (erosion processes, landforms —headlands/bays/caves/arches/stacks/beaches, coastal management) OR river landscapes(erosion/transportation/deposition, meanders/oxbow lakes/floodplains/deltas, floodmanagement). MUST include: at least one figure-based question ('Describe what Figure Xshows'), AQA command words (name/state/describe/explain/assess/to what extent), one 9-markessay with 3 SPaG marks, one 6-mark evaluation question.",
      desc: "1h 30min, 88 marks. Three sections: Natural Hazards, Living World, UK PhysicalLandscapes.",
      skills: [
        "Figure analysis",
        "6-mark extended writing",
        "9-mark essay + SPaG",
      ],
    },
    {
      n: "Paper 2 – Challenges in the HumanEnvironment",
      d: 90,
      m: 88,
      paperType: "parted",
      numGroups: 4,
      markDist:
        "Target EXACTLY 88 marks. Three sections: Section A (Urban Issues) ~30 marks,Section B (Changing Economic World) ~30 marks, Section C (Resource Management) ~28marks. Same mark distribution pattern as Paper 1 — 1-mark, 2-mark, 4-mark, 6-mark, 9-markquestions.",
      specGuide:
        "AQA GCSE Geography Paper 2. 1h 30min, 88 marks. THREE compulsorysections: SECTION A — Urban Issues and Challenges: urbanisation trends, megacities, Rio deJaneiro (growth, opportunities/challenges, favelas, improvements) OR UK city case study(regeneration, migration, suburbanisation), sustainable urban development. SECTION B — TheChanging Economic World: development gap (measures of development, DTM, Rostow),causes of uneven development, LICs/NEEs (Nigeria case study: location, context, TNCs,international aid, political/social/economic changes), UK economy (post-industrial, scienceparks, quaternary sector). SECTION C — The Challenge of Resource Management: globaldistribution of food/water/energy, food supply issues (increasing food production, sustainablefood), water supply (deficit/surplus, water transfer, sustainable water), energy supply (fossil fuelsvs renewables, UK energy mix). Include case study questions requiring named examples. One9-mark essay + 3 SPaG marks.",
      desc: "1h 30min, 88 marks. Three sections: Urban Issues, Changing Economic World,Resource Management.",
      skills: [
        "Case study questions",
        "Development gap",
        "9-mark essay + SPaG",
      ],
    },
    {
      n: "Paper 3 – Geographical Applications",
      d: 75,
      m: 76,
      paperType: "parted",
      numGroups: 3,
      markDist:
        "Target EXACTLY 76 marks. Section A (Issue Evaluation) ~36 marks: starts with3-4 short questions about a fictional resource booklet then a 12-mark decision/evaluationquestion. Section B (Fieldwork) ~40 marks: 2 sections on physical and human fieldwork — datacollection, presentation techniques, analysis, evaluation. Final question 8 marks.",
      specGuide:
        "AQA GCSE Geography Paper 3. 1h 15min, 76 marks. SECTION A — IssueEvaluation: create a brief fictional 'pre-release resource booklet' (3 figures: map, graph,photograph description) on an environmental or human geography issue (e.g. coastalmanagement, urban regeneration, sustainable energy). Questions progress: describe Figure 1(2 marks), explain an issue shown (4 marks), use figures to assess the situation (6 marks),12-mark decision-making question ('To what extent should [decision]? Use evidence from theresources and your own knowledge' — 9 marks + 3 SPaG). SECTION B — Fieldwork:questions on physical fieldwork (methods of data collection, health/safety, data presentation)and human fieldwork (hypothesis, sampling strategy, data analysis, reliability and validity).Include at least one question requiring students to sketch a graph or describe how they wouldpresent data.",
      desc: "1h 15min, 76 marks. Section A: Issue evaluation. Section B: Fieldwork methods.",
      skills: [
        "Resource interpretation",
        "Fieldwork evaluation",
        "12-mark decision question",
      ],
    },
  ],
  "business:AQA": [
    {
      n: "Paper 1",
      d: 105,
      m: 90,
      paperType: "parted",
      numGroups: 5,
      markDist:
        "Target EXACTLY 90 marks. Group 1: exactly 5 MCQ parts (1 mark each,type:mcq). Groups 2–5: structured questions. Include: one 3-mark question, two 6-mark'Explain' questions, one 9-mark 'Analyse' question, one 12-mark 'Evaluate/Justify' question withlevel-based mark scheme (4 levels).",
      specGuide:
        "AQA GCSE Business Paper 1. 1h 45min, 90 marks. Four topic areas: (1)Business in the Real World — business aims/objectives, stakeholders, business ownershiptypes (sole trader/partnership/ltd/plc/franchise/social enterprise), business plans, locationdecisions, business growth; (2) Influences on Business — technology impacts, ethical trading,environmental considerations, economic climate, competitive environment, legislation(employment/consumer); (3) Business Operations — production methods (job/batch/flow), leanproduction (just in time/kaizen/cell production), quality management, procurement, supply chainmanagement; (4) Human Resources — organisational structures (hierarchies, span of control),recruitment and selection, training (on-the-job/off-the-job), motivation theories(Taylor/Maslow/Herzberg), leadership styles, employment law. Group 1: 5 MCQs on key terms.Remaining groups: structured using a named fictional business context. 12-mark evaluationmust include: 2+ justified points for, 2+ against, supported overall judgement.",
      desc: "1h 45min, 90 marks. Business operations, HR, and wider influences.",
      skills: [
        "12-mark evaluate question",
        "Motivation theories",
        "Business contexts",
      ],
    },
    {
      n: "Paper 2",
      d: 105,
      m: 90,
      paperType: "parted",
      numGroups: 5,
      markDist:
        "Target EXACTLY 90 marks. Group 1: 5 MCQs. Groups 2–5: structured. Includefinancial calculations (revenue/profit/break-even/ARR), one 9-mark 'Analyse', one 12-mark'Evaluate'.",
      specGuide:
        "AQA GCSE Business Paper 2. 1h 45min, 90 marks. Three topic areas: (5)Finance — revenue (price × quantity), costs (fixed/variable/total), profit and loss, break-even(contribution/break-even point/margin of safety calculations and graphs), cash flow forecasts,sources of finance (internal/external — loans, shares, retained profit, crowdfunding, tradecredit), financial statements (balance sheets, income statements); (6) Marketing — marketresearch (primary/secondary, qualitative/quantitative), segmentation(demographic/geographic/psychographic), marketing mix (4Ps — product lifecycle, pricingstrategies, distribution channels, promotional methods), use of digital marketing; (7) ExternalInfluences — economic climate (recession/growth, inflation, interest rates, unemployment,exchange rates effect on imports/exports), legislation (consumer law, employment law),environmental and ethical issues, globalisation and international trade. Financial calculationsmust show formula → working → answer → unit. Break-even point = fixed costs ÷ contributionper unit.",
      desc: "1h 45min, 90 marks. Finance, marketing, external influences.",
      skills: ["Break-even calculations", "Marketing mix", "12-mark evaluate"],
    },
  ],
  "computing:AQA": [
    {
      n: "Paper 1 – Computational Thinking &Programming",
      d: 150,
      m: 90,
      paperType: "parted",
      numGroups: 6,

      markDist:
        "Target EXACTLY 90 marks. Groups mix: 1-mark recall, 2-mark describe, 4-markapplication, 8-mark extended. At least one trace table question, one pseudocode-writingquestion, one algorithm design question.",
      specGuide:
        "AQA GCSE Computer Science Paper 1. 2h 30min, 90 marks. Topics: (1)Fundamentals of Algorithms — algorithm design (flowcharts, pseudocode), trace tables (showstep-by-step variable changes), searching (linear vs binary — comparison), sorting (bubble,merge, insertion — steps and comparisons), Big O notation (awareness); (2) ProgrammingFundamentals — variables/constants, data types (integer/real/Boolean/string/char),sequence/selection/iteration, nested structures, string manipulation (length, substring,concatenation), file handling (open/read/write/close), exception handling; (3) Producing RobustPrograms — defensive design (input validation, authentication), testing(normal/boundary/erroneous test data, trace tables to detect errors), syntax vs logic errors; (4)Boolean Logic — truth tables (AND/OR/NOT), logic diagrams; (5) Programming Languages —high vs low-level, compilers vs interpreters, IDEs (editor/debugger/translator). Use AQApseudocode syntax EXACTLY: assignment uses ←, output uses OUTPUT, input usesUSERINPUT, loops: FOR i ← 1 TO n, WHILE condition DO, IF/ELSE/ENDIF. Trace tablequestions MUST show exact column headers and cell values.",
      desc: "2h 30min, 90 marks. Algorithms, programming, Boolean logic, languages.",
      skills: ["Trace tables", "Pseudocode writing", "Algorithm design"],
    },
    {
      n: "Paper 2 – Computer Systems",
      d: 90,
      m: 90,
      paperType: "parted",
      numGroups: 6,
      markDist:
        "Target EXACTLY 90 marks. Mix 1-mark, 2-mark, 4-mark and 8-mark questions.Include at least one binary/hex conversion calculation and one networking scenario question.",
      specGuide:
        "AQA GCSE Computer Science Paper 2. 1h 30min, 90 marks. Topics: (1)Systems Architecture — Von Neumann architecture (CPU, ALU, CU, registers:PC/MAR/MDR/ACC), fetch-decode-execute cycle (step by step), factors affecting CPUperformance (cores/cache/clock speed), embedded systems; (2) Memory and Storage — RAMvs ROM (volatile/non-volatile), types of secondary storage (HDD/SSD/optical/magnetic), filesizes calculation (bits/bytes/KB/MB/GB), data representation: binary (denary↔binary↔hexconversions, binary addition, overflow, two's complement), character encoding (ASCII/Unicode),images (pixels/colour depth/resolution, file size = width×height×colour depth), sound (samplerate/bit depth/file size); (3) Computer Networks — types (LAN/WAN/PAN), topologies(bus/star/mesh), wired vs wireless, hardware (NIC/hub/switch/router/WAP), protocols (TCP/IP,HTTP/HTTPS, FTP, SMTP, DNS), packet switching (packets/headers/routing), the Internet vsWorld Wide Web; (4) Network Security — threats (malware/phishing/social engineering/bruteforce/denial of service/SQL injection), prevention (firewalls/encryption/strongpasswords/2FA/access levels); (5) Systems Software — operating system functions (memorymanagement, process management, file management, user interface), utility software; (6)Ethical, Legal, Cultural and Environmental Impacts — Data Protection Act 2018/GDPR,Computer Misuse Act 1990, Copyright Designs and Patents Act 1988, Freedom of InformationAct, environmental impact, ethical issues (AI, privacy). Binary/hex questions MUST show fullworking.",
      desc: "1h 30min, 90 marks. Systems architecture, networks, cybersecurity, datarepresentation, ethics.",
      skills: [
        "Binary/hex conversions",
        "Network protocols",
        "Data Protection Act",
      ],
    },
  ],
  "dt:AQA": [
    {
      n: "Paper 1 – Core Technical Principles",
      d: 90,
      m: 100,
      paperType: "parted",
      numGroups: 5,
      markDist:
        "Target EXACTLY 100 marks. Group 1: exactly 20 MCQ parts (1 mark each,type:mcq) = 20 marks. Groups 2–5: extended structured questions totalling 80 marks — include4-mark, 6-mark, and 8-mark questions.",
      specGuide:
        "AQA GCSE Design and Technology Paper 1. 1h 30min, 100 marks. SECTION A(20 marks): exactly 20 MCQ questions (type:mcq) covering all core technical principles —materials (timber: hardwood/softwood/manufactured boards; metals: ferrous/non-ferrous/alloys;polymers: thermoplastic/thermosetting; textiles: natural/synthetic/blended; papers/boards),forces and stresses (tension/compression/torsion/bending/shear), physical/working/aestheticproperties, scales of production (one-off/batch/mass/continuous), CAD/CAM (CNC router/lasercutter/3D printer — advantages/disadvantages), QA and QC, tolerances. SECTION B (80 marksacross 4 groups): (B1) New and emerging technologies — 4 and 6-mark questions onautomation, robotics, flexible manufacturing, biotechnology, nano-materials, smart materials,global vs local production, FabLabs; (B2) Energy generation and storage —renewable/non-renewable, energy storage, sustainability, carbon footprint, life cycleassessment; (B3) Designing and making principles — ergonomics, anthropometrics, inclusivedesign, user-centred design, 8-mark design question (sketch/annotate a product for a givenbrief); (B4) Material properties and selection — comparing materials for a given application,sustainability (reduce/reuse/recycle), finishes (paint/varnish/electroplating/anodising). The8-mark design question requires a sketched annotated design solution.",
      desc: "1h 30min, 100 marks. Section A: 20 MCQs. Section B: core technical principles.",
      skills: ["20 MCQs", "8-mark design question", "Material selection"],
    },
    {
      n: "Paper 2 – Specialist Technical Principles",
      d: 60,
      m: 80,
      paperType: "parted",
      numGroups: 4,
      markDist:
        "Target EXACTLY 80 marks. Group 1: exactly 5 MCQ parts (type:mcq) = 5 marks.Groups 2–4: 3 structured groups totalling 75 marks, mixing 2-mark, 4-mark, 6-mark and 8-markquestions.",
      specGuide:
        "AQA GCSE Design and Technology Paper 2. 1h, 80 marks. Specialist focus onone materials area (generate questions appropriate for eithertimber/metals/polymers/textiles/papers/boards/electronic systems). SECTION A (5 marks): 5MCQ parts on specialist material properties, manufacturing processes, and tools. SECTION B(75 marks across 3 groups): (B1) Specialist material knowledge — properties (physical:density/strength/conductivity/malleability; working: machinability/weldability; aesthetic), selectioncriteria for a given application, 2-mark and 4-mark questions; (B2) Manufacturing processes forspecialist area — forming (casting/forging/press forming for metals; injection moulding/blowmoulding for polymers; warp/weft/weaving for textiles), cutting (marking out, sawing, chisellingfor timber), joining (welding/soldering/adhesives/screws/bolts), finishing(sanding/painting/lacquering/plating), 4-mark and 6-mark questions; (B3) Evaluation question —8-mark question: 'Evaluate the suitability of [specialist material] for [given product], consideringits properties, manufacturing process, cost and sustainability. Justify your choice.' Level-basedmark scheme L1(1-2), L2(3-4), L3(5-6), L4(7-8).",
      desc: "1h, 80 marks. Specialist material focus. Section A: 5 MCQs. Section B: extended.",
      skills: ["5 MCQs", "Material properties", "8-mark evaluate"],
    },
  ],
  "combined-sci:AQA": [
    {
      n: "All papers",
      d: 75,
      m: 70,
      paperType: "comingSoon",
      desc: "Coming soon — Combined ScienceTrilogy and Synergy papers.",
      skills: [],
    },
  ],
  "drama:AQA": [
    {
      n: "Written Exam",
      d: 105,
      m: 80,
      paperType: "comingSoon",
      desc: "Coming soon — Drama writtenexam.",
      skills: [],
    },
  ],
  "music:AQA": [
    {
      n: "Written Exam",
      d: 90,
      m: 80,
      paperType: "comingSoon",
      desc: "Coming soon — Music writtenexam.",
      skills: [],
    },
  ],
};

export const getMockSpec = (sId, board) => {
  const key = `${sId}:${board}`;
  const fallback = MOCK_SPECS[`${sId}:AQA`];
  if (MOCK_SPECS[key]) return MOCK_SPECS[key];
  if (fallback) return fallback;
  const subj = ALL_SUBJECTS.find((s) => s.id === sId);
  return [
    {
      n: "All papers",
      d: 90,
      m: 80,
      paperType: "comingSoon",
      desc: `${board} ${subj?.name || sId}
mock papers coming soon.`,
      skills: [],
    },
  ];
};

export async function generateMockQuestions(
  subjName,
  board,
  paperName,
  needed,
  contextNotes,
  markDist,
) {
  var questions = await aiServiceQuestionGenerator(
    subjName,
    board,
    contextNotes,
    needed,
    markDist,
  );

  return questions.map(function (q) {
    return Object.assign({}, q, {
      id: "ai-" + uid(),
      paperName: paperName || "",
      year: q.year || "AI Generated",
    });
  });
}

export async function generateStructuredPaper(
  subjName,
  board,
  paper,
  config,
  mergedTopics,
) {
  const notesCtx = mergedTopics
    .flatMap((t) =>
      t.sections.flatMap((s) =>
        (s.notes || []).map((n) => `${n.heading}: ${stripHtml(n.body)}`),
      ),
    )
    .slice(0, 15)
    .join("\n");
  let prompt = "";
  if (paper.paperPrompt === "eng-lang-p1") {
    prompt = `You are an expert AQA GCSE English Language Paper 1 examiner. Generate a
complete mock exam.
STEP 1 — EXTRACT: Write a fictional prose extract of EXACTLY 30 numbered lines from an
imaginary 20th/21st-century literary fiction work. It must be vivid, original (NOT from any real
published work), and rich with language techniques. Number each line (1, 2, 3...). Make the
opening dramatic or atmospheric, the middle developed, and the ending unresolved or tense.
STEP 2 — QUESTIONS (use \n for all line breaks inside text strings, never unescaped quotes):
Q1: Four 1-mark retrieval MCQs about lines 1–9. Each MCQ has exactly 3 options. Include
correct answer index (0, 1, or 2).
Q2 (8 marks): "Look in detail at lines [pick a mid-section range].\n[Paste those exact lines
here]\nHow does the writer use language here to describe [specific subject from the
extract]?\n\nYou could include the writer's choice of:\n• words and phrases\n• language features
and techniques\n• sentence forms."
Mark scheme: Detailed AQA-style with 4 levels. Level 4 (7-8): Perceptive, detailed analysis —
identifies sophisticated language choices, uses precise subject terminology, convincing and
accurate interpretation. Level 3 (5-6): Clear, explained analysis of language — relevant
comments on methods, explained effect, accurate terminology. Level 2 (3-4): Some
understanding of language — some reference to methods, some awareness of effect. Level 1
(1-2): Simple comment — surface-level observation. Include 3-4 specific indicative examples
from the extract showing what would earn high marks.
Q3 (8 marks): "You now need to think about the whole of the source.\nHow has the writer
structured the text to interest you as a reader?\n\nYou could write about:\n• what the writer
focuses your attention on at the beginning\n• how and why the writer changes this focus as the
source develops\n• any other structural features that interest you."
Mark scheme: Level 4 (7-8): Perceptive structural analysis — identifies varied and inventive
structural features, analyses how structure creates effect on reader. Level 3 (5-6): Clear
explanation of structural choices and effects. Level 2 (3-4): Some awareness of structure. Level
1 (1-2): Simple comment on structure. Indicative content: opening technique used, structural
shift point identified, ending technique noted.
Q4 (20 marks): A named critic or fictional reader makes a bold statement about the text (e.g. "A
reader once said: 'This text makes the reader feel [emotion].'"). Question: "To what extent do
you agree?\n\nIn your response, you could:\n• write about your own impressions of [subject]\n•

evaluate how the writer has created these impressions\n• support your ideas with quotations
from the text."
Mark scheme: Level 4 (16-20): Perceptive, detailed evaluation — critical, insightful,
well-developed. Convincing and accurate textual analysis with judicious references. Level 3
(11-15): Clear, consistent evaluation — explained comments, relevant references, evidence of
critical thinking. Level 2 (6-10): Some evaluative comment — some awareness of writer's
methods. Level 1 (1-5): Simple, limited comment. Indicative content: 3-4 specific points about
the text with example quotations.
Q5 (40 marks — 24 content+organisation, 16 technical accuracy): Offer exactly TWO creative
options:\nOption A: Describe a scene or setting inspired by [an image or mood from the
extract].\nOption B: Continue the story or write a new story opening on the theme of [theme
from extract].
Mark scheme for content (24 marks): Level 4 (19-24): Compelling, convincing writing —
sophisticated structural and grammatical features, wide vocabulary, engaging narrative voice.
Level 3 (13-18): Clear, consistent writing — crafted with some sophistication, varied vocabulary
and structure. Level 2 (7-12): Some success in communicating — some deliberate choices,
inconsistent. Level 1 (1-6): Simple, limited. Mark scheme for technical accuracy (16 marks):
Level 4 (13-16): Varied and inventive punctuation and sentence structures, wide vocabulary,
accurate spelling including complex words. Level 3 (9-12): Generally accurate with some variety.
Level 2 (5-8): Some control, errors do not impede. Level 1 (1-4): Simple vocabulary, limited
punctuation, frequent errors.
OUTPUT ONLY VALID JSON — all string values use \n for line breaks, NO unescaped double
quotes inside strings (use apostrophes instead), NO trailing commas:
{"extract":{"title":"[invent a fictional title]","source":"[fictional author name], [fictional
year]","text":"[30 numbered lines of extract, each line ending with
\n]"},"questions":[{"id":"q1a","type":"mcq","groupLabel":"Question 1","marks":1,"text":"[MCQ
question about lines 1-9]","options":["[option A]","[option B]","[option
C]"],"answer":0,"explanation":"[why correct]","year":"AI
Generated"},{"id":"q1b","type":"mcq","groupLabel":"Question 1","marks":1,"text":"[MCQ
question]","options":["[A]","[B]","[C]"],"answer":1,"explanation":"[why]","year":"AI
Generated"},{"id":"q1c","type":"mcq","groupLabel":"Question 1","marks":1,"text":"[MCQ
question]","options":["[A]","[B]","[C]"],"answer":0,"explanation":"[why]","year":"AI
Generated"},{"id":"q1d","type":"mcq","groupLabel":"Question 1","marks":1,"text":"[MCQ
question]","options":["[A]","[B]","[C]"],"answer":2,"explanation":"[why]","year":"AI
Generated"},{"id":"q2","type":"extended","marks":8,"text":"[Question 2 full text with pasted lines
and bullet points using \n for breaks]","markScheme":"[detailed 4-level mark scheme with
indicative content]","sampleAnswer":"","year":"AI
Generated"},{"id":"q3","type":"extended","marks":8,"text":"[Question 3 full text with bullet
points]","markScheme":"[detailed 4-level mark scheme with indicative
content]","sampleAnswer":"","year":"AI
Generated"},{"id":"q4","type":"extended","marks":20,"text":"[Question 4 full text with statement
and bullet points]","markScheme":"[detailed 4-level mark scheme with indicative

content]","sampleAnswer":"","year":"AI
Generated"},{"id":"q5","type":"extended","marks":40,"text":"[Question 5 with both options labelled
Option A and Option B]\n\n24 marks: Content and Organisation\n16 marks: Technical
Accuracy","markScheme":"[detailed mark scheme for content (24) and technical accuracy (16)
with level descriptors]","sampleAnswer":"","year":"AI Generated"}]}`;
  } else if (paper.paperPrompt === "eng-lit-p1") {
    const shakespeare = config.shakespeare || "Macbeth";
    const novel = config.novel || "A Christmas Carol";
    const shAuthor =
      {
        Macbeth: "Shakespeare",
        "Romeo and Juliet": "Shakespeare",
        TheTempest: "Shakespeare",
        "The Merchant of Venice": "Shakespeare",
        "Much Ado AboutNothing": "Shakespeare",
        "Julius Caesar": "Shakespeare",
      }[shakespeare] || "Shakespeare";
    const nvAuthor =
      {
        "The Strange Case of Dr Jekyll and Mr Hyde": "Stevenson",
        "A ChristmasCarol": "Dickens",
        "Great Expectations": "Dickens",
        JaneEyre: "Bronte",
        Frankenstein: "Shelley",
        "Pride and Prejudice": "Austen",
        "The Sign ofFour": "Conan Doyle",
      }[novel] || "the author";
    const isShakespeare = true;
    prompt = `You are an expert AQA GCSE English Literature Paper 1 examiner. Generate a
complete mock exam.
The student is studying:
- Shakespeare: ${shakespeare}
- 19th-century novel: ${novel}
CRITICAL EXTRACT REQUIREMENTS:
1. Shakespeare extract: Write 18-22 lines in authentic Shakespearean verse/prose style, clearly
labelled [Act X, Scene Y]. Include stage directions where appropriate. The extract must focus on
a key theme or dramatic moment from ${shakespeare}.
2. 19th-century novel extract: Write 28-35 lines in authentic 19th-century prose style mirroring
${nvAuthor}'s voice — formal vocabulary, long sentences, moral weight, vivid description.
Clearly labelled [Chapter X or a specific chapter title]. The extract must capture a significant
moment relevant to themes of the novel.
Both extracts should be long enough that analysis questions have plenty of material to work
with.
SECTION A — SHAKESPEARE QUESTION (34 marks total: 30 AO1/AO2/AO3 + 4 AO4):
"Read the following extract from ${shakespeare} and then answer the question that follows.\nAt
this point in the play [brief 1-sentence context].\n\nStarting with this speech/extract, explain how
${shAuthor} presents [choose a key character or theme] as [choose a quality — e.g. consumed
by ambition / torn between duty and desire].\n\nWrite about:\n• how ${shAuthor} presents
[aspect] in this extract\n• how ${shAuthor} presents [aspect] in the play as a whole\n[30 marks +
4 marks for AO4: spelling, punctuation and grammar]"

Mark scheme for Section A (30 marks AO1/AO2/AO3): Level 4 (25-30): Perceptive, detailed
response — insightful personal interpretation; convincing, well-developed textual references;
analysing effects of language/form/structure; well-integrated context. Level 3 (19-24): Clear,
explained response — explained personal response; relevant well-chosen references;
comments on effects of methods; awareness of context shaping meaning. Level 2 (13-18):
Some understanding — some supported interpretation; some comments on language/structure;
some context awareness. Level 1 (1-12): Simple, limited. AO4 (4 marks): 4 = consistently
accurate SPaG, varied sentence structures; 3 = generally accurate; 2 = some control; 1 =
limited control. Indicative content: [name 3-4 specific themes/moments from ${shakespeare} a
student could discuss — power, gender, loyalty, fate etc. with specific acts/scenes].
SECTION B — 19TH-CENTURY NOVEL QUESTION (30 marks):
"Read the following extract from ${novel} and then answer the question that follows.\nIn this
extract, [brief 1-sentence context of what is happening].\n\nStarting with this extract, how does
${nvAuthor} present [choose a key theme or character relevant to the extract]?\n\nWrite
about:\n• how ${nvAuthor} presents [theme/character] in this extract\n• how ${nvAuthor}
presents [theme/character] in the novel as a whole\n[30 marks]"
Mark scheme for Section B (30 marks): Level 4 (25-30): Perceptive, detailed response —
insightful interpretation of writer's craft; precise, well-chosen references; sophisticated analysis
of language/structure/form; rich contextual understanding of Victorian/19th-century society.
Level 3 (19-24): Clear, explained — explained personal response; relevant references;
comments on methods and effects; some context. Level 2 (13-18): Some understanding. Level
1 (1-12): Simple. Indicative content: [name 3-4 specific themes/ideas from ${novel} relevant to
the question — e.g. for A Christmas Carol: redemption, poverty, social responsibility, with
specific chapters/characters].
OUTPUT ONLY VALID JSON. Use \n for line breaks. NO unescaped double quotes in strings
(use apostrophes). NO trailing commas:
{"extract":{"title":"${shakespeare} — Act [X], Scene [Y]","source":"AQA GCSE English
Literature","text":"[18-22 lines of Shakespeare extract, using \n for line
breaks]"},"extract2":{"title":"${novel} — Chapter [X / title]","source":"AQA GCSE English
Literature","text":"[28-35 lines of novel extract, using \n for line
breaks]"},"questions":[{"id":"q1","type":"extended","marks":34,"section":"SECTION A:
SHAKESPEARE","text":"[Full Section A question as specified above, using \n for line breaks
and bullet points]","markScheme":"[Full detailed mark scheme as specified above with all 4
levels and indicative content]","sampleAnswer":"","year":"AI
Generated"},{"id":"q2","type":"extended","marks":30,"section":"SECTION B: 19TH-CENTURY
NOVEL","text":"[Full Section B question as specified above]","markScheme":"[Full detailed mark
scheme as specified above with all 4 levels and indicative
content]","sampleAnswer":"","year":"AI Generated"}]}`;
  } else if (paper.paperPrompt === "history-p2-elizabethan") {
    const examYear = parseInt(config.examYear) || 2026;

    const hEnvLabel =
      examYear >= 2028
        ? "Kenilworth Castle"
        : examYear === 2027
          ? "the SpanishArmada"
          : "the Globe Theatre";
    const hEnvQ =
      examYear >= 2028
        ? `How far does a study of Kenilworth Castle support the view that Elizabethan power was
primarily expressed through display rather than defence? Explain your answer using your
contextual knowledge and what the site reveals about Elizabethan society.`
        : examYear === 2027
          ? `How far does a study of the defeat of the Spanish Armada support the view that English
leadership was the main factor in England's success? Explain your answer using contextual
knowledge about the Armada and English naval strategy.`
          : `How far does a study of the Globe Theatre support the view that Elizabethan theatre was
primarily a commercial enterprise rather than a reflection of wider culture? Explain your answer
using your contextual knowledge and what the Globe reveals about Elizabethan society.`;
    prompt = `You are an expert AQA GCSE History Paper 2, Section B examiner. Generate a
complete mock exam on Elizabethan England, c1568-1603.
Generate a historical interpretation of 60-80 words about an aspect of Elizabethan England (e.g.
the role of the monarch, threats to Elizabeth, the lives of ordinary Elizabethans). Attribute it to a
fictional historian with a plausible academic citation (e.g. P. Harrison, The Elizabethan Age,
2016).
Then generate exactly 4 questions. IMPORTANT: Do NOT include mark allocations in the
question text — these are shown separately.
Q1 (8 marks): "Study Interpretation A. How convincing is Interpretation A about [topic of the
interpretation]? Explain your answer based on your contextual knowledge and what it says in
Interpretation A."
Mark scheme Q1: Level 4 (7-8): Developed, convincing evaluation — interrogates specific
content of the interpretation, tests it against detailed own knowledge, makes a well-reasoned
overall judgement. Level 3 (5-6): Explained evaluation — comments on specific content AND
uses own knowledge to evaluate, clear judgement. Level 2 (3-4): Some evaluation — makes
reference to the interpretation with some supporting knowledge. Level 1 (1-2): Simple comment
on the interpretation. Indicative content: [3-4 specific Elizabethan facts that could
support/challenge the interpretation — name actual events, dates, people].
Q2 (8 marks): "Explain what was important about [specific Elizabethan event, person or
development — e.g. the role of the Privy Council / Mary Queen of Scots / Elizabethan
exploration]."
Mark scheme Q2: Level 4 (7-8): Developed explanation — analyses importance with specific
supporting knowledge, links to wider context. Level 3 (5-6): Explained importance — valid
reason(s) with supporting knowledge. Level 2 (3-4): Some explanation — valid point(s) with
some factual support. Level 1 (1-2): Simple, general statement. Indicative content: [3-4 specific
points about why this was important with dates/names].

Q3 (8 marks): "Write an account of the ways in which [specific Elizabethan change or sequence
of events — e.g. the Northern Earls Rebellion developed / relations between Elizabeth and
Parliament changed]."
Mark scheme Q3: Level 4 (7-8): Developed, analytical narrative — explains how and why
events developed, identifies links between causes/events/consequences, precise detail. Level 3
(5-6): Explained account — shows how/why with supporting evidence, some analytical
language. Level 2 (3-4): Descriptive account with some explanation. Level 1 (1-2): Simple
narrative. Indicative content: [3-4 key stages/events in chronological order with specific details].
Q4 (16 marks): "${hEnvQ}"
Mark scheme Q4: Level 4 (13-16): Sustained, developed analysis — analyses how the site
reflects/challenges the statement, detailed contextual knowledge integrated throughout,
well-reasoned and balanced judgement. Level 3 (9-12): Developed analysis — analyses
aspects of the site with contextual knowledge, reaches a supported judgement. Level 2 (5-8):
Explained analysis — some use of site knowledge and context, partial judgement. Level 1 (1-4):
Simple comment on the site. Indicative content about ${hEnvLabel}: [4-5 specific
architectural/historical features of the site that could be used in analysis, with dates and
significance].
OUTPUT ONLY VALID JSON. Use \n for line breaks in text. NO unescaped double quotes in
strings. NO trailing commas:
{"extract":{"title":"Interpretation A — Elizabethan England, c1568-1603","source":"[Fictional
historian name, Book Title, Year]","text":"[60-80 word
interpretation]"},"questions":[{"id":"q1","type":"extended","marks":8,"text":"[Q1 full text — no mark
allocation]","markScheme":"[Full detailed mark scheme with all 4 levels and indicative content
as above]","sampleAnswer":"","year":"AI
Generated"},{"id":"q2","type":"extended","marks":8,"text":"[Q2 full text — no mark
allocation]","markScheme":"[Full detailed mark scheme with all 4 levels and indicative content
as above]","sampleAnswer":"","year":"AI
Generated"},{"id":"q3","type":"extended","marks":8,"text":"[Q3 full text — no mark
allocation]","markScheme":"[Full detailed mark scheme with all 4 levels and indicative content
as above]","sampleAnswer":"","year":"AI
Generated"},{"id":"q4","type":"extended","marks":16,"text":"[Q4 full text — no mark
allocation]","markScheme":"[Full detailed mark scheme with all 4 levels and indicative content
as above]","sampleAnswer":"","year":"AI Generated"}]}`;
  } else {
    throw new Error("Unknown paperPrompt: " + paper.paperPrompt);
  }
  const rawText = await callGeminiSimple(prompt, 8000);
  if (!rawText)
    throw new Error(
      "Structured paper generation failed — no response from AI.",
    );
  function sanitiseRaw(s) {
    s = s
      .replace(/```(?:json)?\s*/gi, "")
      .replace(/```/g, "")
      .trim();
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    if (start >= 0 && end > start) s = s.slice(start, end + 1);
    s = s.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "");

    s = s.replace(/"((?:[^"\\]|\\.)*)"/g, function (_, inner) {
      return '"' + inner.replace(/\r?\n/g, "\\n") + '"';
    });
    return s;
  }
  function tryParse(s) {
    try {
      return JSON.parse(s);
    } catch (_) {
      return null;
    }
  }
  function repairAndParse(s) {
    let r = tryParse(s);
    if (r) return r;

    let open = 0,
      inStr = false,
      esc = false;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (esc) {
        esc = false;
        continue;
      }
      if (c === "\\" && inStr) {
        esc = true;
        continue;
      }
      if (c === '"') {
        inStr = !inStr;
        continue;
      }
      if (!inStr) {
        if (c === "{") open++;
        else if (c === "}") open--;
      }
    }
    r = tryParse(s + "}".repeat(Math.max(0, open)));
    if (r) return r;

    const lb = s.lastIndexOf("}");
    if (lb > 0) {
      r = tryParse(s.slice(0, lb + 1));
      if (r) return r;
      let op2 = 0;
      for (const c2 of s.slice(0, lb + 1)) {
        if (c2 === "{") op2++;
        else if (c2 === "}") op2--;
      }
      r = tryParse(s.slice(0, lb + 1) + "}".repeat(Math.max(0, op2)));
      if (r) return r;
    }
    return null;
  }
  const parsed = repairAndParse(sanitiseRaw(rawText));
  if (!parsed)
    throw new Error(
      "Failed to parse AI response — the model returned malformedJSON. Please try again.",
    );
  return {
    extract: parsed.extract || null,
    extract2: parsed.extract2 || null,
    questions: (parsed.questions || []).map((q) => ({
      ...q,
      id: q.id || `ai-${uid()}`,
    })),
  };
}
