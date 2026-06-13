// generatedContent.js
// -----------------------------------------------------------------------------
// In-code curriculum content for ReviseIQ.
//
// ReviseIQ no longer has an admin role. Instead, all study content (notes,
// flashcards and exam questions) is authored DIRECTLY in code, here, and ships
// with the app. This file is the single source of truth for that content.
//
// It is intentionally EMPTY right now — no content has been generated yet.
// Content is added per subject, keyed by the subject id used in subjects.js
// (e.g. "bio", "chem", "maths", "history", ...).
//
// SHAPE (must match what mergeTopics() in social.jsx expects for base topics):
//
//   GENERATED_CONTENT[subjectId] = [
//     {
//       id: "topic-1",            // stable unique id within the subject
//       number: "1",              // display number (optional, can be "")
//       title: "Cell Biology",
//       sections: [
//         {
//           id: "bio-1-1",        // stable unique id (used as the SRS key root)
//           title: "Cell Structure",
//           notes: [
//             // { id, title, body /* rich text/markdown string */ }
//           ],
//           flashcards: [
//             // { id, front, back, type? }
//           ],
//           questions: [
//             // { id, text, type: "mcq"|"short"|"extended", marks,
//             //   options?, answer?, markScheme?, sampleAnswer? }
//           ],
//         },
//       ],
//     },
//   ];
//
// Every id MUST be stable and unique — the spaced-repetition engine, mastery
// model and learning engine all key off section + card + question ids. Changing
// an id resets a student's history for that item.
// -----------------------------------------------------------------------------

export const GENERATED_CONTENT = {};

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
