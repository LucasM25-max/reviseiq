import React from "react";

export const ALL_SUBJECTS = [
  { id:"maths",        name:"Maths",                icon:"📐", accent:"#0ea5e9", light:"#f0f9ff", mid:"#e0f2fe", dk:"#0c4a6e" },
  { id:"eng-lang",     name:"English Language",     icon:"📝", accent:"#f59e0b", light:"#fffbeb", mid:"#fef3c7", dk:"#78350f" },
  { id:"eng-lit",      name:"English Literature",   icon:"📖", accent:"#ec4899", light:"#fdf2f8", mid:"#fce7f3", dk:"#831843" },
  { id:"bio",          name:"Biology",              icon:"🧬", accent:"#10b981", light:"#ecfdf5", mid:"#d1fae5", dk:"#065f46" },
  { id:"chem",         name:"Chemistry",            icon:"⚗️",  accent:"#3b82f6", light:"#eff6ff", mid:"#dbeafe", dk:"#1e3a5f" },
  { id:"phys",         name:"Physics",              icon:"⚡", accent:"#8b5cf6", light:"#f5f3ff", mid:"#ede9fe", dk:"#3b0764" },
  { id:"combined-sci", name:"Combined Science",     icon:"🔬", accent:"#14b8a6", light:"#f0fdfa", mid:"#ccfbf1", dk:"#134e4a" },
  { id:"history",      name:"History",              icon:"🏛️", accent:"#d97706", light:"#fffbeb", mid:"#fef3c7", dk:"#78350f" },
  { id:"geography",    name:"Geography",            icon:"🌍", accent:"#16a34a", light:"#f0fdf4", mid:"#dcfce7", dk:"#14532d" },
  { id:"french",       name:"French",               icon:"🇫🇷", accent:"#2563eb", light:"#eff6ff", mid:"#dbeafe", dk:"#1e3a5f" },
  { id:"spanish",      name:"Spanish",              icon:"🇪🇸", accent:"#dc2626", light:"#fef2f2", mid:"#fee2e2", dk:"#7f1d1d" },
  { id:"german",       name:"German",               icon:"🇩🇪", accent:"#ef4444", light:"#fef2f2", mid:"#fee2e2", dk:"#991b1b" },
  { id:"business",     name:"Business",             icon:"💼", accent:"#0891b2", light:"#ecfeff", mid:"#cffafe", dk:"#164e63" },
  { id:"computing",    name:"Computing",            icon:"💻", accent:"#6366f1", light:"#eef2ff", mid:"#e0e7ff", dk:"#312e81" },
  { id:"dt",           name:"Design & Technology",  icon:"🔧", accent:"#ea580c", light:"#fff7ed", mid:"#ffedd5", dk:"#7c2d12" },
  { id:"drama",        name:"Drama",                icon:"🎭", accent:"#a855f7", light:"#faf5ff", mid:"#f3e8ff", dk:"#581c87" },
  { id:"music",        name:"Music",                icon:"🎵", accent:"#f43f5e", light:"#fff1f2", mid:"#ffe4e6", dk:"#881337" },
  { id:"politics",     name:"Politics",             icon:"🏛️", accent:"#0f766e", light:"#f0fdfa", mid:"#ccfbf1", dk:"#134e4a", _politics:true },
];

export const SEMANTIC_COLORS = {
  definition:  { bg_l:"#f0f9ff", bg_d:"rgba(8,145,178,.1)",  border:"#0891B2", label_l:"#0e7490", label_d:"#67e8f9", icon:"📖" },
  process:     { bg_l:"#ecfdf5", bg_d:"rgba(5,150,105,.1)",  border:"#059669", label_l:"#065f46", label_d:"#6ee7b7", icon:"🔄" },
  equation:    { bg_l:"#f5f3ff", bg_d:"rgba(124,58,237,.1)", border:"#7C3AED", label_l:"#6d28d9", label_d:"#c4b5fd", icon:"🔢" },
  mistake:     { bg_l:"#fffbeb", bg_d:"rgba(217,119,6,.1)",  border:"#D97706", label_l:"#b45309", label_d:"#fcd34d", icon:"⚠️" },
  evaluation:  { bg_l:"#fff1f2", bg_d:"rgba(225,29,72,.1)",  border:"#E11D48", label_l:"#be123c", label_d:"#fda4af", icon:"⚖️" },
  practical:   { bg_l:"#f0fdf4", bg_d:"rgba(22,163,74,.1)",  border:"#16A34A", label_l:"#15803d", label_d:"#86efac", icon:"🧪" },
  example:     { bg_l:"#faf5ff", bg_d:"rgba(147,51,234,.1)", border:"#9333EA", label_l:"#7e22ce", label_d:"#d8b4fe", icon:"💡" },
};

