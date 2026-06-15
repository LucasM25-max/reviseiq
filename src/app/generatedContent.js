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
              body: `<p>All living things are made of <strong>cells</strong>. Cells are either <strong>prokaryotic</strong> or <strong>eukaryotic</strong>.</p><ul><li><strong>Eukaryotic cells</strong> are complex and include all animal and plant cells. A <strong>eukaryote</strong> is an organism that is made up of eukaryotic cells.</li><li><strong>Prokaryotic cells</strong> are smaller and simpler, e.g. bacteria. A <strong>prokaryote</strong> is a single-celled organism (a prokaryotic cell).</li></ul>`,
            },
            {
              id: "bio-1-1-n2",
              title: "Subcellular structures in an animal cell",
              heading: "Subcellular structures in an animal cell",
              body: `<p>The different parts of a cell are called <strong>subcellular structures</strong>. Most animal cells have these:</p><ul><li><strong>Nucleus</strong> &mdash; contains genetic material that controls the activities of the cell.</li><li><strong>Cytoplasm</strong> &mdash; a gel-like substance where most of the chemical reactions happen; it contains <strong>enzymes</strong> that control these reactions.</li><li><strong>Cell membrane</strong> &mdash; holds the cell together and controls what goes in and out.</li><li><strong>Mitochondria</strong> &mdash; where most of the reactions for <strong>aerobic respiration</strong> take place; respiration transfers the energy that the cell needs to work.</li><li><strong>Ribosomes</strong> &mdash; where proteins are made in the cell.</li></ul><figure style="margin:10px 0;"><img src="/diagrams/bio/1-1/animal-cell.svg" alt="Labelled diagram of an animal cell showing the nucleus, cytoplasm, cell membrane, mitochondria and ribosomes" ${FIG} /><figcaption ${CAP}>An animal cell and its subcellular structures.</figcaption></figure>`,
            },
            {
              id: "bio-1-1-n3",
              title: "Extra structures in a plant cell",
              heading: "Extra structures in a plant cell",
              body: `<p>Plant cells usually have all the subcellular structures that animal cells have, plus a few extra:</p><ul><li><strong>Rigid cell wall</strong> &mdash; made of <strong>cellulose</strong>; it supports and strengthens the cell.</li><li><strong>Permanent vacuole</strong> &mdash; contains <strong>cell sap</strong>, a weak solution of sugar and salts.</li><li><strong>Chloroplasts</strong> &mdash; where <strong>photosynthesis</strong> occurs, which makes food for the plant; they contain a green substance called <strong>chlorophyll</strong>, which absorbs the light needed for photosynthesis.</li></ul><p>The cells of algae (e.g. seaweed) also have a rigid cell wall and chloroplasts.</p><figure style="margin:10px 0;"><img src="/diagrams/bio/1-1/plant-cell.svg" alt="Labelled diagram of a plant cell showing the cell wall, cell membrane, cytoplasm, nucleus, permanent vacuole, chloroplasts, mitochondrion and ribosomes" ${FIG} /><figcaption ${CAP}>A plant cell, with a cell wall, permanent vacuole and chloroplasts.</figcaption></figure>`,
            },
            {
              id: "bio-1-1-n4",
              title: "Bacterial cells",
              heading: "Bacterial cells",
              body: `<p>Bacteria are <strong>prokaryotes</strong> and are much smaller than plant and animal cells. A bacterial cell has:</p><ul><li>a <strong>cell membrane</strong>, a <strong>cell wall</strong> and <strong>cytoplasm</strong>;</li><li>no 'true' nucleus &mdash; instead a <strong>single circular strand of DNA</strong> that floats freely in the cytoplasm;</li><li>sometimes one or more small rings of DNA called <strong>plasmids</strong>.</li></ul><p>Bacteria do <strong>not</strong> have chloroplasts or mitochondria.</p><figure style="margin:10px 0;"><img src="/diagrams/bio/1-1/bacterial-cell.svg" alt="Labelled diagram of a bacterial cell showing the cell wall, cell membrane, cytoplasm, circular strand of DNA and plasmids" ${FIG} /><figcaption ${CAP}>A bacterial cell &mdash; a prokaryote.</figcaption></figure>`,
            },
            {
              id: "bio-1-1-n5",
              title: "Estimating the area of subcellular structures",
              heading: "Estimating the area of subcellular structures",
              body: `<p>You could be asked to <strong>estimate the area</strong> of a subcellular structure. Treat it as a regular shape &mdash; for example, if it is close to a rectangle, use <strong>area = length &times; width</strong>.</p>`,
            },
            {
              id: "bio-1-1-n6",
              title: "Microscopes: light vs electron",
              heading: "Microscopes: light vs electron",
              body: `<p>Cells are studied using microscopes, and microscopy techniques have developed as technology and knowledge have improved.</p><ul><li><strong>Light microscopes</strong> use light and lenses to form an image of a specimen and magnify it (make it look bigger). They let us see individual cells and large subcellular structures, such as nuclei.</li><li><strong>Electron microscopes</strong> use electrons to form an image. They have a much <strong>higher magnification</strong> and a <strong>higher resolution</strong> than light microscopes, so they let us see much smaller things in more detail &mdash; like the internal structure of mitochondria and chloroplasts, and even tinier things like ribosomes and plasmids.</li></ul><p><strong>Resolution</strong> is how well a microscope can distinguish between two points that are close together; a higher resolution gives a sharper image.</p>`,
            },
            {
              id: "bio-1-1-n7",
              title: "The magnification formula",
              heading: "The magnification formula",
              body: `<p>You can calculate the magnification of an image with:</p><p style="text-align:center;"><strong>magnification = image size &divide; real size</strong></p><p>The image size and real size must be in the <strong>same units</strong> &mdash; convert them first if they are not.</p><figure style="margin:10px 0;"><img src="/diagrams/bio/1-1/magnification-triangle.svg" alt="Formula triangle with image size on top and magnification times real size on the bottom" ${FIG} /><figcaption ${CAP}>Cover the quantity you want to find.</figcaption></figure><p><strong>Worked example:</strong> a specimen is 50 &micro;m wide. Calculate its width at a magnification of &times;100, in mm.</p><ol><li>Rearrange the formula: image size = magnification &times; real size.</li><li>image size = 100 &times; 50 = 5000 &micro;m.</li><li>Convert &micro;m to mm by dividing by 1000: 5000 &divide; 1000 = <strong>5 mm</strong>.</li></ol>`,
            },
            {
              id: "bio-1-1-n8",
              title: "Standard form for tiny measurements",
              heading: "Standard form for tiny measurements",
              body: `<p><strong>Standard form</strong> turns very big or very small numbers (with lots of zeros) into something more manageable &mdash; e.g. 0.017 cm is written as 1.7 &times; 10&#8315;&#178;.</p><ul><li>Move the decimal point left or right.</li><li>The number of places it moves is shown as a <strong>power of 10</strong>: <strong>positive</strong> if the point moves left, and <strong>negative</strong> if it moves right.</li></ul><p><strong>Worked example:</strong> a mitochondrion is 0.0025 mm long. The first number must be between 1 and 10, so the decimal point moves to just after the 2. It moved right, so the power is negative: <strong>2.5 &times; 10&#8315;&#179; mm</strong>.</p>`,
            },
            {
              id: "bio-1-1-n9",
              title: "Preparing a slide (required practical)",
              heading: "Preparing a slide (required practical)",
              body: `<p>A <strong>slide</strong> is a strip of clear glass or plastic onto which a specimen is mounted. To prepare a slide of onion cells:</p><ol><li>Add a drop of water to the middle of a clean slide.</li><li>Cut up an onion and separate it into layers; use tweezers to peel off some <strong>epidermal tissue</strong> from the bottom of one of the layers.</li><li>Use the tweezers to place the epidermal tissue into the water on the slide.</li><li>Add a drop of <strong>iodine solution</strong>. Iodine solution is a <strong>stain</strong> &mdash; stains highlight objects in a cell by adding colour to them.</li><li>Place a <strong>cover slip</strong> (a square of thin, transparent plastic or glass) on top: stand it upright on the slide, then carefully tilt and lower it so it covers the specimen. Try not to trap air bubbles, which obstruct your view of the specimen.</li></ol><p>Your specimen could be plant cells or animal cells.</p>`,
            },
            {
              id: "bio-1-1-n10",
              title: "Using a light microscope",
              heading: "Using a light microscope",
              body: `<p>To look at your slide under a light microscope:</p><ol><li>Clip the prepared slide onto the <strong>stage</strong>.</li><li>Select the <strong>lowest-powered objective lens</strong> (the one with the lowest magnification).</li><li>Use the <strong>coarse adjustment knob</strong> to move the stage up to just below the objective lens.</li><li>Look down the <strong>eyepiece</strong>, and use the coarse adjustment knob to move the stage down until the image is roughly in focus.</li><li>Adjust the focus with the <strong>fine adjustment knob</strong> until you get a clear image.</li><li>To see the slide at greater magnification, swap to a higher-powered objective lens and refocus.</li></ol><figure style="margin:10px 0;"><img src="/diagrams/bio/1-1/light-microscope.svg" alt="Labelled diagram of a light microscope showing the eyepiece, objective lenses, stage, coarse and fine adjustment knobs and the light" ${FIG} /><figcaption ${CAP}>The main parts of a light microscope.</figcaption></figure>`,
            },
            {
              id: "bio-1-1-n11",
              title: "Drawing your observations",
              heading: "Drawing your observations",
              body: `<p>Draw your observations neatly using a pencil with a sharp point:</p><ul><li>Make the drawing big enough (not too small) and draw it with clear, unbroken lines.</li><li>Include a <strong>title</strong>.</li><li>Do <strong>not</strong> use any colouring or shading.</li><li>Label the important features (e.g. nucleus, cell wall) using straight, uncrossed lines.</li><li>Draw any subcellular structures <strong>in proportion</strong>.</li><li>Write down the <strong>magnification</strong> of your drawing.</li></ul><p>Magnification of a drawing = length of drawing of cell &divide; real length of cell. For example, 33 mm &divide; 0.3 mm = &times;110.</p>`,
            },
            {
              id: "bio-1-1-n12",
              title: "Specialised cells",
              heading: "Specialised cells",
              body: `<p>Cells don't all look the same &mdash; they have different structures to suit their different functions. There are lots of different types of eukaryotic cell, each with shapes and subcellular structures that help them do specific jobs.</p><table style="width:100%;border-collapse:collapse;font-size:14px;"><thead><tr><th ${TH}>Specialised cell</th><th ${TH}>Function</th><th ${TH}>Adaptations</th></tr></thead><tbody><tr><td ${TD}><strong>Sperm cell</strong></td><td ${TD}>To get the male DNA to the female DNA.</td><td ${TD}>A long tail and streamlined head to help it swim to the egg; lots of mitochondria to provide the energy needed; enzymes in its head to digest through the egg cell membrane.</td></tr><tr><td ${TD}><strong>Nerve cell</strong></td><td ${TD}>To carry electrical signals from one part of the body to another.</td><td ${TD}>Long, to cover more distance; branched connections at their ends to connect to other nerve cells and form a network throughout the body.</td></tr><tr><td ${TD}><strong>Muscle cell</strong></td><td ${TD}>To contract quickly.</td><td ${TD}>Long, so they have space to contract; contain lots of mitochondria to generate the energy needed for contraction.</td></tr><tr><td ${TD}><strong>Root hair cell</strong></td><td ${TD}>To absorb water and mineral ions from the soil.</td><td ${TD}>Long 'projections' that give the roots a big surface area for absorption.</td></tr><tr><td ${TD}><strong>Phloem and xylem cells</strong></td><td ${TD}>Form phloem and xylem tubes, which transport substances such as food and water around plants.</td><td ${TD}>Long and joined end to end; xylem cells are hollow in the centre and phloem cells have very few subcellular structures, so that substances can flow through them.</td></tr></tbody></table>`,
            },
            {
              id: "bio-1-1-n13",
              title: "Differentiation",
              heading: "Differentiation",
              body: `<ul><li><strong>Differentiation</strong> is the process by which a cell changes to become specialised for its function.</li><li>Most differentiation occurs as an organism develops. In most animal cells, the ability to differentiate is then lost at an early stage, after they become specialised; however, lots of <strong>plant cells</strong> never lose this ability.</li><li>The cells that differentiate in mature animals are mainly used for <strong>repairing and replacing</strong> cells, such as skin or blood cells.</li><li>Undifferentiated cells are called <strong>stem cells</strong>.</li></ul>`,
            },
            {
              id: "bio-1-1-n14",
              title: "Stem cells: embryonic and adult",
              heading: "Stem cells: embryonic and adult",
              body: `<ul><li>Undifferentiated cells (<strong>stem cells</strong>) are able to produce lots more undifferentiated cells, and can <strong>differentiate</strong> into different types of cell depending on the instructions they are given.</li><li><strong>Embryonic stem cells</strong> are found in early human embryos. They have the potential to turn into <strong>any</strong> of the different types of cell found in a human being.</li><li><strong>Adult stem cells</strong> are found only in certain places, such as <strong>bone marrow</strong>. They can't turn into any cell type &mdash; only certain ones, such as blood cells.</li><li>Stem cells from embryos and bone marrow can be grown in a lab to produce <strong>clones</strong> (genetically identical cells) and made to differentiate into specialised cells to use in medicine or research.</li></ul>`,
            },
            {
              id: "bio-1-1-n15",
              title: "Uses of stem cells and therapeutic cloning",
              heading: "Uses of stem cells and therapeutic cloning",
              body: `<ul><li>Medicine already uses <strong>adult stem cells</strong> to cure some diseases &mdash; e.g. stem cells transferred from the bone marrow of a healthy person can replace faulty blood cells in the patient who receives them.</li><li><strong>Embryonic stem cells</strong> could also be used to replace faulty cells in sick people &mdash; e.g. insulin-producing cells for people with diabetes, or nerve cells for people paralysed by spinal injuries.</li><li><strong>Therapeutic cloning:</strong> an embryo could be made with the same genetic information as the patient. Stem cells from this embryo would share the same genes, so they wouldn't be rejected by the patient's body if used to replace faulty cells.</li><li><strong>Risk:</strong> stem cells grown in the lab may become contaminated with a virus, which could be passed on to the patient.</li></ul>`,
            },
            {
              id: "bio-1-1-n16",
              title: "Stem cells: ethical issues",
              heading: "Stem cells: ethical issues",
              body: `<p>Because embryonic stem cells come from embryos, research is a tricky <strong>ethical issue</strong>.</p><p><strong>Arguments against embryonic stem cell research:</strong></p><ul><li>Some people feel that human embryos shouldn't be used for experiments, since each one is a potential human life.</li><li>Some people feel that scientists should concentrate more on finding and developing other sources of stem cells, so people could be helped without having to use embryos.</li></ul><p><strong>Arguments for embryonic stem cell research:</strong></p><ul><li>Some people think that curing patients who are suffering is more important than the rights of embryos.</li><li>Some people argue that the embryos used in research are usually unwanted ones from fertility clinics, which would otherwise probably just be destroyed.</li></ul>`,
            },
            {
              id: "bio-1-1-n17",
              title: "Stem cells in plants",
              heading: "Stem cells in plants",
              body: `<ul><li>In plants, stem cells are found in the <strong>meristems</strong> (the parts of the plant where growth occurs).</li><li>Cells in the meristem tissues can differentiate into <strong>any</strong> type of plant cell, throughout the plant's entire life.</li><li>These stem cells can be used to produce <strong>clones</strong> (identical copies) of whole plants quickly and cheaply. This can be used to:<ul><li>grow more plants of <strong>rare species</strong> (to prevent them being wiped out);</li><li>grow crops of identical plants that have <strong>desired features</strong> for farmers, for example disease resistance.</li></ul></li></ul>`,
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
