

export const FSRS_PARAMS = {
  w: [
    0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0651, 0.0589, 1.533,
    0.1544, 1.007, 1.9395, 0.11, 0.29, 2.27, 0.15, 2.9898, 0.51, 0.14,
  ],
  requestRetention: 0.9,
  maximumInterval: 36500,
};

export function fsrsInitialStability(g) {
  return Math.max(FSRS_PARAMS.w[g - 1], 0.1);
}

export function fsrsInitialDifficulty(g) {
  return Math.min(
    Math.max(FSRS_PARAMS.w[4] - Math.exp(FSRS_PARAMS.w[5] * (g - 1)) + 1, 1),
    10,
  );
}

export function fsrsRetrievability(stability, elapsedDays) {
  if (!stability || stability <= 0) return 0;
  return Math.pow(1 + elapsedDays / (9 * stability), -1);
}

export function fsrsNextInterval(stability) {
  const { requestRetention, maximumInterval } = FSRS_PARAMS;

  const interval = (stability / Math.log(requestRetention)) * Math.log(0.9);
  return Math.min(Math.max(Math.round(Math.abs(interval)), 1), maximumInterval);
}

export function fsrsNextDifficulty(d, g) {
  const w = FSRS_PARAMS.w;
  const delta = -w[6] * (g - 3);
  return Math.min(Math.max(d + delta * ((10 - d) / 9), 1), 10);
}

export function fsrsNextStabilityAfterRecall(d, s, r, g) {
  const w = FSRS_PARAMS.w;
  return (
    s *
    (Math.exp(w[8]) *
      (11 - d) *
      Math.pow(s, -w[9]) *
      (Math.exp(w[10] * (1 - r)) - 1) *
      (g === 2 ? w[15] : 1) *
      (g === 4 ? w[16] : 1) +
      1)
  );
}

export function fsrsNextStabilityAfterForgetting(d, s, r) {
  const w = FSRS_PARAMS.w;
  return (
    w[11] *
    Math.pow(d, -w[12]) *
    (Math.pow(s + 1, w[13]) - 1) *
    Math.exp(w[14] * (1 - r))
  );
}

export function fsrsNext(prevState, rating) {
  const now = Date.now();
  if (!prevState || !prevState.stability) {
    const s = fsrsInitialStability(rating);
    const d = fsrsInitialDifficulty(rating);
    const interval = rating === 1 ? 1 : rating === 2 ? 1 : fsrsNextInterval(s);
    return {
      stability: s,
      difficulty: d,
      reps: 1,
      lapses: 0,
      state: rating === 1 ? 1 : 2,
      lastReview: now,
      due: now + interval * 86400000,
      interval,
      lastRating: rating,
    };
  }

  const { stability, difficulty, reps, lapses, lastReview } = prevState;
  const elapsedDays = Math.max(0, (now - (lastReview || now)) / 86400000);
  const r = fsrsRetrievability(stability, elapsedDays);
  const d = fsrsNextDifficulty(difficulty || 5, rating);
  let nextStability, nextInterval, nextState, nextLapses;
  if (rating === 1) {
    nextStability = fsrsNextStabilityAfterForgetting(d, stability, r);
    nextInterval = 1;
    nextState = 3;
    nextLapses = (lapses || 0) + 1;
  } else {
    nextStability = fsrsNextStabilityAfterRecall(d, stability, r, rating);
    nextInterval = fsrsNextInterval(nextStability);
    nextState = 2;
    nextLapses = lapses || 0;
  }
  return {
    stability: Math.max(nextStability, 0.1),
    difficulty: d,
    reps: (reps || 0) + 1,
    lapses: nextLapses,
    state: nextState,
    lastReview: now,
    due: now + nextInterval * 86400000,
    interval: nextInterval,
    lastRating: rating,
  };
}

export function getCardState(fcHist, cardId) {
  const v = fcHist[cardId];
  if (v === undefined || v === null) return null;
  if (typeof v === "boolean") return null;
  return v;
}

export function isCardDue(fcHist, cardId) {
  const s = getCardState(fcHist, cardId);
  if (!s) return true;
  return Date.now() >= s.due;
}

export function previewIntervals(state) {
  return [1, 2, 3, 4].map((rating) => {
    const next = fsrsNext(state, rating);
    const d = next.interval;
    if (d <= 1) return "today";
    if (d < 7) return `${d}d`;
    if (d < 30) return `${Math.round(d / 7)}w`;
    return `${Math.round(d / 30)}mo`;
  });
}

export function getRetrievability(fcHist, cardId) {
  const s = getCardState(fcHist, cardId);
  if (!s || !s.stability) return null;
  const elapsedDays = (Date.now() - (s.lastReview || Date.now())) / 86400000;
  return Math.round(fsrsRetrievability(s.stability, elapsedDays) * 100);
}