export const MOCK_SPECS={
  "maths:AQA":[
    {n:"Paper 1 – Non-Calculator",d:90,m:80,paperType:"parted",numGroups:22,
     markDist:"Target EXACTLY 80 marks total. Start with 4–6 groups of 1–3 mark questions (recall/method), then 8–10 groups of 3–5 marks (application/multi-step), finish with 4–6 groups of 5–8 marks (problem-solving/proof). A single 6-mark question should appear at least once.",
     specGuide:"AQA GCSE Maths Higher Tier — Paper 1 Non-Calculator. Cover: Number (fractions, surds, indices, standard form, HCF/LCM), Algebra (expanding brackets, factorising, solving equations/inequalities, sequences, simultaneous equations, quadratics, functions, proof), Ratio/Proportion/Rates (percentage change, direct/inverse proportion, compound interest), Geometry/Measures (angles, area, volume, circle theorems, transformations, vectors, Pythagoras), Probability, Statistics (averages, cumulative frequency, histograms). All questions require written working. At least: one algebraic proof, one geometry question with circle theorems, one statistics interpretation. NO MCQs. Show method marks clearly.",
     desc:"1h 30min, 80 marks. No calculator allowed.",
     skills:["Algebraic proof","Circle theorems","Show-that questions"]},
    {n:"Paper 2 – Calculator",d:90,m:80,paperType:"parted",numGroups:22,
     markDist:"Target EXACTLY 80 marks. Mix 1-mark retrieval, 3-4 mark method, 5-6 mark multi-step reasoning. At least two questions with 5+ marks.",
     specGuide:"AQA GCSE Maths Higher Tier — Paper 2 Calculator. Include: trigonometry (sin/cos/tan, sine rule, cosine rule, 3D trig), bounds and error intervals, financial maths (compound/simple interest, depreciation), graph interpretation (distance-time, velocity-time, quadratic/cubic), reverse percentage, direct/inverse proportion, scatter graphs with correlation, similarity and congruence. Real-world context questions required. All written working shown.",
     desc:"1h 30min, 80 marks. Calculator allowed.",
     skills:["Trigonometry","Bounds","Graph interpretation"]},
    {n:"Paper 3 – Calculator",d:90,m:80,paperType:"parted",numGroups:22,
     markDist:"Target EXACTLY 80 marks. Synoptic — mix topics across questions. At least two 6-mark questions requiring extended multi-step reasoning.",
     specGuide:"AQA GCSE Maths Higher Tier — Paper 3 Calculator. Synoptic paper — questions deliberately mix topics. Include: simultaneous equations (graphical and algebraic), circle theorems, vectors, enlargement/similar shapes, transformations, data analysis (box plots, cumulative frequency, histograms), algebraic fractions, iteration, further quadratics. At least two 6-mark problem-solving questions. Heavier weighting on multi-step reasoning requiring 4+ method steps.",
     desc:"1h 30min, 80 marks. Calculator allowed.",
     skills:["Circle theorems","Vectors","Multi-step reasoning"]},
  ],
  "maths:Edexcel":[
    {n:"Paper 1 – Non-Calculator",d:90,m:80,paperType:"parted",numGroups:22,
     markDist:"Target EXACTLY 80 marks. Start with short 1–2 mark recall questions; build to 4–6 mark problem-solving. Each group should list marks clearly.",
     specGuide:"Edexcel GCSE Maths Higher Tier — Paper 1 Non-Calculator. Cover: indices and surds, algebraic manipulation (expanding, factorising), solving linear and quadratic equations, sequences (nth term arithmetic and geometric), angles (parallel lines, polygons, circle theorems), area and volume (composite shapes, sector/arc), probability trees, averages from frequency tables. At least two groups should start with a 1-mark recall part before extending. NO MCQs.",
     desc:"1h 30min, 80 marks. No calculator allowed.",
     skills:["Surds","Algebraic fractions","Angle proofs"]},
    {n:"Paper 2 – Calculator",d:90,m:80,paperType:"parted",numGroups:22,
     markDist:"Target EXACTLY 80 marks. Include a balance of short (1–3 mark) and longer (4–6 mark) questions.",
     specGuide:"Edexcel GCSE Maths Higher Tier — Paper 2 Calculator. Include: Pythagoras theorem in 2D and 3D, trigonometric ratios and graphs, cumulative frequency and box plots, scatter graphs and lines of best fit, ratio and proportion (recipe problems, map scales), standard form calculations, percentage change and reverse percentages, surface area and volume of prisms/cylinders/cones/spheres.",
     desc:"1h 30min, 80 marks. Calculator allowed.",
     skills:["3D Pythagoras","Cumulative frequency","Standard form"]},
    {n:"Paper 3 – Calculator",d:90,m:80,paperType:"parted",numGroups:22,
     markDist:"Target EXACTLY 80 marks. More 5–6 mark multi-step questions than Papers 1 and 2.",
     specGuide:"Edexcel GCSE Maths Higher Tier — Paper 3 Calculator. More demanding questions. Include: circle theorems (tangent, chord, alternate segment), similar shapes and scale factors (area/volume scale factors), 3D trigonometry, conditional probability and Venn diagrams, set notation, further algebraic proof, transformations of graphs, iteration to find roots. Questions should require students to select and chain methods.",
     desc:"1h 30min, 80 marks. Calculator allowed.",
     skills:["Circle theorems","Conditional probability","Graph transformations"]},
  ],
  "bio:AQA":[
    {n:"Paper 1",d:105,m:100,paperType:"parted",numGroups:9,
     markDist:"Target EXACTLY 100 marks. Section A: one group of exactly 4 MCQ parts (1 mark each, use type:mcq). Section B: 8 groups of structured questions mixing 1-mark recall, 2-mark describe, 3-4 mark explain, ending each group with one 6-mark extended writing question (level-based mark scheme with L1/L2/L3 descriptors). Total MCQ = 4 marks; structured = 96 marks.",
     specGuide:"AQA GCSE Biology Paper 1. Duration 1h 45min. Topics 1–4 only: (1) Cell Biology — cell structure (animal/plant/bacterial), microscopy calculations, mitosis, cell cycle, stem cells, diffusion/osmosis/active transport with calculations; (2) Organisation — digestive system enzymes, food tests, heart/circulatory system, coronary heart disease, cancer, plant tissue/transport; (3) Infection and Response — communicable diseases, bacteria/viruses/fungi/protists, immune system, vaccination, antibiotics, drug development; (4) Bioenergetics — photosynthesis (word/symbol equation, factors, uses of glucose), aerobic/anaerobic respiration, exercise effects, metabolism. Required practicals: osmosis in potatoes, enzyme rate experiments, iodine test, Benedict's test. Include at least 2 maths questions (percentage change, magnification formula). Each group ends with a 6-mark level-based extended writing question.",
     desc:"1h 45min, 100 marks. Topics 1–4: Cell Biology, Organisation, Infection & Response, Bioenergetics.",
     skills:["Extended writing (6 marks)","Maths skills","Required practicals"]},
    {n:"Paper 2",d:105,m:100,paperType:"parted",numGroups:9,
     markDist:"Target EXACTLY 100 marks. Section A: one group of 4 MCQ parts. Section B: 8 groups of structured questions, each ending with one 6-mark extended writing question.",
     specGuide:"AQA GCSE Biology Paper 2. Duration 1h 45min. Topics 5–7 only: (5) Homeostasis and Response — nervous system (CNS/receptors/effectors/reflex arc), hormones (endocrine system, ADH, blood glucose regulation, insulin/glucagon, diabetes, thermoregulation, menstrual cycle, fertility treatment, contraception, plant hormones/tropisms); (6) Inheritance, Variation and Evolution — DNA/genes/chromosomes/alleles, Mendel, genetic diagrams (monohybrid cross, Punnett square, sex determination), variation, mutation, natural selection, Darwin/Wallace, extinction, selective breeding, genetic engineering, cloning; (7) Ecology — ecosystems, food webs/chains, biotic/abiotic factors, adaptations, competition, sampling methods, human impacts on biodiversity, maintaining biodiversity, carbon/water/nitrogen cycles, decomposition, global warming. Include at least 2 maths questions. Each group ends with a 6-mark extended writing question.",
     desc:"1h 45min, 100 marks. Topics 5–7: Homeostasis, Inheritance, Ecology.",
     skills:["Genetic diagrams","Homeostasis mechanisms","Ecology calculations"]},
  ],
  "chem:AQA":[
    {n:"Paper 1",d:105,m:100,paperType:"parted",numGroups:9,
     markDist:"Target EXACTLY 100 marks. One group of 4 MCQ parts (type:mcq). Eight groups of structured questions, each ending with one 6-mark extended writing question. Include at least 3 maths calculation questions.",
     specGuide:"AQA GCSE Chemistry Paper 1. Duration 1h 45min. Topics 1–5: (1) Atomic Structure and Periodic Table — atomic model history, subatomic particles, electron configuration, periodic table groups/periods, Group 1/7/0 properties, transition metals; (2) Bonding/Structure/Properties — ionic/covalent/metallic bonding, giant ionic/simple molecular/giant covalent/metallic structures, allotropes of carbon, polymer properties; (3) Quantitative Chemistry — relative formula mass (Mr), moles, balancing equations, mole calculations (mass/Mr), limiting reactants, % yield, atom economy calculations; (4) Chemical Changes — reactivity series, displacement reactions, extraction of metals, reduction, electrolysis (products at electrodes), acids/bases/neutralisation, making salts; (5) Energy Changes — exothermic/endothermic reactions, bond energies, reaction profiles. Required practicals: electrolysis, titration, temperature change. Maths: at least 2 mole calculation groups.",
     desc:"1h 45min, 100 marks. Topics 1–5: Atomic structure, Bonding, Quantitative chemistry, Chemical changes, Energy.",
     skills:["Mole calculations","Electrolysis","6-mark extended writing"]},
    {n:"Paper 2",d:105,m:100,paperType:"parted",numGroups:9,
     markDist:"Target EXACTLY 100 marks. One group of 4 MCQ parts. Eight structured groups ending each with a 6-mark extended writing question.",
     specGuide:"AQA GCSE Chemistry Paper 2. Duration 1h 45min. Topics 6–10: (6) Rate and Extent of Chemical Change — collision theory, factors affecting rate (temperature/concentration/surface area/catalysts), rate calculations, reversible reactions, Le Chatelier's principle; (7) Organic Chemistry — crude oil/fractional distillation, alkanes (combustion), cracking, alkenes (addition reactions, bromine water test), alcohols, carboxylic acids, condensation polymers, addition polymers; (8) Chemical Analysis — pure substances, paper chromatography (Rf values), gas tests (O2/CO2/H2/Cl2/NH3), flame tests, precipitate tests; (9) Atmospheric Science — evolution of Earth's atmosphere, greenhouse effect, air pollutants; (10) Using Resources — finite/renewable resources, water treatment, Haber process (conditions/equilibrium), life cycle assessment, carbon footprint, alternatives to plastics. Include Rf value calculation and rate of reaction graph analysis.",
     desc:"1h 45min, 100 marks. Topics 6–10: Rates, Organic chemistry, Analysis, Atmosphere, Resources.",
     skills:["Organic chemistry naming","Rate calculations","Haber process"]},
  ],
  "phys:AQA":[
    {n:"Paper 1",d:105,m:100,paperType:"parted",numGroups:9,
     markDist:"Target EXACTLY 100 marks. One group of 4 MCQ parts. Eight structured groups; each group must include at least one calculation with formula/substitution/answer/units. Each group ends with one 6-mark extended writing question.",
     specGuide:"AQA GCSE Physics Paper 1. Duration 1h 45min. Topics 1–4: (1) Energy — energy stores and transfers, conservation of energy, kinetic/gravitational/elastic potential energy calculations (KE=½mv², GPE=mgh, Ee=½ke²), power (P=E/t, P=W/t), efficiency calculations, thermal conductivity, specific heat capacity (Q=mcΔT), required practical; (2) Electricity — current/potential difference/resistance (V=IR), series/parallel circuits, electrical power (P=IV, P=I²R), energy transfer (E=Pt, E=QV), static electricity, electric fields, mains supply, national grid, transformers (Vp/Vs=np/ns); (3) Particle Model of Matter — density (ρ=m/V), states of matter, internal energy, specific heat capacity, specific latent heat (Q=mL), gas pressure/temperature/volume (pV=const, p/T=const); (4) Atomic Structure — nuclear model history, atomic structure, isotopes, radioactive decay (alpha/beta/gamma), nuclear equations, half-life calculations, fission and fusion. Every group MUST show: formula stated → substitution → working → answer with units.",
     desc:"1h 45min, 100 marks. Topics 1–4: Energy, Electricity, Particle model, Atomic structure.",
     skills:["Multi-step calculations","Nuclear equations","Energy efficiency"]},
    {n:"Paper 2",d:105,m:100,paperType:"parted",numGroups:9,
     markDist:"Target EXACTLY 100 marks. One group of 4 MCQ parts. Eight structured groups each with at least one calculation and one 6-mark extended writing question.",
     specGuide:"AQA GCSE Physics Paper 2. Duration 1h 45min. Topics 5–8: (5) Forces — scalar/vector, resultant forces, moments (M=Fd), pressure (p=F/A, p=hρg), distance/speed/velocity/acceleration (v=u+at, v²=u²+2as, s=ut+½at²), Newton's laws, inertia, momentum (p=mv, conservation of momentum), stopping distances, drag; (6) Waves — transverse/longitudinal, wave equation (v=fλ), reflection/refraction/TIR, EM spectrum (properties/uses/dangers), sound, required practical (ripple tank/waves on string); (7) Magnetism and Electromagnetism — magnetic fields, motor effect (F=BIL), Fleming's left-hand rule, induced EMF (generator effect), AC generator, transformers; (8) Space Physics — solar system, life cycle of stars, orbital motion, red-shift/Big Bang evidence. Every calculation group: formula → substitution → working → answer with units.",
     desc:"1h 45min, 100 marks. Topics 5–8: Forces, Waves, Electromagnetism, Space.",
     skills:["Momentum calculations","EM spectrum","Wave equations"]},
  ],
  "bio:Edexcel":[
    {n:"Paper 1",d:105,m:100,paperType:"parted",numGroups:7,
     markDist:"Target EXACTLY 100 marks. Section A: one group of exactly 10 MCQ parts (1 mark each, use type:mcq). Section B: 6 groups of structured questions totalling 90 marks. Mix of 2-mark describe, 3-mark explain, 4-mark analysis, 6-mark extended writing.",
     specGuide:"Edexcel GCSE Biology Paper 1. Duration 1h 45min. Topics 1–5: Key concepts of biology (cells, microscopy, diffusion, osmosis, enzymes), Cells and control (mitosis, cell cycle, stem cells, cancer), Genetics (DNA, meiosis, genetic inheritance, mutation), Natural selection and genetic modification (adaptation, evolution, selective breeding, GMOs), Health, disease and the development of medicines (communicable diseases, non-communicable diseases, drug development). Section A must be exactly 10 MCQs. Section B groups start with short recall and build to 6-mark extended writing. Include at least 2 practical-based questions.",
     desc:"1h 45min, 100 marks. Topics 1–5. Section A: 10 MCQs. Section B: structured questions.",
     skills:["10 MCQs","Genetic inheritance","Extended writing"]},
    {n:"Paper 2",d:105,m:100,paperType:"parted",numGroups:7,
     markDist:"Target EXACTLY 100 marks. One group of 10 MCQ parts. Six structured groups totalling 90 marks. Final group should be a synoptic question linking multiple topics.",
     specGuide:"Edexcel GCSE Biology Paper 2. Duration 1h 45min. Topics 1–7 synoptic: Plant structures and their functions (photosynthesis, transpiration, plant hormones), Animal coordination, control and homeostasis (endocrine system, blood glucose regulation, thermoregulation, kidney/water balance), Exchange and transport in animals (circulatory system, heart, gas exchange, lung structure), Ecosystems and material cycles (food chains/webs, population size, carbon cycle, water cycle, decomposition, biodiversity). Synoptic questions should link topics from Papers 1 and 2. Include data analysis. Section A: 10 MCQs. At least one 6-mark extended writing question.",
     desc:"1h 45min, 100 marks. Topics 1–7 synoptic. Section A: 10 MCQs.",
     skills:["Synoptic questions","Data analysis","Homeostasis"]},
    {n:"Paper 3",d:75,m:70,paperType:"parted",numGroups:5,
     markDist:"Target EXACTLY 70 marks. One group of 5 MCQ parts. Four structured groups; include extended analysis and evaluation questions.",
     specGuide:"Edexcel GCSE Biology Paper 3. Duration 1h 15min. Synoptic — focuses on practical skills, data analysis, and experimental evaluation. Questions reference all 7 topic areas. Section A: 5 MCQs. Section B: 4 structured groups each based on a data set or experimental scenario. Students must: describe patterns in data, suggest explanations, evaluate methods, calculate means/percentages/rates, and draw conclusions. Include at least one question on planning an investigation (variables, controls, reliability).",
     desc:"1h 15min, 70 marks. Synoptic — practical skills and data analysis.",
     skills:["Data analysis","Experimental design","Synoptic reasoning"]},
  ],
  "chem:Edexcel":[
    {n:"Paper 1",d:105,m:100,paperType:"parted",numGroups:7,
     markDist:"Target EXACTLY 100 marks. One group of 10 MCQs. Six structured groups mixing short-answer and calculation questions. At least 3 calculation questions (moles, Mr, percentage yield).",
     specGuide:"Edexcel GCSE Chemistry Paper 1. Duration 1h 45min. Topics 1–6: Atomic structure (Bohr model, electron configuration, isotopes), Periodic Table (groups/periods, Group 1/7/0 properties, transition metals), Structure, bonding and properties of matter (ionic/covalent/metallic, giant/simple structures, allotropes), Quantitative chemistry (moles, Mr, mole calculations, limiting reactants, percentage yield, concentration of solutions), Chemical and ionic equations (balancing, state symbols), Electrolysis (products at electrodes, half equations). Section A: 10 MCQs. Section B: mole calculation questions MUST show formula → substitution → answer → unit.",
     desc:"1h 45min, 100 marks. Topics 1–6. Section A: 10 MCQs. Section B: structured.",
     skills:["Mole calculations","Electrolysis half-equations","Bonding structures"]},
    {n:"Paper 2",d:105,m:100,paperType:"parted",numGroups:7,
     markDist:"Target EXACTLY 100 marks. One group of 10 MCQs. Six structured groups synoptic. Include rate calculations and organic chemistry naming.",
     specGuide:"Edexcel GCSE Chemistry Paper 2. Duration 1h 45min. Topics 1–9 synoptic: Acids, bases and salts (neutralisation, preparing salts, pH), Obtaining and using metals (reactivity series, extracting iron in blast furnace, aluminium by electrolysis, life cycle assessment), Reversible reactions and equilibria (Le Chatelier's principle, Haber process conditions/equilibrium), Organic chemistry (homologous series, alkanes/alkenes/alcohols/carboxylic acids/esters, addition/condensation polymerisation, cracking), Chemical analysis (chromatography Rf values, gas tests, flame tests, precipitate tests), Earth and atmospheric science (atmosphere composition, greenhouse effect, global warming, air pollution). Section A: 10 MCQs. Rf calculation and rate graph interpretation required.",
     desc:"1h 45min, 100 marks. Topics 1–9 synoptic. Section A: 10 MCQs.",
     skills:["Organic naming","Rf calculations","Haber process equilibrium"]},
  ],
  "phys:Edexcel":[
    {n:"Paper 1",d:105,m:100,paperType:"parted",numGroups:7,
     markDist:"Target EXACTLY 100 marks. One group of 10 MCQs. Six structured groups. Every calculation MUST show: formula → substitution → working → answer with units.",
     specGuide:"Edexcel GCSE Physics Paper 1. Duration 1h 45min. Topics 1–6: Motion (distance/displacement/speed/velocity/acceleration, s-t and v-t graphs, equations of motion v=u+at, v²=u²+2as, s=½(u+v)t), Forces and motion (Newton's laws, resultant force, F=ma, weight W=mg, friction, momentum p=mv, conservation of momentum, stopping distances), Conservation of energy (kinetic KE=½mv², gravitational GPE=mgh, elastic Ee=½ke², efficiency, power P=W/t), Waves (wave equation v=fλ, reflection, refraction, EM spectrum, sound), Light and the EM spectrum (absorption/reflection/transmission, colour, uses of EM waves), Radioactivity (atomic structure, nuclear decay, half-life, uses of radiation). Section A: 10 MCQs. All calculations show full working.",
     desc:"1h 45min, 100 marks. Topics 1–6. Section A: 10 MCQs.",
     skills:["Equations of motion","Energy calculations","Half-life"]},
    {n:"Paper 2",d:105,m:100,paperType:"parted",numGroups:7,
     markDist:"Target EXACTLY 100 marks. One group of 10 MCQs. Six structured groups including at least 2 electricity calculation groups and one space/astronomy group.",
     specGuide:"Edexcel GCSE Physics Paper 2. Duration 1h 45min. Topics 1–8 including Astronomy: Astronomy (solar system, lifecycle of stars, red-shift, Big Bang), Energy — resources (renewable/non-renewable, advantages/disadvantages, power station efficiency), Electric circuits (current/voltage/resistance V=IR, series/parallel circuits, power P=IV and P=I²R, energy E=Pt), Static electricity (charge, electric fields, sparking), Magnetism and the motor effect (magnetic fields, F=BIL, Fleming's left-hand rule), Electromagnetic induction (generator effect, AC generator, transformer equation Vp/Vs=np/ns), Particle model (density ρ=m/V, SHC Q=mcΔT, SLH Q=mL, gas laws). Section A: 10 MCQs. All calculations: formula → substitution → answer → unit.",
     desc:"1h 45min, 100 marks. Topics 1–8 including Astronomy. Section A: 10 MCQs.",
     skills:["Transformer calculations","Circuit analysis","Gas laws"]},
  ],
  "eng-lang:AQA":[
    {n:"Paper 1 – Explorations in Creative Reading & Writing",d:105,m:80,paperType:"structured",
     paperPrompt:"eng-lang-p1",
     desc:"1h 45min, 80 marks. Section A: 4 reading questions (40 marks). Section B: creative writing (40 marks).",
     skills:["Reading comprehension","Language analysis","Creative writing"],
     configFields:[]},
    {n:"Paper 2 – Writers' Viewpoints & Perspectives",d:105,m:80,paperType:"comingSoon",
     desc:"Coming soon — non-fiction reading & transactional writing.",skills:[]},
  ],
  "eng-lit:AQA":[
    {n:"Paper 1 – Shakespeare & 19th-Century Novel",d:105,m:64,paperType:"structured",
     paperPrompt:"eng-lit-p1",
     desc:"1h 45min, 64 marks. Section A: Shakespeare (34 marks). Section B: 19th-century novel (30 marks).",
     skills:["Shakespeare analysis","19th-century prose","Level-based mark schemes"],
     configFields:[
       {id:"shakespeare",label:"Shakespeare text",type:"select",options:["Macbeth","Romeo and Juliet","The Tempest","The Merchant of Venice","Much Ado About Nothing","Julius Caesar"],default:"Macbeth"},
       {id:"novel",label:"19th-century novel",type:"select",options:["A Christmas Carol","The Strange Case of Dr Jekyll and Mr Hyde","Great Expectations","Jane Eyre","Frankenstein","Pride and Prejudice","The Sign of Four"],default:"A Christmas Carol"},
     ]},
    {n:"Paper 2 – Modern Texts & Poetry",d:135,m:96,paperType:"comingSoon",
     desc:"Coming soon — modern prose/drama + poetry anthology.",skills:[]},
  ],
  "history:AQA":[
    {n:"Paper 1 – Understanding the Modern World",d:105,m:84,paperType:"comingSoon",
     desc:"Coming soon — Germany, Cold War, and conflict topics.",skills:[]},
    {n:"Paper 2 – Shaping the Nation (Elizabethan England)",d:105,m:40,paperType:"structured",
     paperPrompt:"history-p2-elizabethan",
     desc:"1h 45min, 40 marks. Section B: Elizabethan England c1568–1603 (interpretation, explain, account, historic environment).",
     skills:["Interpretation analysis","Explain significance","Historic environment"],
     configFields:[
       {id:"britishStudy",label:"British depth study",type:"select",options:["Elizabethan England c1568-1603"],default:"Elizabethan England c1568-1603"},
       {id:"examYear",label:"Exam year (affects historic environment question)",type:"select",options:["2026","2027","2028"],default:"2026"},
     ]},
  ],
  "geography:AQA":[
    {n:"Paper 1 – Living with the Physical Environment",d:90,m:88,paperType:"parted",numGroups:4,
     markDist:"Target EXACTLY 88 marks across 3 sections (3 groups of questions + 1 final evaluation). Section A (Natural Hazards) ~30 marks, Section B (Living World) ~30 marks, Section C (UK Physical Landscapes) ~28 marks. Include: 1-mark name/state, 2-mark describe, 4-mark explain, 6-mark extended, and one 9-mark essay with SPaG marks.",
     specGuide:"AQA GCSE Geography Paper 1. 1h 30min, 88 marks. THREE compulsory sections: SECTION A — The Challenge of Natural Hazards: tectonic hazards (plate tectonics, earthquakes, volcanoes — causes, effects, responses, prediction), weather hazards (tropical storms — distribution, causes, effects, responses), climate change (causes, effects, managing). SECTION B — The Living World: ecosystems (food webs, nutrient cycles), tropical rainforests (structure, biodiversity, deforestation causes/effects, sustainable management), hot deserts (adaptations, opportunities, challenges, desertification) OR cold environments. SECTION C — Physical Landscapes in the UK: either coastal landscapes (erosion processes, landforms — headlands/bays/caves/arches/stacks/beaches, coastal management) OR river landscapes (erosion/transportation/deposition, meanders/oxbow lakes/floodplains/deltas, flood management). MUST include: at least one figure-based question ('Describe what Figure X shows'), AQA command words (name/state/describe/explain/assess/to what extent), one 9-mark essay with 3 SPaG marks, one 6-mark evaluation question.",
     desc:"1h 30min, 88 marks. Three sections: Natural Hazards, Living World, UK Physical Landscapes.",
     skills:["Figure analysis","6-mark extended writing","9-mark essay + SPaG"]},
    {n:"Paper 2 – Challenges in the Human Environment",d:90,m:88,paperType:"parted",numGroups:4,
     markDist:"Target EXACTLY 88 marks. Three sections: Section A (Urban Issues) ~30 marks, Section B (Changing Economic World) ~30 marks, Section C (Resource Management) ~28 marks. Same mark distribution pattern as Paper 1 — 1-mark, 2-mark, 4-mark, 6-mark, 9-mark questions.",
     specGuide:"AQA GCSE Geography Paper 2. 1h 30min, 88 marks. THREE compulsory sections: SECTION A — Urban Issues and Challenges: urbanisation trends, megacities, Rio de Janeiro (growth, opportunities/challenges, favelas, improvements) OR UK city case study (regeneration, migration, suburbanisation), sustainable urban development. SECTION B — The Changing Economic World: development gap (measures of development, DTM, Rostow), causes of uneven development, LICs/NEEs (Nigeria case study: location, context, TNCs, international aid, political/social/economic changes), UK economy (post-industrial, science parks, quaternary sector). SECTION C — The Challenge of Resource Management: global distribution of food/water/energy, food supply issues (increasing food production, sustainable food), water supply (deficit/surplus, water transfer, sustainable water), energy supply (fossil fuels vs renewables, UK energy mix). Include case study questions requiring named examples. One 9-mark essay + 3 SPaG marks.",
     desc:"1h 30min, 88 marks. Three sections: Urban Issues, Changing Economic World, Resource Management.",
     skills:["Case study questions","Development gap","9-mark essay + SPaG"]},
    {n:"Paper 3 – Geographical Applications",d:75,m:76,paperType:"parted",numGroups:3,
     markDist:"Target EXACTLY 76 marks. Section A (Issue Evaluation) ~36 marks: starts with 3-4 short questions about a fictional resource booklet then a 12-mark decision/evaluation question. Section B (Fieldwork) ~40 marks: 2 sections on physical and human fieldwork — data collection, presentation techniques, analysis, evaluation. Final question 8 marks.",
     specGuide:"AQA GCSE Geography Paper 3. 1h 15min, 76 marks. SECTION A — Issue Evaluation: create a brief fictional 'pre-release resource booklet' (3 figures: map, graph, photograph description) on an environmental or human geography issue (e.g. coastal management, urban regeneration, sustainable energy). Questions progress: describe Figure 1 (2 marks), explain an issue shown (4 marks), use figures to assess the situation (6 marks), 12-mark decision-making question ('To what extent should [decision]? Use evidence from the resources and your own knowledge' — 9 marks + 3 SPaG). SECTION B — Fieldwork: questions on physical fieldwork (methods of data collection, health/safety, data presentation) and human fieldwork (hypothesis, sampling strategy, data analysis, reliability and validity). Include at least one question requiring students to sketch a graph or describe how they would present data.",
     desc:"1h 15min, 76 marks. Section A: Issue evaluation. Section B: Fieldwork methods.",
     skills:["Resource interpretation","Fieldwork evaluation","12-mark decision question"]},
  ],
  "business:AQA":[
    {n:"Paper 1",d:105,m:90,paperType:"parted",numGroups:5,
     markDist:"Target EXACTLY 90 marks. Group 1: exactly 5 MCQ parts (1 mark each, type:mcq). Groups 2–5: structured questions. Include: one 3-mark question, two 6-mark 'Explain' questions, one 9-mark 'Analyse' question, one 12-mark 'Evaluate/Justify' question with level-based mark scheme (4 levels).",
     specGuide:"AQA GCSE Business Paper 1. 1h 45min, 90 marks. Four topic areas: (1) Business in the Real World — business aims/objectives, stakeholders, business ownership types (sole trader/partnership/ltd/plc/franchise/social enterprise), business plans, location decisions, business growth; (2) Influences on Business — technology impacts, ethical trading, environmental considerations, economic climate, competitive environment, legislation (employment/consumer); (3) Business Operations — production methods (job/batch/flow), lean production (just in time/kaizen/cell production), quality management, procurement, supply chain management; (4) Human Resources — organisational structures (hierarchies, span of control), recruitment and selection, training (on-the-job/off-the-job), motivation theories (Taylor/Maslow/Herzberg), leadership styles, employment law. Group 1: 5 MCQs on key terms. Remaining groups: structured using a named fictional business context. 12-mark evaluation must include: 2+ justified points for, 2+ against, supported overall judgement.",
     desc:"1h 45min, 90 marks. Business operations, HR, and wider influences.",
     skills:["12-mark evaluate question","Motivation theories","Business contexts"]},
    {n:"Paper 2",d:105,m:90,paperType:"parted",numGroups:5,
     markDist:"Target EXACTLY 90 marks. Group 1: 5 MCQs. Groups 2–5: structured. Include financial calculations (revenue/profit/break-even/ARR), one 9-mark 'Analyse', one 12-mark 'Evaluate'.",
     specGuide:"AQA GCSE Business Paper 2. 1h 45min, 90 marks. Three topic areas: (5) Finance — revenue (price × quantity), costs (fixed/variable/total), profit and loss, break-even (contribution/break-even point/margin of safety calculations and graphs), cash flow forecasts, sources of finance (internal/external — loans, shares, retained profit, crowdfunding, trade credit), financial statements (balance sheets, income statements); (6) Marketing — market research (primary/secondary, qualitative/quantitative), segmentation (demographic/geographic/psychographic), marketing mix (4Ps — product lifecycle, pricing strategies, distribution channels, promotional methods), use of digital marketing; (7) External Influences — economic climate (recession/growth, inflation, interest rates, unemployment, exchange rates effect on imports/exports), legislation (consumer law, employment law), environmental and ethical issues, globalisation and international trade. Financial calculations must show formula → working → answer → unit. Break-even point = fixed costs ÷ contribution per unit.",
     desc:"1h 45min, 90 marks. Finance, marketing, external influences.",
     skills:["Break-even calculations","Marketing mix","12-mark evaluate"]},
  ],
  "computing:AQA":[
    {n:"Paper 1 – Computational Thinking & Programming",d:150,m:90,paperType:"parted",numGroups:6,
     markDist:"Target EXACTLY 90 marks. Groups mix: 1-mark recall, 2-mark describe, 4-mark application, 8-mark extended. At least one trace table question, one pseudocode-writing question, one algorithm design question.",
     specGuide:"AQA GCSE Computer Science Paper 1. 2h 30min, 90 marks. Topics: (1) Fundamentals of Algorithms — algorithm design (flowcharts, pseudocode), trace tables (show step-by-step variable changes), searching (linear vs binary — comparison), sorting (bubble, merge, insertion — steps and comparisons), Big O notation (awareness); (2) Programming Fundamentals — variables/constants, data types (integer/real/Boolean/string/char), sequence/selection/iteration, nested structures, string manipulation (length, substring, concatenation), file handling (open/read/write/close), exception handling; (3) Producing Robust Programs — defensive design (input validation, authentication), testing (normal/boundary/erroneous test data, trace tables to detect errors), syntax vs logic errors; (4) Boolean Logic — truth tables (AND/OR/NOT), logic diagrams; (5) Programming Languages — high vs low-level, compilers vs interpreters, IDEs (editor/debugger/translator). Use AQA pseudocode syntax EXACTLY: assignment uses ←, output uses OUTPUT, input uses USERINPUT, loops: FOR i ← 1 TO n, WHILE condition DO, IF/ELSE/ENDIF. Trace table questions MUST show exact column headers and cell values.",
     desc:"2h 30min, 90 marks. Algorithms, programming, Boolean logic, languages.",
     skills:["Trace tables","Pseudocode writing","Algorithm design"]},
    {n:"Paper 2 – Computer Systems",d:90,m:90,paperType:"parted",numGroups:6,
     markDist:"Target EXACTLY 90 marks. Mix 1-mark, 2-mark, 4-mark and 8-mark questions. Include at least one binary/hex conversion calculation and one networking scenario question.",
     specGuide:"AQA GCSE Computer Science Paper 2. 1h 30min, 90 marks. Topics: (1) Systems Architecture — Von Neumann architecture (CPU, ALU, CU, registers: PC/MAR/MDR/ACC), fetch-decode-execute cycle (step by step), factors affecting CPU performance (cores/cache/clock speed), embedded systems; (2) Memory and Storage — RAM vs ROM (volatile/non-volatile), types of secondary storage (HDD/SSD/optical/magnetic), file sizes calculation (bits/bytes/KB/MB/GB), data representation: binary (denary↔binary↔hex conversions, binary addition, overflow, two's complement), character encoding (ASCII/Unicode), images (pixels/colour depth/resolution, file size = width×height×colour depth), sound (sample rate/bit depth/file size); (3) Computer Networks — types (LAN/WAN/PAN), topologies (bus/star/mesh), wired vs wireless, hardware (NIC/hub/switch/router/WAP), protocols (TCP/IP, HTTP/HTTPS, FTP, SMTP, DNS), packet switching (packets/headers/routing), the Internet vs World Wide Web; (4) Network Security — threats (malware/phishing/social engineering/brute force/denial of service/SQL injection), prevention (firewalls/encryption/strong passwords/2FA/access levels); (5) Systems Software — operating system functions (memory management, process management, file management, user interface), utility software; (6) Ethical, Legal, Cultural and Environmental Impacts — Data Protection Act 2018/GDPR, Computer Misuse Act 1990, Copyright Designs and Patents Act 1988, Freedom of Information Act, environmental impact, ethical issues (AI, privacy). Binary/hex questions MUST show full working.",
     desc:"1h 30min, 90 marks. Systems architecture, networks, cybersecurity, data representation, ethics.",
     skills:["Binary/hex conversions","Network protocols","Data Protection Act"]},
  ],
  "dt:AQA":[
    {n:"Paper 1 – Core Technical Principles",d:90,m:100,paperType:"parted",numGroups:5,
     markDist:"Target EXACTLY 100 marks. Group 1: exactly 20 MCQ parts (1 mark each, type:mcq) = 20 marks. Groups 2–5: extended structured questions totalling 80 marks — include 4-mark, 6-mark, and 8-mark questions.",
     specGuide:"AQA GCSE Design and Technology Paper 1. 1h 30min, 100 marks. SECTION A (20 marks): exactly 20 MCQ questions (type:mcq) covering all core technical principles — materials (timber: hardwood/softwood/manufactured boards; metals: ferrous/non-ferrous/alloys; polymers: thermoplastic/thermosetting; textiles: natural/synthetic/blended; papers/boards), forces and stresses (tension/compression/torsion/bending/shear), physical/working/aesthetic properties, scales of production (one-off/batch/mass/continuous), CAD/CAM (CNC router/laser cutter/3D printer — advantages/disadvantages), QA and QC, tolerances. SECTION B (80 marks across 4 groups): (B1) New and emerging technologies — 4 and 6-mark questions on automation, robotics, flexible manufacturing, biotechnology, nano-materials, smart materials, global vs local production, FabLabs; (B2) Energy generation and storage — renewable/non-renewable, energy storage, sustainability, carbon footprint, life cycle assessment; (B3) Designing and making principles — ergonomics, anthropometrics, inclusive design, user-centred design, 8-mark design question (sketch/annotate a product for a given brief); (B4) Material properties and selection — comparing materials for a given application, sustainability (reduce/reuse/recycle), finishes (paint/varnish/electroplating/anodising). The 8-mark design question requires a sketched annotated design solution.",
     desc:"1h 30min, 100 marks. Section A: 20 MCQs. Section B: core technical principles.",
     skills:["20 MCQs","8-mark design question","Material selection"]},
    {n:"Paper 2 – Specialist Technical Principles",d:60,m:80,paperType:"parted",numGroups:4,
     markDist:"Target EXACTLY 80 marks. Group 1: exactly 5 MCQ parts (type:mcq) = 5 marks. Groups 2–4: 3 structured groups totalling 75 marks, mixing 2-mark, 4-mark, 6-mark and 8-mark questions.",
     specGuide:"AQA GCSE Design and Technology Paper 2. 1h, 80 marks. Specialist focus on one materials area (generate questions appropriate for either timber/metals/polymers/textiles/papers/boards/electronic systems). SECTION A (5 marks): 5 MCQ parts on specialist material properties, manufacturing processes, and tools. SECTION B (75 marks across 3 groups): (B1) Specialist material knowledge — properties (physical: density/strength/conductivity/malleability; working: machinability/weldability; aesthetic), selection criteria for a given application, 2-mark and 4-mark questions; (B2) Manufacturing processes for specialist area — forming (casting/forging/press forming for metals; injection moulding/blow moulding for polymers; warp/weft/weaving for textiles), cutting (marking out, sawing, chiselling for timber), joining (welding/soldering/adhesives/screws/bolts), finishing (sanding/painting/lacquering/plating), 4-mark and 6-mark questions; (B3) Evaluation question — 8-mark question: 'Evaluate the suitability of [specialist material] for [given product], considering its properties, manufacturing process, cost and sustainability. Justify your choice.' Level-based mark scheme L1(1-2), L2(3-4), L3(5-6), L4(7-8).",
     desc:"1h, 80 marks. Specialist material focus. Section A: 5 MCQs. Section B: extended.",
     skills:["5 MCQs","Material properties","8-mark evaluate"]},
  ],
  "combined-sci:AQA":[
    {n:"All papers",d:75,m:70,paperType:"comingSoon",desc:"Coming soon — Combined Science Trilogy and Synergy papers.",skills:[]},
  ],
  "drama:AQA":[
    {n:"Written Exam",d:105,m:80,paperType:"comingSoon",desc:"Coming soon — Drama written exam.",skills:[]},
  ],
  "music:AQA":[
    {n:"Written Exam",d:90,m:80,paperType:"comingSoon",desc:"Coming soon — Music written exam.",skills:[]},
  ],
};

