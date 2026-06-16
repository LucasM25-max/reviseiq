// generatedContent.js
// -----------------------------------------------------------------------------
// In-code curriculum content for ReviseIQ.
//
// ReviseIQ has no admin role: all study content (notes, flashcards and exam
// questions) is authored DIRECTLY in code here and ships with the app. This
// file is the single source of truth for that content.
//
// SHAPE (must match what mergeTopics() in social.jsx expects for base topics):
//
//   GENERATED_CONTENT[subjectId] = [
//     { id, number, title, sections: [
//       { id, title,
//         notes:      [{ id, title, heading, body /* HTML string */ }],
//         flashcards: [{ id, front, back, q, a, type? }],
//         questions:  [] },
//     ]},
//   ];
//
// Note bodies are HTML strings (rendered as rich HTML). Inline <img> tags point
// at vector diagrams served from /public/diagrams/...
//
// Every id MUST be stable and unique — the spaced-repetition engine, mastery
// model and learning engine all key off section + card + question ids.
// -----------------------------------------------------------------------------

const TD = 'style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;"';
const TH = 'style="border:1px solid #d1d5db;padding:6px 8px;text-align:left;background:rgba(124,58,237,0.08);"';
const FIG =
  'style="display:block;max-width:100%;height:auto;border-radius:10px;border:1px solid #e5e7eb;background:#fff;margin:10px auto 4px;"';
const CAP = 'style="font-size:12px;color:#6b7280;text-align:center;margin-bottom:6px;"';

// Learning-optimised callout helpers. These emit semantic boxes that are styled
// by the `.rd-callout` rules in assets.js (definition, contrast, key-facts,
// exam-tip and worked-example variants) so notes are easy to revise from.
const CALL = (variant, label, inner) =>
  `<div class="rd-callout rd-${variant}"><span class="rd-clabel">${label}</span><div class="rd-cbody">${inner}</div></div>`;
const DEF = (label, t) => CALL("def", label, t);
const ALT = (label, t) => CALL("alt", label, t);
const KEY = (items) =>
  CALL("key", "Key facts", `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`);
const TIP = (t) => CALL("tip", "Exam tip", t);
const EG = (label, t) => CALL("eg", label, t);

