import React from "react";
import { OfflineBanner, ShortcutModal } from "./accountModals.jsx";
import { OnboardingWizard, SearchModal } from "./searchOnboard.jsx";

export function GlobalOverlays({
  D,
  online,
  shortcutModal,
  setShortcutModal,
  searchOpen,
  setSearchOpen,
  onboarding,
  handleOnboardingComplete,
  subjects,
  allSections,
  boardData,
  boardSels,
  handleSearchNavigate,
  screen,
  onHome,
  onMock,
  onTutor,
  onTimetable,
  onDash,
  onLeaderboards,
  streak,
}) {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const content = (
    <>
      {!online && <OfflineBanner />}
      {shortcutModal && (
        <ShortcutModal D={D} onClose={() => setShortcutModal(false)} />
      )}
      {searchOpen && (
        <SearchModal
          D={D}
          subjects={subjects}
          allSections={allSections}
          boardData={boardData}
          boardSels={boardSels}
          onNavigate={handleSearchNavigate}
          onClose={() => setSearchOpen(false)}
        />
      )}
      {onboarding && (
        <OnboardingWizard D={D} onComplete={handleOnboardingComplete} />
      )}
    </>
  );
  return content;
}

export function getSectionDot(sec, fcHist, stats) {
  const cards = sec.flashcards || [];

  const qs = sec.questions || [];
  if (cards.length === 0 && qs.length === 0) return null;
  const qStats = stats && stats.weakQ && stats.weakQ[sec.id];
  const qAttempted = qStats && qStats.total > 0;
  const qPct = qAttempted
    ? Math.round(((qStats.total - qStats.wrong) / qStats.total) * 100)
    : 0;
  const reviewedCards = cards.filter(
    (c) => fcHist && fcHist[c.id] !== undefined,
  );
  const dueCards = cards.filter((c) => {
    if (!fcHist || !fcHist[c.id]) return true;
    const s = fcHist[c.id];
    return !s || Date.now() >= s.due;
  });
  const anyReviewed = reviewedCards.length > 0;
  const allMastered =
    cards.length > 0 &&
    dueCards.length === 0 &&
    reviewedCards.length === cards.length;
  const fcGreen = cards.length === 0 || allMastered;
  const qGreen = qs.length === 0 || (qAttempted && qPct >= 70);
  if (fcGreen && qGreen && (anyReviewed || qAttempted)) return "#10b981";
  if (!anyReviewed && !qAttempted) return "#ef4444";
  return "#f59e0b";
}