export const C  = D => ({background:D?"#161b27":"#fff", border:`1px solid ${D?"#2a3347":"#e5e7eb"}`, borderRadius:14});
export const I  = (D,x={}) => ({width:"100%",background:D?"#1e2537":"#fff",border:`1.5px solid ${D?"#374151":"#d1d5db"}`,borderRadius:10,padding:"10px 14px",fontSize:13,outline:"none",color:D?"#e8ecf4":"#111827",...x});
export const B  = (color,outline,extra={}) => ({padding:"9px 16px",borderRadius:10,border:outline?`1.5px solid ${color}`:"none",background:outline?"transparent":color,color:outline?color:"#fff",cursor:"pointer",fontSize:13,fontWeight:600,...extra});
export const mu = D => D?"#8896b3":"#9ca3af";
export const tx = D => D?"#e8ecf4":"#111827";

export function useAttentionLayer() {
  const [activeId, setActiveId] = React.useState(null);
  const [pulsing, setPulsing] = React.useState(null);
  const props = (id) => ({
    onMouseEnter: () => { setActiveId(id); setPulsing(id); setTimeout(()=>setPulsing(null),300); },
    onMouseLeave: () => setActiveId(null),
    onClick: () => { setActiveId(v=>v===id?null:id); setPulsing(id); setTimeout(()=>setPulsing(null),300); },
    style: { opacity: activeId===null||activeId===id?1:0.45, transition:"opacity .18s ease", cursor:"pointer" },
  });
  const isActive = (id) => activeId === id;
  const isPulsing = (id) => pulsing === id;
  return { activeId, props, isActive, isPulsing };
}