export const GENERATED_CONTENT = {
  bio: [
    {
      id: "cell-biology",
      number: "1",
      title: "Cell Biology",
      sections: [
        {
          id: "bio-1-1-cells-and-microscopy",
          title: "1.1 Cells and Microscopy",
          notes: [
            {
              id: "bio-1-1-n1",
              title: "Eukaryotes and prokaryotes",
              heading: "Eukaryotes and prokaryotes",
              body: `<p>All living things are made of <strong>cells</strong>. Every cell is one of two types — <strong>prokaryotic</strong> or <strong>eukaryotic</strong>.</p>${DEF("Eukaryotic cells", "Complex cells that make up all <strong>animal</strong> and <strong>plant</strong> cells. A <strong>eukaryote</strong> is an organism made of eukaryotic cells.")}${ALT("Prokaryotic cells", "Smaller, simpler cells such as <strong>bacteria</strong>. A <strong>prokaryote</strong> is a single-celled organism — one prokaryotic cell.")}${KEY(["There are two cell types: prokaryotic and eukaryotic.", "Animal and plant cells are eukaryotic (complex).", "Bacteria are prokaryotic (small and simple)."])}`,
            },
            {
              id: "bio-1-1-n2",
              title: "Subcellular structures in an animal cell",
              heading: "Subcellular structures in an animal cell",
              body: `<p>The different parts of a cell are its <strong>subcellular structures</strong>. Most animal cells contain the five below.</p><table style="width:100%;border-collapse:collapse;font-size:14px;"><thead><tr><th ${TH}>Structure</th><th ${TH}>What it does</th></tr></thead><tbody><tr><td ${TD}><strong>Nucleus</strong></td><td ${TD}>Contains genetic material that controls the cell&rsquo;s activities.</td></tr><tr><td ${TD}><strong>Cytoplasm</strong></td><td ${TD}>Gel-like substance where most chemical reactions happen; contains <strong>enzymes</strong> that control them.</td></tr><tr><td ${TD}><strong>Cell membrane</strong></td><td ${TD}>Holds the cell together and controls what goes in and out.</td></tr><tr><td ${TD}><strong>Mitochondria</strong></td><td ${TD}>Where most <strong>aerobic respiration</strong> reactions occur, transferring the energy the cell needs.</td></tr><tr><td ${TD}><strong>Ribosomes</strong></td><td ${TD}>Where <strong>proteins</strong> are made.</td></tr></tbody></table><figure style="margin:10px 0;"><img src="/diagrams/bio/1-1/animal-cell.svg" alt="Labelled diagram of an animal cell showing the nucleus, cytoplasm, cell membrane, mitochondria and ribosomes" ${FIG} /><figcaption ${CAP}>An animal cell and its subcellular structures.</figcaption></figure>${TIP("Learn each one as a <strong>part &rarr; job</strong> pair &mdash; questions often ask you to name the structure that does a particular job.")}`,
            },
            {
              id: "bio-1-1-n3",
              title: "Extra structures in a plant cell",
              heading: "Extra structures in a plant cell",
              body: `<p>Plant cells usually have <strong>everything an animal cell has</strong>, plus three extra structures.</p><table style="width:100%;border-collapse:collapse;font-size:14px;"><thead><tr><th ${TH}>Extra structure</th><th ${TH}>What it does</th></tr></thead><tbody><tr><td ${TD}><strong>Rigid cell wall</strong></td><td ${TD}>Made of <strong>cellulose</strong>; supports and strengthens the cell.</td></tr><tr><td ${TD}><strong>Permanent vacuole</strong></td><td ${TD}>Contains <strong>cell sap</strong>, a weak solution of sugar and salts.</td></tr><tr><td ${TD}><strong>Chloroplasts</strong></td><td ${TD}>Where <strong>photosynthesis</strong> makes food for the plant; contain green <strong>chlorophyll</strong>, which absorbs light.</td></tr></tbody></table><figure style="margin:10px 0;"><img src="/diagrams/bio/1-1/plant-cell.svg" alt="Labelled diagram of a plant cell showing the cell wall, cell membrane, cytoplasm, nucleus, permanent vacuole, chloroplasts, mitochondrion and ribosomes" ${FIG} /><figcaption ${CAP}>A plant cell, with a cell wall, permanent vacuole and chloroplasts.</figcaption></figure>${TIP("Algae (e.g. seaweed) also have a rigid cell wall and chloroplasts.")}`,
            },
            {
              id: "bio-1-1-n4",
              title: "Bacterial cells",
              heading: "Bacterial cells",
              body: `<p>Bacteria are <strong>prokaryotes</strong> &mdash; much smaller than plant and animal cells.</p><p>A bacterial cell has:</p><ul><li>a <strong>cell membrane</strong>, a <strong>cell wall</strong> and <strong>cytoplasm</strong>;</li><li>no &lsquo;true&rsquo; nucleus &mdash; instead a <strong>single circular strand of DNA</strong> floating freely in the cytoplasm;</li><li>sometimes one or more small rings of DNA called <strong>plasmids</strong>.</li></ul>${ALT("Remember", "Bacteria do <strong>not</strong> have chloroplasts or mitochondria.")}<figure style="margin:10px 0;"><img src="/diagrams/bio/1-1/bacterial-cell.svg" alt="Labelled diagram of a bacterial cell showing the cell wall, cell membrane, cytoplasm, circular strand of DNA and plasmids" ${FIG} /><figcaption ${CAP}>A bacterial cell &mdash; a prokaryote.</figcaption></figure>`,
            },
            {
              id: "bio-1-1-n5",
              title: "Estimating the area of subcellular structures",
              heading: "Estimating the area of subcellular structures",
              body: `<p>You could be asked to <strong>estimate the area</strong> of a subcellular structure. Treat it as a regular shape.</p>${EG("Method", "If the structure is close to a rectangle, use <strong>area = length &times; width</strong>.")}`,
            },
            {
              id: "bio-1-1-n6",
              title: "Microscopes: light vs electron",
              heading: "Microscopes: light vs electron",
              body: `<p>Cells are studied using <strong>microscopes</strong>. Microscopy has improved as technology and knowledge have developed.</p><table style="width:100%;border-collapse:collapse;font-size:14px;"><thead><tr><th ${TH}></th><th ${TH}>Light microscope</th><th ${TH}>Electron microscope</th></tr></thead><tbody><tr><td ${TD}><strong>Uses</strong></td><td ${TD}>Light and lenses</td><td ${TD}>Electrons</td></tr><tr><td ${TD}><strong>Magnification</strong></td><td ${TD}>Lower</td><td ${TD}>Much higher</td></tr><tr><td ${TD}><strong>Resolution</strong></td><td ${TD}>Lower</td><td ${TD}>Much higher</td></tr><tr><td ${TD}><strong>You can see&hellip;</strong></td><td ${TD}>Individual cells &amp; large structures, e.g. nuclei</td><td ${TD}>Tiny detail &mdash; inside mitochondria &amp; chloroplasts, ribosomes, plasmids</td></tr></tbody></table>${DEF("Resolution", "How well a microscope can <strong>distinguish between two points</strong> that are close together. Higher resolution = a sharper image.")}`,
            },
            {
              id: "bio-1-1-n7",
              title: "The magnification formula",
              heading: "The magnification formula",
              body: `<p>Magnification tells you how many times bigger an image is than the real object.</p>${DEF("Formula", "<strong>magnification = image size &divide; real size</strong>")}<figure style="margin:10px 0;"><img src="/diagrams/bio/1-1/magnification-triangle.svg" alt="Formula triangle with image size on top and magnification times real size on the bottom" ${FIG} /><figcaption ${CAP}>Cover the quantity you want to find.</figcaption></figure>${TIP("Image size and real size must be in the <strong>same units</strong> &mdash; convert first if they are not.")}${EG("Worked example", "A specimen is 50 &micro;m wide. Find its width at &times;100, in mm.<ol><li>Rearrange: image size = magnification &times; real size.</li><li>image size = 100 &times; 50 = 5000 &micro;m.</li><li>&micro;m &rarr; mm: 5000 &divide; 1000 = <strong>5 mm</strong>.</li></ol>")}`,
            },
            {
              id: "bio-1-1-n8",
              title: "Standard form for tiny measurements",
              heading: "Standard form for tiny measurements",
              body: `<p><strong>Standard form</strong> turns very big or very small numbers into something manageable &mdash; e.g. 0.017 cm becomes 1.7 &times; 10&#8315;&#178;.</p><ul><li>Move the decimal point until the first number is between 1 and 10.</li><li>The number of places moved is the <strong>power of 10</strong>: <strong>positive</strong> if the point moves left, <strong>negative</strong> if it moves right.</li></ul>${EG("Worked example", "A mitochondrion is 0.0025 mm long. The decimal point moves right to just after the 2, so the power is negative: <strong>2.5 &times; 10&#8315;&#179; mm</strong>.")}`,
            },
            {
              id: "bio-1-1-n9",
              title: "Preparing a slide (required practical)",
              heading: "Preparing a slide (required practical)",
              body: `<p>A <strong>slide</strong> is a strip of clear glass or plastic that a specimen is mounted on. To prepare a slide of onion cells:</p><ol><li>Add a drop of water to the middle of a clean slide.</li><li>Cut up an onion and separate the layers; use tweezers to peel off some <strong>epidermal tissue</strong> from the bottom of a layer.</li><li>Place the epidermal tissue into the water on the slide.</li><li>Add a drop of <strong>iodine solution</strong> &mdash; a <strong>stain</strong> that highlights objects by adding colour.</li><li>Lower a <strong>cover slip</strong> on top: stand it upright, then tilt and lower it gently over the specimen.</li></ol>${TIP("Lower the cover slip slowly to avoid trapping <strong>air bubbles</strong>, which obstruct your view. Your specimen could be plant or animal cells.")}`,
            },
            {
              id: "bio-1-1-n10",
              title: "Using a light microscope",
              heading: "Using a light microscope",
              body: `<p>To view your slide under a light microscope:</p><ol><li>Clip the slide onto the <strong>stage</strong>.</li><li>Select the <strong>lowest-powered objective lens</strong>.</li><li>Use the <strong>coarse adjustment knob</strong> to move the stage up to just below the lens.</li><li>Look down the <strong>eyepiece</strong> and turn the coarse knob to move the stage down until roughly in focus.</li><li>Sharpen the image with the <strong>fine adjustment knob</strong>.</li><li>For greater magnification, swap to a higher-powered lens and refocus.</li></ol><figure style="margin:10px 0;"><img src="/diagrams/bio/1-1/light-microscope.svg" alt="Labelled diagram of a light microscope showing the eyepiece, objective lenses, stage, coarse and fine adjustment knobs and the light" ${FIG} /><figcaption ${CAP}>The main parts of a light microscope.</figcaption></figure>${TIP("Always start on the <strong>lowest</strong> magnification &mdash; it is easiest to find the specimen.")}`,
            },
            {
              id: "bio-1-1-n11",
              title: "Drawing your observations",
              heading: "Drawing your observations",
              body: `<p>Draw your observations neatly in pencil with a sharp point:</p><ul><li>Draw big enough, with clear, unbroken lines.</li><li>Include a <strong>title</strong>.</li><li><strong>No</strong> colouring or shading.</li><li>Label important features (e.g. nucleus, cell wall) with straight, uncrossed lines.</li><li>Draw subcellular structures <strong>in proportion</strong>.</li><li>Write the <strong>magnification</strong> of your drawing.</li></ul>${EG("Drawing magnification", "magnification = length of drawing &divide; real length. e.g. 33 mm &divide; 0.3 mm = <strong>&times;110</strong>.")}`,
            },
            {
              id: "bio-1-1-n12",
              title: "Specialised cells",
              heading: "Specialised cells",
              body: `<p>Cells don&rsquo;t all look the same &mdash; they are <strong>specialised</strong> with structures that suit their function.</p><table style="width:100%;border-collapse:collapse;font-size:14px;"><thead><tr><th ${TH}>Specialised cell</th><th ${TH}>Function</th><th ${TH}>Adaptations</th></tr></thead><tbody><tr><td ${TD}><strong>Sperm cell</strong></td><td ${TD}>To get the male DNA to the female DNA.</td><td ${TD}>A long tail and streamlined head to swim to the egg; lots of mitochondria for energy; enzymes in its head to digest through the egg cell membrane.</td></tr><tr><td ${TD}><strong>Nerve cell</strong></td><td ${TD}>To carry electrical signals around the body.</td><td ${TD}>Long, to cover more distance; branched ends to connect to other nerve cells in a network.</td></tr><tr><td ${TD}><strong>Muscle cell</strong></td><td ${TD}>To contract quickly.</td><td ${TD}>Long, so they have space to contract; lots of mitochondria for the energy needed to contract.</td></tr><tr><td ${TD}><strong>Root hair cell</strong></td><td ${TD}>To absorb water and mineral ions from the soil.</td><td ${TD}>Long &lsquo;projections&rsquo; that give a big surface area for absorption.</td></tr><tr><td ${TD}><strong>Phloem &amp; xylem cells</strong></td><td ${TD}>Form tubes that transport food and water around plants.</td><td ${TD}>Long and joined end to end; xylem is hollow in the centre and phloem has very few subcellular structures, so substances can flow through.</td></tr></tbody></table>${TIP("Always link an adaptation back to the cell&rsquo;s <strong>job</strong> (e.g. &lsquo;lots of mitochondria &rarr; energy for swimming/contracting&rsquo;).")}`,
            },
            {
              id: "bio-1-1-n13",
              title: "Differentiation",
              heading: "Differentiation",
              body: `${DEF("Differentiation", "The process by which a cell <strong>changes to become specialised</strong> for its function.")}<ul><li>Most differentiation happens as an organism develops.</li><li>In most <strong>animal</strong> cells the ability to differentiate is lost early, once they are specialised; many <strong>plant</strong> cells never lose it.</li><li>Cells that differentiate in mature animals are mainly used to <strong>repair and replace</strong> cells (e.g. skin or blood).</li></ul>${ALT("Key term", "Undifferentiated cells are called <strong>stem cells</strong>.")}`,
            },
            {
              id: "bio-1-1-n14",
              title: "Stem cells: embryonic and adult",
              heading: "Stem cells: embryonic and adult",
              body: `<p><strong>Stem cells</strong> are undifferentiated: they make more stem cells and can <strong>differentiate</strong> into different cell types, depending on the instructions they are given.</p>${DEF("Embryonic stem cells", "Found in early human embryos. Can turn into <strong>any</strong> type of human cell.")}${ALT("Adult stem cells", "Found only in certain places, e.g. <strong>bone marrow</strong>. Can only become <strong>certain</strong> cell types, such as blood cells.")}${KEY(["Stem cells from embryos and bone marrow can be grown in a lab.", "They can be cloned (genetically identical) and made to differentiate for medicine or research."])}`,
            },
            {
              id: "bio-1-1-n15",
              title: "Uses of stem cells and therapeutic cloning",
              heading: "Uses of stem cells and therapeutic cloning",
              body: `<ul><li><strong>Adult stem cells</strong> already cure some diseases &mdash; e.g. bone-marrow stem cells from a healthy donor replace a patient&rsquo;s faulty blood cells.</li><li><strong>Embryonic stem cells</strong> could replace other faulty cells &mdash; e.g. insulin-producing cells for diabetes, or nerve cells after a spinal injury.</li></ul>${DEF("Therapeutic cloning", "Making an embryo with the <strong>same genes as the patient</strong>, so its stem cells aren&rsquo;t <strong>rejected</strong> when used to replace faulty cells.")}${TIP("Risk: lab-grown stem cells could be <strong>contaminated with a virus</strong> that is passed to the patient.")}`,
            },
            {
              id: "bio-1-1-n16",
              title: "Stem cells: ethical issues",
              heading: "Stem cells: ethical issues",
              body: `<p>Because embryonic stem cells come from embryos, the research raises an <strong>ethical issue</strong>.</p>${ALT("Arguments against", "<ul><li>Embryos shouldn&rsquo;t be used for experiments &mdash; each is a potential human life.</li><li>Scientists should focus on finding <strong>other</strong> sources of stem cells instead.</li></ul>")}${DEF("Arguments for", "<ul><li>Curing suffering patients matters more than the rights of embryos.</li><li>The embryos used are usually unwanted ones from fertility clinics that would be destroyed anyway.</li></ul>")}`,
            },
            {
              id: "bio-1-1-n17",
              title: "Stem cells in plants",
              heading: "Stem cells in plants",
              body: `${DEF("Meristems", "In plants, stem cells are found in the <strong>meristems</strong> &mdash; the parts where growth happens.")}<ul><li>Meristem cells can differentiate into <strong>any</strong> plant cell, throughout the plant&rsquo;s whole life.</li><li>They can produce <strong>clones</strong> of whole plants quickly and cheaply.</li></ul>${KEY(["Grow more plants of rare species (to prevent extinction).", "Grow crops of identical plants with desired features, e.g. disease resistance."])}`,
            },
          ],
          flashcards: [
            { id: "bio-1-1-f1", front: "What are all living things made of?", back: "Cells.", q: "What are all living things made of?", a: "Cells." },
            { id: "bio-1-1-f2", front: "What are the two types of cell?", back: "Prokaryotic and eukaryotic.", q: "What are the two types of cell?", a: "Prokaryotic and eukaryotic." },
            { id: "bio-1-1-f3", front: "What kind of cells are animal and plant cells?", back: "Eukaryotic (complex) cells.", q: "What kind of cells are animal and plant cells?", a: "Eukaryotic (complex) cells." },
            { id: "bio-1-1-f4", front: "What is a eukaryote?", back: "An organism made up of eukaryotic cells.", q: "What is a eukaryote?", a: "An organism made up of eukaryotic cells." },
            { id: "bio-1-1-f5", front: "What is a prokaryote?", back: "A single-celled organism (a prokaryotic cell); prokaryotic cells are smaller and simpler than eukaryotic cells, e.g. bacteria.", q: "What is a prokaryote?", a: "A single-celled organism (a prokaryotic cell); prokaryotic cells are smaller and simpler than eukaryotic cells, e.g. bacteria." },
            { id: "bio-1-1-f6", front: "Function of the nucleus?", back: "Contains genetic material that controls the activities of the cell.", q: "Function of the nucleus?", a: "Contains genetic material that controls the activities of the cell." },
            { id: "bio-1-1-f7", front: "Function of the cytoplasm?", back: "A gel-like substance where most chemical reactions happen; it contains enzymes that control them.", q: "Function of the cytoplasm?", a: "A gel-like substance where most chemical reactions happen; it contains enzymes that control them." },
            { id: "bio-1-1-f8", front: "Function of the cell membrane?", back: "Holds the cell together and controls what goes in and out.", q: "Function of the cell membrane?", a: "Holds the cell together and controls what goes in and out." },
            { id: "bio-1-1-f9", front: "Function of the mitochondria?", back: "Where most of the reactions for aerobic respiration take place, transferring the energy the cell needs.", q: "Function of the mitochondria?", a: "Where most of the reactions for aerobic respiration take place, transferring the energy the cell needs." },
            { id: "bio-1-1-f10", front: "Function of ribosomes?", back: "Where proteins are made in the cell.", q: "Function of ribosomes?", a: "Where proteins are made in the cell." },
            { id: "bio-1-1-f11", front: "Which three extra structures do plant cells usually have?", back: "A rigid cell wall, a permanent vacuole and chloroplasts.", q: "Which three extra structures do plant cells usually have?", a: "A rigid cell wall, a permanent vacuole and chloroplasts." },
            { id: "bio-1-1-f12", front: "What is the cell wall made of, and what does it do?", back: "Cellulose; it supports and strengthens the cell.", q: "What is the cell wall made of, and what does it do?", a: "Cellulose; it supports and strengthens the cell." },
            { id: "bio-1-1-f13", front: "What does the permanent vacuole contain?", back: "Cell sap, a weak solution of sugar and salts.", q: "What does the permanent vacuole contain?", a: "Cell sap, a weak solution of sugar and salts." },
            { id: "bio-1-1-f14", front: "What happens in chloroplasts, and what do they contain?", back: "Photosynthesis (which makes food for the plant); they contain chlorophyll, which absorbs the light needed for photosynthesis.", q: "What happens in chloroplasts, and what do they contain?", a: "Photosynthesis (which makes food for the plant); they contain chlorophyll, which absorbs the light needed for photosynthesis." },
            { id: "bio-1-1-f15", front: "Which structures does a bacterial cell have?", back: "A cell membrane, a cell wall and cytoplasm.", q: "Which structures does a bacterial cell have?", a: "A cell membrane, a cell wall and cytoplasm." },
            { id: "bio-1-1-f16", front: "How is the genetic material arranged in a bacterial cell?", back: "There is no 'true' nucleus; instead a single circular strand of DNA floats freely in the cytoplasm.", q: "How is the genetic material arranged in a bacterial cell?", a: "There is no 'true' nucleus; instead a single circular strand of DNA floats freely in the cytoplasm." },
            { id: "bio-1-1-f17", front: "What are plasmids?", back: "Small rings of DNA found in bacterial cells.", q: "What are plasmids?", a: "Small rings of DNA found in bacterial cells." },
            { id: "bio-1-1-f18", front: "Which two structures do bacteria not have?", back: "Chloroplasts and mitochondria.", q: "Which two structures do bacteria not have?", a: "Chloroplasts and mitochondria." },
            { id: "bio-1-1-f19", front: "What do light microscopes use, and what can they show?", back: "Light and lenses; they show individual cells and large subcellular structures like nuclei.", q: "What do light microscopes use, and what can they show?", a: "Light and lenses; they show individual cells and large subcellular structures like nuclei." },
            { id: "bio-1-1-f20", front: "What do electron microscopes use, and what is their advantage?", back: "Electrons; much higher magnification and higher resolution, showing smaller detail such as ribosomes and plasmids.", q: "What do electron microscopes use, and what is their advantage?", a: "Electrons; much higher magnification and higher resolution, showing smaller detail such as ribosomes and plasmids." },
            { id: "bio-1-1-f21", front: "What is resolution?", back: "How well a microscope can distinguish between two points that are close together.", q: "What is resolution?", a: "How well a microscope can distinguish between two points that are close together." },
            { id: "bio-1-1-f22", front: "State the magnification formula.", back: "magnification = image size ÷ real size.", q: "State the magnification formula.", a: "magnification = image size ÷ real size." },
            { id: "bio-1-1-f23", front: "How do you convert micrometres (µm) to millimetres (mm)?", back: "Divide by 1000.", q: "How do you convert micrometres (µm) to millimetres (mm)?", a: "Divide by 1000." },
            { id: "bio-1-1-f24", front: "Write 0.0025 mm in standard form.", back: "2.5 × 10⁻³ mm.", q: "Write 0.0025 mm in standard form.", a: "2.5 × 10⁻³ mm." },
            { id: "bio-1-1-f25", front: "Why is iodine solution added when preparing a slide?", back: "It is a stain; it highlights objects in the cell by adding colour to them.", q: "Why is iodine solution added when preparing a slide?", a: "It is a stain; it highlights objects in the cell by adding colour to them." },
            { id: "bio-1-1-f26", front: "Why should you avoid air bubbles under the cover slip?", back: "They obstruct your view of the specimen.", q: "Why should you avoid air bubbles under the cover slip?", a: "They obstruct your view of the specimen." },
            { id: "bio-1-1-f27", front: "What is differentiation?", back: "The process by which a cell changes to become specialised for its function.", q: "What is differentiation?", a: "The process by which a cell changes to become specialised for its function." },
            { id: "bio-1-1-f28", front: "What are undifferentiated cells called?", back: "Stem cells.", q: "What are undifferentiated cells called?", a: "Stem cells." },
            { id: "bio-1-1-f29", front: "Where are embryonic stem cells found, and what can they become?", back: "In early human embryos; they can become any type of cell found in a human being.", q: "Where are embryonic stem cells found, and what can they become?", a: "In early human embryos; they can become any type of cell found in a human being." },
            { id: "bio-1-1-f30", front: "Where are adult stem cells found, and what can they become?", back: "In certain places such as bone marrow; they can only become certain cell types, such as blood cells.", q: "Where are adult stem cells found, and what can they become?", a: "In certain places such as bone marrow; they can only become certain cell types, such as blood cells." },
            { id: "bio-1-1-f31", front: "What is therapeutic cloning?", back: "Making an embryo with the same genetic information as the patient, so its stem cells share the patient's genes and aren't rejected when used to replace faulty cells.", q: "What is therapeutic cloning?", a: "Making an embryo with the same genetic information as the patient, so its stem cells share the patient's genes and aren't rejected when used to replace faulty cells." },
            { id: "bio-1-1-f32", front: "Give one risk of using stem cells grown in a lab.", back: "They may become contaminated with a virus, which could be passed on to the patient.", q: "Give one risk of using stem cells grown in a lab.", a: "They may become contaminated with a virus, which could be passed on to the patient." },
            { id: "bio-1-1-f33", front: "Where are stem cells found in plants?", back: "In the meristems.", q: "Where are stem cells found in plants?", a: "In the meristems." },
            { id: "bio-1-1-f34", front: "Give one use of plant stem cells (clones).", back: "Grow more plants of rare species to prevent extinction, or grow crops of identical plants with desired features such as disease resistance.", q: "Give one use of plant stem cells (clones).", a: "Grow more plants of rare species to prevent extinction, or grow crops of identical plants with desired features such as disease resistance." },
            { id: "bio-1-1-f35", front: "How is a sperm cell adapted to its function?", back: "A long tail and streamlined head to swim to the egg, lots of mitochondria for energy, and enzymes in the head to digest through the egg cell membrane.", q: "How is a sperm cell adapted to its function?", a: "A long tail and streamlined head to swim to the egg, lots of mitochondria for energy, and enzymes in the head to digest through the egg cell membrane." },
            { id: "bio-1-1-f36", front: "How is a root hair cell adapted to its function?", back: "Long projections give the roots a big surface area for absorbing water and mineral ions.", q: "How is a root hair cell adapted to its function?", a: "Long projections give the roots a big surface area for absorbing water and mineral ions." },
            { id: "bio-1-1-f37", front: "How are xylem and phloem cells adapted for transport?", back: "They are long and joined end to end; xylem is hollow in the centre and phloem has very few subcellular structures, so substances can flow through.", q: "How are xylem and phloem cells adapted for transport?", a: "They are long and joined end to end; xylem is hollow in the centre and phloem has very few subcellular structures, so substances can flow through." },
          ],
          questions: [],
        },
      ],
    },
  ],
};

// Return the in-code topics for a subject (empty array if none authored yet).
export function getGeneratedTopics(subjectId) {
  const t = GENERATED_CONTENT[subjectId];
  return Array.isArray(t) ? t : [];
}

// Count authored items for a subject — used by the learning engine and the
// guided home to decide whether there is anything to study yet.
export function countGeneratedContent(subjectId) {
  let notes = 0,
    flashcards = 0,
    questions = 0;
  for (const topic of getGeneratedTopics(subjectId)) {
    for (const sec of topic.sections || []) {
      notes += (sec.notes || []).length;
      flashcards += (sec.flashcards || []).length;
      questions += (sec.questions || []).length;
    }
  }
  return { notes, flashcards, questions, total: notes + flashcards + questions };
}

// True if ANY subject has content authored in code.
export function hasAnyGeneratedContent() {
  return Object.keys(GENERATED_CONTENT).some(
    (sid) => countGeneratedContent(sid).total > 0,
  );
}
