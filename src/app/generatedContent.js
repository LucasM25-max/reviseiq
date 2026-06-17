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
              body: `<p>Every <strong>cell</strong> is one of two types.</p><div class="rd-callout rd-def"><span class="rd-clabel">Eukaryotic cells</span><div class="rd-cbody">Complex cells &mdash; all <strong>animal</strong> and <strong>plant</strong> cells.</div></div><div class="rd-callout rd-alt"><span class="rd-clabel">Prokaryotic cells</span><div class="rd-cbody">Smaller and simpler, e.g. <strong>bacteria</strong> (one prokaryotic cell).</div></div>`,
            },
            {
              id: "bio-1-1-n2",
              title: "Subcellular structures in an animal cell",
              heading: "Subcellular structures in an animal cell",
              body: `<p>A cell's parts are its <strong>subcellular structures</strong>. Animal cells have five:</p><table style="width:100%;border-collapse:collapse;font-size:14px;"><thead><tr><th style="border:1px solid #d1d5db;padding:6px 8px;text-align:left;background:rgba(124,58,237,0.08);">Structure</th><th style="border:1px solid #d1d5db;padding:6px 8px;text-align:left;background:rgba(124,58,237,0.08);">Job</th></tr></thead><tbody><tr><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;"><strong>Nucleus</strong></td><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;">Holds genetic material; controls the cell.</td></tr><tr><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;"><strong>Cytoplasm</strong></td><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;">Gel where reactions happen (controlled by <strong>enzymes</strong>).</td></tr><tr><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;"><strong>Cell membrane</strong></td><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;">Controls what enters and leaves.</td></tr><tr><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;"><strong>Mitochondria</strong></td><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;">Site of <strong>aerobic respiration</strong> &rarr; energy.</td></tr><tr><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;"><strong>Ribosomes</strong></td><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;">Make <strong>proteins</strong>.</td></tr></tbody></table><figure style="margin:10px 0;"><img src="/diagrams/bio/1-1/animal-cell.svg" alt="Labelled animal cell" style="display:block;max-width:100%;height:auto;border-radius:10px;border:1px solid #e5e7eb;background:#fff;margin:10px auto 4px;" /><figcaption style="font-size:12px;color:#6b7280;text-align:center;margin-bottom:6px;">An animal cell.</figcaption></figure><div class="rd-callout rd-tip"><span class="rd-clabel">Exam tip</span><div class="rd-cbody">Learn each as a <strong>part &rarr; job</strong> pair.</div></div>`,
            },
            {
              id: "bio-1-1-n3",
              title: "Extra structures in a plant cell",
              heading: "Extra structures in a plant cell",
              body: `<p>Plant cells have all of an animal cell's parts, <strong>plus three extras</strong>:</p><table style="width:100%;border-collapse:collapse;font-size:14px;"><thead><tr><th style="border:1px solid #d1d5db;padding:6px 8px;text-align:left;background:rgba(124,58,237,0.08);">Extra</th><th style="border:1px solid #d1d5db;padding:6px 8px;text-align:left;background:rgba(124,58,237,0.08);">Job</th></tr></thead><tbody><tr><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;"><strong>Cell wall</strong></td><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;">Made of <strong>cellulose</strong>; supports the cell.</td></tr><tr><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;"><strong>Permanent vacuole</strong></td><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;">Holds <strong>cell sap</strong> (sugar &amp; salt solution).</td></tr><tr><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;"><strong>Chloroplasts</strong></td><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;">Do <strong>photosynthesis</strong>; hold green <strong>chlorophyll</strong>.</td></tr></tbody></table><figure style="margin:10px 0;"><img src="/diagrams/bio/1-1/plant-cell.svg" alt="Labelled plant cell" style="display:block;max-width:100%;height:auto;border-radius:10px;border:1px solid #e5e7eb;background:#fff;margin:10px auto 4px;" /><figcaption style="font-size:12px;color:#6b7280;text-align:center;margin-bottom:6px;">A plant cell.</figcaption></figure><div class="rd-callout rd-tip"><span class="rd-clabel">Exam tip</span><div class="rd-cbody">Algae also have a cell wall and chloroplasts.</div></div>`,
            },
            {
              id: "bio-1-1-n4",
              title: "Bacterial cells",
              heading: "Bacterial cells",
              body: `<p><strong>Bacteria</strong> are prokaryotes &mdash; far smaller than plant/animal cells. They have:</p><ul><li>a <strong>cell membrane</strong>, <strong>cell wall</strong> and <strong>cytoplasm</strong>;</li><li>no true nucleus &mdash; one <strong>loop of DNA</strong> floating in the cytoplasm;</li><li>sometimes small DNA rings (<strong>plasmids</strong>).</li></ul><div class="rd-callout rd-alt"><span class="rd-clabel">Remember</span><div class="rd-cbody">No chloroplasts and no mitochondria.</div></div><figure style="margin:10px 0;"><img src="/diagrams/bio/1-1/bacterial-cell.svg" alt="Labelled bacterial cell" style="display:block;max-width:100%;height:auto;border-radius:10px;border:1px solid #e5e7eb;background:#fff;margin:10px auto 4px;" /><figcaption style="font-size:12px;color:#6b7280;text-align:center;margin-bottom:6px;">A bacterial cell (prokaryote).</figcaption></figure>`,
            },
            {
              id: "bio-1-1-n5",
              title: "Estimating the area of subcellular structures",
              heading: "Estimating the area of subcellular structures",
              body: `<p><strong>Estimate the area</strong> of a structure by treating it as a regular shape.</p><div class="rd-callout rd-eg"><span class="rd-clabel">Method</span><div class="rd-cbody">Roughly a rectangle? <strong>area = length &times; width</strong>.</div></div>`,
            },
            {
              id: "bio-1-1-n6",
              title: "Microscopes: light vs electron",
              heading: "Microscopes: light vs electron",
              body: `<p>Cells are viewed with <strong>microscopes</strong>, which keep improving.</p><table style="width:100%;border-collapse:collapse;font-size:14px;"><thead><tr><th style="border:1px solid #d1d5db;padding:6px 8px;text-align:left;background:rgba(124,58,237,0.08);"></th><th style="border:1px solid #d1d5db;padding:6px 8px;text-align:left;background:rgba(124,58,237,0.08);">Light</th><th style="border:1px solid #d1d5db;padding:6px 8px;text-align:left;background:rgba(124,58,237,0.08);">Electron</th></tr></thead><tbody><tr><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;"><strong>Uses</strong></td><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;">Light &amp; lenses</td><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;">Electrons</td></tr><tr><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;"><strong>Magnification</strong></td><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;">Lower</td><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;">Much higher</td></tr><tr><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;"><strong>Resolution</strong></td><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;">Lower</td><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;">Much higher</td></tr><tr><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;"><strong>Shows</strong></td><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;">Cells &amp; nuclei</td><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;">Fine detail: ribosomes, plasmids, inside mitochondria</td></tr></tbody></table><div class="rd-callout rd-def"><span class="rd-clabel">Resolution</span><div class="rd-cbody">Ability to tell <strong>two close points apart</strong>. Higher = sharper image.</div></div>`,
            },
            {
              id: "bio-1-1-n7",
              title: "The magnification formula",
              heading: "The magnification formula",
              body: `<p>Magnification = how many times bigger the image is than the real object.</p><div class="rd-callout rd-def"><span class="rd-clabel">Formula</span><div class="rd-cbody"><strong>magnification = image size &divide; real size</strong></div></div><figure style="margin:10px 0;"><img src="/diagrams/bio/1-1/magnification-triangle.svg" alt="Magnification formula triangle" style="display:block;max-width:100%;height:auto;border-radius:10px;border:1px solid #e5e7eb;background:#fff;margin:10px auto 4px;" /><figcaption style="font-size:12px;color:#6b7280;text-align:center;margin-bottom:6px;">Cover the quantity you want.</figcaption></figure><div class="rd-callout rd-tip"><span class="rd-clabel">Exam tip</span><div class="rd-cbody">Image and real size must use the <strong>same units</strong>.</div></div><div class="rd-callout rd-eg"><span class="rd-clabel">Example</span><div class="rd-cbody">50&micro;m specimen at &times;100, in mm: image = 100 &times; 50 = 5000&micro;m = <strong>5mm</strong>.</div></div>`,
            },
            {
              id: "bio-1-1-n8",
              title: "Standard form for tiny measurements",
              heading: "Standard form for tiny measurements",
              body: `<p><strong>Standard form</strong> shrinks very big/small numbers, e.g. 0.017cm = 1.7 &times; 10&#8315;&#178;.</p><ul><li>Move the decimal until the first digit is 1&ndash;9.</li><li>Places moved = the <strong>power of 10</strong>: <strong>+</strong> moving left, <strong>&minus;</strong> moving right.</li></ul><div class="rd-callout rd-eg"><span class="rd-clabel">Example</span><div class="rd-cbody">0.0025mm: point moves right past the 2 &rarr; <strong>2.5 &times; 10&#8315;&#179; mm</strong>.</div></div>`,
            },
            {
              id: "bio-1-1-n9",
              title: "Preparing a slide (required practical)",
              heading: "Preparing a slide (required practical)",
              body: `<p>A <strong>slide</strong> holds the specimen. To prepare onion cells:</p><ol><li>Put a drop of water on a clean slide.</li><li>Peel <strong>epidermal tissue</strong> from an onion layer with tweezers.</li><li>Lay the tissue in the water.</li><li>Add a drop of <strong>iodine</strong> &mdash; a <strong>stain</strong> for contrast.</li><li>Lower a <strong>cover slip</strong>: stand it upright, then tilt down gently.</li></ol><div class="rd-callout rd-tip"><span class="rd-clabel">Exam tip</span><div class="rd-cbody">Lower the cover slip slowly to avoid trapping <strong>air bubbles</strong>.</div></div>`,
            },
            {
              id: "bio-1-1-n10",
              title: "Using a light microscope",
              heading: "Using a light microscope",
              body: `<p>To view a slide under a light microscope:</p><ol><li>Clip the slide to the <strong>stage</strong>.</li><li>Select the <strong>lowest</strong> objective lens.</li><li><strong>Coarse knob</strong>: raise the stage near the lens.</li><li>Look down the <strong>eyepiece</strong>; coarse-focus by lowering the stage.</li><li>Sharpen with the <strong>fine knob</strong>.</li><li>For more detail, switch to a higher lens and refocus.</li></ol><figure style="margin:10px 0;"><img src="/diagrams/bio/1-1/light-microscope.svg" alt="Labelled light microscope" style="display:block;max-width:100%;height:auto;border-radius:10px;border:1px solid #e5e7eb;background:#fff;margin:10px auto 4px;" /><figcaption style="font-size:12px;color:#6b7280;text-align:center;margin-bottom:6px;">Parts of a light microscope.</figcaption></figure><div class="rd-callout rd-tip"><span class="rd-clabel">Exam tip</span><div class="rd-cbody">Always start on the <strong>lowest</strong> magnification.</div></div>`,
            },
            {
              id: "bio-1-1-n11",
              title: "Drawing your observations",
              heading: "Drawing your observations",
              body: `<p>Draw observations neatly in sharp pencil:</p><ul><li>Big, with clear unbroken lines; add a <strong>title</strong>.</li><li><strong>No</strong> colouring or shading.</li><li>Label key features with straight, uncrossed lines.</li><li>Keep parts <strong>in proportion</strong>; state the <strong>magnification</strong>.</li></ul><div class="rd-callout rd-eg"><span class="rd-clabel">Drawing magnification</span><div class="rd-cbody">drawing length &divide; real length, e.g. 33mm &divide; 0.3mm = <strong>&times;110</strong>.</div></div>`,
            },
            {
              id: "bio-1-1-n12",
              title: "Specialised cells",
              heading: "Specialised cells",
              body: `<p>Cells are <strong>specialised</strong> &mdash; their structure suits their function.</p><table style="width:100%;border-collapse:collapse;font-size:14px;"><thead><tr><th style="border:1px solid #d1d5db;padding:6px 8px;text-align:left;background:rgba(124,58,237,0.08);">Cell</th><th style="border:1px solid #d1d5db;padding:6px 8px;text-align:left;background:rgba(124,58,237,0.08);">Job</th><th style="border:1px solid #d1d5db;padding:6px 8px;text-align:left;background:rgba(124,58,237,0.08);">Adaptations</th></tr></thead><tbody><tr><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;"><strong>Sperm</strong></td><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;">Carry male DNA to the egg.</td><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;">Tail to swim; many mitochondria for energy; enzymes to digest into the egg.</td></tr><tr><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;"><strong>Nerve</strong></td><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;">Carry electrical signals.</td><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;">Long (covers distance); branched ends connect to other nerves.</td></tr><tr><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;"><strong>Muscle</strong></td><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;">Contract.</td><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;">Long (room to contract); many mitochondria for energy.</td></tr><tr><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;"><strong>Root hair</strong></td><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;">Absorb water &amp; mineral ions.</td><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;">Long projection &rarr; big surface area.</td></tr><tr><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;"><strong>Phloem &amp; xylem</strong></td><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;">Transport food &amp; water in plants.</td><td style="border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;">Joined into tubes; xylem hollow, phloem nearly empty &rarr; flow.</td></tr></tbody></table><div class="rd-callout rd-tip"><span class="rd-clabel">Exam tip</span><div class="rd-cbody">Always link an adaptation back to the cell's <strong>job</strong>.</div></div>`,
            },
            {
              id: "bio-1-1-n13",
              title: "Differentiation",
              heading: "Differentiation",
              body: `<div class="rd-callout rd-def"><span class="rd-clabel">Differentiation</span><div class="rd-cbody">A cell <strong>changing to become specialised</strong> for its job.</div></div><ul><li>Mostly happens as an organism develops.</li><li><strong>Animal</strong> cells lose the ability early; many <strong>plant</strong> cells keep it for life.</li><li>In mature animals it mainly <strong>repairs and replaces</strong> cells (skin, blood).</li></ul><div class="rd-callout rd-alt"><span class="rd-clabel">Key term</span><div class="rd-cbody">Undifferentiated cells = <strong>stem cells</strong>.</div></div>`,
            },
            {
              id: "bio-1-1-n14",
              title: "Stem cells: embryonic and adult",
              heading: "Stem cells: embryonic and adult",
              body: `<p><strong>Stem cells</strong> are undifferentiated: they copy themselves and can <strong>differentiate</strong> into other cell types.</p><div class="rd-callout rd-def"><span class="rd-clabel">Embryonic</span><div class="rd-cbody">From early embryos. Can become <strong>any</strong> cell type.</div></div><div class="rd-callout rd-alt"><span class="rd-clabel">Adult</span><div class="rd-cbody">From places like <strong>bone marrow</strong>. Become only <strong>certain</strong> types, e.g. blood cells.</div></div><div class="rd-callout rd-key"><span class="rd-clabel">Key facts</span><div class="rd-cbody"><ul><li>Can be grown and cloned in a lab.</li><li>Made to differentiate for medicine or research.</li></ul></div></div>`,
            },
            {
              id: "bio-1-1-n15",
              title: "Uses of stem cells and therapeutic cloning",
              heading: "Uses of stem cells and therapeutic cloning",
              body: `<ul><li><strong>Adult</strong> stem cells already treat disease &mdash; bone-marrow cells replace faulty blood cells.</li><li><strong>Embryonic</strong> stem cells could replace other faulty cells &mdash; insulin cells (diabetes) or nerve cells (spinal injury).</li></ul><div class="rd-callout rd-def"><span class="rd-clabel">Therapeutic cloning</span><div class="rd-cbody">Making an embryo with the <strong>patient's genes</strong>, so its stem cells aren't <strong>rejected</strong>.</div></div><div class="rd-callout rd-tip"><span class="rd-clabel">Exam tip</span><div class="rd-cbody">Risk: lab stem cells could carry a <strong>virus</strong> to the patient.</div></div>`,
            },
            {
              id: "bio-1-1-n16",
              title: "Stem cells: ethical issues",
              heading: "Stem cells: ethical issues",
              body: `<p>Embryonic stem cells come from embryos &mdash; an <strong>ethical issue</strong>.</p><div class="rd-callout rd-alt"><span class="rd-clabel">Against</span><div class="rd-cbody"><ul><li>An embryo is a potential life; it shouldn't be experimented on.</li><li>Find <strong>other</strong> stem-cell sources instead.</li></ul></div></div><div class="rd-callout rd-def"><span class="rd-clabel">For</span><div class="rd-cbody"><ul><li>Curing patients matters more than an embryo's rights.</li><li>Embryos used are usually spares that would be destroyed anyway.</li></ul></div></div>`,
            },
            {
              id: "bio-1-1-n17",
              title: "Stem cells in plants",
              heading: "Stem cells in plants",
              body: `<div class="rd-callout rd-def"><span class="rd-clabel">Meristems</span><div class="rd-cbody">In plants, stem cells sit in the <strong>meristems</strong> (growth regions).</div></div><ul><li>Can become <strong>any</strong> plant cell, for the plant's whole life.</li><li>Quickly and cheaply <strong>clone</strong> whole plants.</li></ul><div class="rd-callout rd-key"><span class="rd-clabel">Key facts</span><div class="rd-cbody"><ul><li>Save rare species from extinction.</li><li>Grow identical crops with useful traits, e.g. disease resistance.</li></ul></div></div>`,
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