export function ProcessFlowDiagram({ steps=[], accent="#059669", D=false, width=600 }) {
  const { props: attn, isActive, isPulsing } = useAttentionLayer();
  const stepW=110, stepH=54, arrowW=28, gap=arrowW;
  const perRow=Math.max(1,Math.floor((width)/(stepW+gap)));
  const rows=[];
  for(let i=0;i<steps.length;i+=perRow) rows.push(steps.slice(i,i+perRow));
  const svgH=rows.length*(stepH+40)+20;
  const bg=D?"#161b27":"#fff";
  const textCol=D?"#e8ecf4":"#111827";
  const subCol=D?"#8896b3":"#6b7280";
  return (
    <svg viewBox={`0 0 ${width} ${svgH}`} width="100%" style={{display:"block",maxWidth:width}}
      xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Process flow diagram">
      <rect width={width} height={svgH} fill={bg} rx="8"/>
      <defs>
        <marker id="arrow-proc" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill={accent}/>
        </marker>
      </defs>
      {rows.map((row,ri)=>{
        const rowY=ri*(stepH+40)+20;
        const reversed=ri%2===1;
        const displayRow=reversed?[...row].reverse():row;
        const totalRowW=displayRow.length*stepW+(displayRow.length-1)*gap;
        const startX=(width-totalRowW)/2;
        return (
          <g key={ri}>
            {displayRow.map((step,si)=>{
              const x=startX+si*(stepW+gap);
              const stepAccent=step.color||accent;
              const sid=step.id||String(ri*100+si);
              const active=isActive(sid);
              const pulse=isPulsing(sid);
              return (
                <g key={sid} {...attn(sid)}>
                  <rect x={x} y={rowY} width={stepW} height={stepH} rx="8"
                    fill={active?(stepAccent+"55"):(stepAccent+(D?"22":"18"))}
                    stroke={stepAccent} strokeWidth="1.5"
                    style={{transform:pulse?"scale(1.04)":"scale(1)",transition:"transform .15s ease",transformOrigin:`${x+stepW/2}px ${rowY+stepH/2}px`}}/>
                  <text x={x+stepW/2} y={rowY+(step.sublabel?stepH/2-4:stepH/2+5)}
                    textAnchor="middle" fontSize="11" fontWeight="600" fill={textCol}
                    fontFamily="Arial,sans-serif" style={{userSelect:"none"}}>{step.label}</text>
                  {step.sublabel&&<text x={x+stepW/2} y={rowY+stepH/2+12}
                    textAnchor="middle" fontSize="9" fill={subCol}
                    fontFamily="Arial,sans-serif" style={{userSelect:"none"}}>{step.sublabel}</text>}
                  {si<displayRow.length-1&&<line x1={x+stepW+2} y1={rowY+stepH/2}
                    x2={x+stepW+gap-2} y2={rowY+stepH/2}
                    stroke={accent} strokeWidth="1.5" markerEnd="url(#arrow-proc)"/>}
                </g>
              );
            })}
            {ri<rows.length-1&&<line
              x1={reversed?startX+stepW/2:startX+(row.length-1)*(stepW+gap)+stepW/2} y1={rowY+stepH}
              x2={reversed?startX+stepW/2:startX+(row.length-1)*(stepW+gap)+stepW/2} y2={rowY+stepH+30}
              stroke={accent} strokeWidth="1.5" markerEnd="url(#arrow-proc)"/>}
          </g>
        );
      })}
    </svg>
  );
}

export function CycleDiagram({ steps=[], accent="#059669", D=false, size=320 }) {
  const { props: attn, isActive, isPulsing } = useAttentionLayer();
  const cx=size/2, cy=size/2, r=size*0.33, nodeR=size*0.095, n=steps.length;
  const bg=D?"#161b27":"#fff";
  const textCol=D?"#e8ecf4":"#111827";
  const subCol=D?"#8896b3":"#6b7280";
  const positions=steps.map((_,i)=>{
    const angle=(2*Math.PI*i/n)-Math.PI/2;
    return {x:cx+r*Math.cos(angle),y:cy+r*Math.sin(angle),angle};
  });
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{display:"block",maxWidth:size}}
      xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Cycle diagram">
      <rect width={size} height={size} fill={bg} rx="8"/>
      <defs>
        <marker id="arrow-cyc" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
          <polygon points="0 0, 7 2.5, 0 5" fill={accent}/>
        </marker>
      </defs>
      {positions.map((pos,i)=>{
        const next=positions[(i+1)%n];
        const stepAccent=steps[i].color||accent;
        const sid=steps[i].id||String(i);
        const active=isActive(sid);
        const pulse=isPulsing(sid);
        const dx=next.x-pos.x, dy=next.y-pos.y;
        const dist=Math.sqrt(dx*dx+dy*dy);
        const ux=dx/dist, uy=dy/dist;
        const x1=pos.x+ux*(nodeR+2), y1=pos.y+uy*(nodeR+2);
        const x2=next.x-ux*(nodeR+8), y2=next.y-uy*(nodeR+8);
        const midX=(x1+x2)/2-uy*18, midY=(y1+y2)/2+ux*18;
        return (
          <g key={sid}>
            <path d={`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`}
              fill="none" stroke={accent} strokeWidth="1.5" markerEnd="url(#arrow-cyc)"/>
            <g {...attn(sid)}>
              <circle cx={pos.x} cy={pos.y} r={active?nodeR*1.12:nodeR}
                fill={stepAccent+(D?"28":"20")} stroke={stepAccent} strokeWidth="1.5"
                style={{transition:"r .15s ease"}}/>
              <text x={pos.x} y={pos.y+(steps[i].sublabel?-3:4)}
                textAnchor="middle" fontSize="9" fontWeight="600" fill={textCol}
                fontFamily="Arial,sans-serif" style={{userSelect:"none"}}>{steps[i].label}</text>
              {steps[i].sublabel&&<text x={pos.x} y={pos.y+11}
                textAnchor="middle" fontSize="8" fill={subCol}
                fontFamily="Arial,sans-serif" style={{userSelect:"none"}}>{steps[i].sublabel}</text>}
            </g>
          </g>
        );
      })}
    </svg>
  );
}

export function HierarchyTree({ root=null, accent="#0891B2", D=false, width=560 }) {
  const { props: attn, isActive } = useAttentionLayer();
  if(!root) return null;
  const bg=D?"#161b27":"#fff";
  const textCol=D?"#e8ecf4":"#111827";
  const nodeW=100, nodeH=36, levelGap=60;
  function countLeaves(node){if(!node.children||!node.children.length)return 1;return node.children.reduce((s,c)=>s+countLeaves(c),0);}
  function buildLayout(node,depth,xOffset){
    const leaves=countLeaves(node);
    const nodeX=xOffset+(leaves*nodeW+(leaves-1)*12)/2-nodeW/2;
    const nodeY=depth*(nodeH+levelGap)+20;
    const result=[{node,x:nodeX,y:nodeY,depth}];
    if(node.children){let childX=xOffset;node.children.forEach(child=>{const childLeaves=countLeaves(child);result.push(...buildLayout(child,depth+1,childX));childX+=childLeaves*nodeW+(childLeaves-1)*12+16;});}
    return result;
  }
  const allNodes=buildLayout(root,0,0);
  const maxX=Math.max(...allNodes.map(n=>n.x+nodeW));
  const svgH=(Math.max(...allNodes.map(n=>n.depth))+1)*(nodeH+levelGap)+40;
  const scale=maxX>width-20?(width-20)/maxX:1;
  return (
    <svg viewBox={`0 0 ${width} ${svgH*scale}`} width="100%" style={{display:"block",maxWidth:width}}
      xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Hierarchy diagram">
      <rect width={width} height={svgH*scale} fill={bg} rx="8"/>
      <defs>
        <filter id="node-shadow"><feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2"/></filter>
      </defs>
      <g transform={`scale(${scale})`}>
        {allNodes.map(({node,x,y,depth},i)=>{
          const nodeAccent=node.color||accent;
          const sid=node.label+String(i);
          const active=isActive(sid);
          const parentNode=allNodes.find(p=>p.node.children&&p.node.children.includes(node)&&p.depth===depth-1);
          return (
            <g key={i}>
              {parentNode&&<line x1={parentNode.x+nodeW/2} y1={parentNode.y+nodeH} x2={x+nodeW/2} y2={y}
                stroke={nodeAccent} strokeWidth="1.2" strokeDasharray={depth>1?"4,2":""} opacity="0.7"/>}
              <g {...attn(sid)}>
                <rect x={x} y={y} width={nodeW} height={nodeH} rx="6"
                  fill={active?(nodeAccent+"44"):(nodeAccent+(D?"22":"18"))}
                  stroke={nodeAccent} strokeWidth="1.5"
                  filter={active?"url(#node-shadow)":undefined}/>
                <text x={x+nodeW/2} y={y+nodeH/2+4}
                  textAnchor="middle" fontSize="10" fontWeight="600" fill={textCol}
                  fontFamily="Arial,sans-serif" style={{userSelect:"none"}}>{node.label}</text>
              </g>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

export function ComparisonGrid({ rows=[], columns=[], data={}, accent="#7C3AED", D=false }) {
  const cellW=90, cellH=38, labelW=120, headerH=42;
  const gridW=labelW+columns.length*cellW+2;
  const gridH=headerH+rows.length*cellH+2;
  const bg=D?"#161b27":"#fff";
  const hdrBg=D?accent+"33":accent+"18";
  const textCol=D?"#e8ecf4":"#111827";
  const subCol=D?"#8896b3":"#6b7280";
  const borderCol=D?"#2a3347":"#e2e8f0";
  return (
    <svg viewBox={`0 0 ${gridW} ${gridH}`} width="100%" style={{display:"block",maxWidth:gridW}}
      xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Comparison grid">
      <rect width={gridW} height={gridH} fill={bg} rx="8" stroke={borderCol} strokeWidth="1"/>
      <rect x={0} y={0} width={labelW} height={headerH} fill={hdrBg}/>
      {columns.map((col,ci)=>(
        <g key={col.id}>
          <rect x={labelW+ci*cellW} y={0} width={cellW} height={headerH} fill={hdrBg}/>
          <line x1={labelW+ci*cellW} y1={0} x2={labelW+ci*cellW} y2={gridH} stroke={borderCol} strokeWidth="1"/>
          <text x={labelW+ci*cellW+cellW/2} y={headerH/2+4}
            textAnchor="middle" fontSize="10" fontWeight="700" fill={textCol}
            fontFamily="Arial,sans-serif" style={{userSelect:"none"}}>{col.label}</text>
        </g>
      ))}
      {rows.map((row,ri)=>{
        const y=headerH+ri*cellH;
        return (
          <g key={row.id}>
            <line x1={0} y1={y} x2={gridW} y2={y} stroke={borderCol} strokeWidth="1"/>
            <rect x={0} y={y} width={labelW} height={cellH} fill={ri%2===0?bg:(D?"rgba(255,255,255,.02)":"rgba(0,0,0,.015)")}/>
            <text x={8} y={y+cellH/2+4} fontSize="10" fontWeight="600" fill={textCol}
              fontFamily="Arial,sans-serif" style={{userSelect:"none"}}>{row.label}</text>
            {columns.map((col,ci)=>{
              const val=data[`${row.id}:${col.id}`];
              let symbol="—", symCol=subCol;
              if(val===true||val==="yes"){symbol="✓";symCol="#059669";}
              else if(val===false||val==="no"){symbol="✗";symCol="#DC2626";}
              else if(val==="partial"){symbol="◑";symCol="#D97706";}
              else if(typeof val==="string"&&val){symbol=val;symCol=textCol;}
              return (
                <g key={col.id}>
                  <rect x={labelW+ci*cellW} y={y} width={cellW} height={cellH} fill={ri%2===0?bg:(D?"rgba(255,255,255,.02)":"rgba(0,0,0,.015)")}/>
                  <text x={labelW+ci*cellW+cellW/2} y={y+cellH/2+4}
                    textAnchor="middle" fontSize={typeof val==="string"&&val.length>2?"9":"12"}
                    fontWeight="600" fill={symCol}
                    fontFamily="Arial,sans-serif" style={{userSelect:"none"}}>{symbol}</text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

export function LabelledStructure({ imageUrl=null, labels=[], accent="#0891B2", D=false, width=520, selfTestMode=false, onAllCorrect=null }) {
  const [revealed, setRevealed] = React.useState({});
  const [inputs, setInputs] = React.useState({});
  const [hoveredId, setHoveredId] = React.useState(null);
  const imgH=width*0.65;
  const handleInput=(id,value)=>{
    const next={...inputs,[id]:value};
    setInputs(next);
    const correct=labels.find(l=>l.id===id);
    if(correct&&value.trim().toLowerCase()===correct.label.toLowerCase())
      setRevealed(r=>({...r,[id]:true}));
    if(onAllCorrect&&labels.every(l=>next[l.id]?.trim().toLowerCase()===l.label.toLowerCase()))
      onAllCorrect();
  };
  if(!imageUrl&&!labels.length) return null;
  return (
    <div style={{position:"relative",width:"100%",maxWidth:width,userSelect:"none"}}>
      {imageUrl
        ?<img src={imageUrl} alt="diagram" style={{width:"100%",display:"block",borderRadius:8,border:`1px solid ${D?"#2a3347":"#e5e7eb"}`}}/>
        :<div style={{width:"100%",height:imgH,borderRadius:8,background:D?"#1e2537":"#f3f4f6",border:`1.5px dashed ${D?"#374151":"#d1d5db"}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <span style={{fontSize:12,color:D?"#8896b3":"#9ca3af"}}>Diagram placeholder</span>
        </div>
      }
      {labels.map(label=>{
        const isHovered=hoveredId===label.id;
        const isCorrect=revealed[label.id];
        const labelAccent=isCorrect?"#059669":(isHovered?accent:(D?"#8896b3":"#6b7280"));
        return (
          <div key={label.id}
            style={{position:"absolute",left:`${label.x}%`,top:`${label.y}%`,transform:"translate(-50%,-50%)",zIndex:10}}
            onMouseEnter={()=>setHoveredId(label.id)}
            onMouseLeave={()=>setHoveredId(null)}>
            {selfTestMode&&!isCorrect
              ?<input value={inputs[label.id]||""} onChange={e=>handleInput(label.id,e.target.value)}
                  placeholder="?" style={{width:80,fontSize:10,fontWeight:700,textAlign:"center",padding:"2px 4px",borderRadius:4,border:`1.5px solid ${labelAccent}`,background:D?"#161b27":"#fff",color:D?"#e8ecf4":"#111827",outline:"none"}}/>
              :<div style={{background:isCorrect?"#059669":(isHovered?accent:(D?accent+"44":accent+"22")),
                  color:isCorrect||isHovered?"#fff":(D?"#e8ecf4":"#111827"),
                  border:`1.5px solid ${labelAccent}`,borderRadius:4,padding:"2px 8px",fontSize:10,fontWeight:700,
                  whiteSpace:"nowrap",boxShadow:isHovered?"0 2px 8px rgba(0,0,0,.25)":"none",
                  transition:"all .15s",cursor:"default",
                  transform:isHovered?"scale(1.4)":"scale(1)",
                  opacity:selfTestMode&&!isCorrect?0:1}}>{label.label}</div>
            }
          </div>
        );
      })}
    </div>
  );
}

export function TimelineDiagram({ events=[], accent="#D97706", D=false, width=580 }) {
  const { props: attn, isActive, isPulsing } = useAttentionLayer();
  if(!events.length) return null;
  const bg=D?"#161b27":"#fff";
  const textCol=D?"#e8ecf4":"#111827";
  const subCol=D?"#8896b3":"#6b7280";
  const lineY=80, svgH=170, padX=28;
  const lineX1=padX, lineX2=width-padX, lineLen=lineX2-lineX1, n=events.length;
  return (
    <svg viewBox={`0 0 ${width} ${svgH}`} width="100%"
      style={{display:"block",maxWidth:width,overflow:"visible"}}
      xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Timeline diagram">
      <rect width={width} height={svgH} fill={bg} rx="8"/>
      <line x1={lineX1} y1={lineY} x2={lineX2} y2={lineY} stroke={accent} strokeWidth="2" opacity="0.4"/>
      <polygon points={`${lineX2},${lineY-5} ${lineX2+10},${lineY} ${lineX2},${lineY+5}`} fill={accent} opacity="0.6"/>
      {events.map((ev,i)=>{
        const x=lineX1+(i/Math.max(n-1,1))*lineLen;
        const above=i%2===0;
        const evAccent=ev.color||accent;
        const dotR=ev.important?7:5;
        const sid=ev.id||String(i);
        const active=isActive(sid);
        const pulse=isPulsing(sid);
        return (
          <g key={sid} {...attn(sid)}>
            <line x1={x} y1={lineY-dotR} x2={x} y2={above?lineY-dotR-32:lineY+dotR+32}
              stroke={evAccent} strokeWidth="1.2" opacity="0.6"/>
            <circle cx={x} cy={lineY} r={active?dotR*1.3:dotR}
              fill={evAccent+(D?"cc":"dd")} stroke={evAccent} strokeWidth={ev.important?2:1}
              style={{transition:"r .15s ease"}}/>
            <text x={x} y={above?lineY-dotR-38:lineY+dotR+46}
              textAnchor="middle" fontSize="9" fontWeight="700" fill={textCol}
              fontFamily="Arial,sans-serif" style={{userSelect:"none"}}>{ev.label}</text>
            {ev.date&&<text x={x} y={above?lineY-dotR-26:lineY+dotR+34}
              textAnchor="middle" fontSize="8" fill={evAccent}
              fontFamily="Arial,sans-serif" style={{userSelect:"none"}}>{ev.date}</text>}
            {ev.sublabel&&<text x={x} y={above?lineY-dotR-14:lineY+dotR+22}
              textAnchor="middle" fontSize="8" fill={subCol}
              fontFamily="Arial,sans-serif" style={{userSelect:"none"}}>{ev.sublabel}</text>}
          </g>
        );
      })}
    </svg>
  );
}

export function DiagramRenderer({ diagram, D=false, width=560 }) {
  if(!diagram||!diagram.type) return null;
  const {type,data,accent}=diagram;
  const itemCount = data ? (
    (data.steps||data.events||[]).length ||
    (data.root ? 1 : 0) ||
    ((data.rows||[]).length)
  ) : 0;
  const rendered =
    type==="process"    ? <ProcessFlowDiagram steps={data?.steps||[]} accent={accent} D={D} width={width}/> :
    type==="cycle"      ? <CycleDiagram steps={data?.steps||[]} accent={accent} D={D}/> :
    type==="hierarchy"  ? <HierarchyTree root={data?.root||null} accent={accent} D={D} width={width}/> :
    type==="comparison" ? <ComparisonGrid rows={data?.rows||[]} columns={data?.columns||[]} data={data?.cells||{}} accent={accent} D={D}/> :
    type==="structure"  ? <LabelledStructure imageUrl={data?.imageUrl||null} labels={data?.labels||[]} accent={accent} D={D} width={width}/> :
    type==="timeline"   ? <TimelineDiagram events={data?.events||[]} accent={accent} D={D} width={width}/> :
    null;
  if(!rendered) return null;
  return (
    <div>
      {rendered}
      {itemCount > 2 && (
        <p style={{fontSize:10,color:D?"#8896b3":"#9ca3af",textAlign:"center",marginTop:4,fontStyle:"italic"}}>
          Tap or hover elements to highlight
        </p>
      )}
    </div>
  );
}
