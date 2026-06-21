import "../../src/storage.js";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";
import { buildTodaySessionPlan, getPedagogicalContext, selectCommandWordQuestions } from "./learningEngine.js";
import { ImportModal, ManageAccountsModal } from "./accountModals.jsx";
import { _aiWithRetry, _parseAIJson, aiServiceReflectionSummarizer, buildAIPersonalisedSession, callAI, detectErrorType, getAccDisplayName, getAccHash, markAnswer } from "./aiService.js";
import { ADMIN_PASS_HASH, ADMIN_SCHOOL, ADMIN_USER, DEFAULT_BOARD, SK, SK_CALIBRATION, SK_ERROR_PATTERNS, SK_GRAPH, SK_JOURNAL, SK_SESSION, calcBrierScore, classifyError, confToProb, getDisplayName, hashPw, incrementErrorPattern, isAdmin } from "./coreHelpers.js";
import { AnnotatedImage } from "./annotation.jsx";
import { BlurtingScreen } from "./blurtingScreen.jsx";
import { ClozeCard, QuestionFigure, SequenceCard, generateWhyPrompt } from "./cards.jsx";
import { ContactScreen } from "./contact.jsx";
import { ConceptMap, DiagramRenderer, GraphCard, LabelledStructure, LearningTimeline, MasteryTreemap, ProcessCard, ProgressiveDiagram, SketchCanvas, checkPrerequisites, generateSVGDiagram } from "./diagrams.jsx";
import { FocusMode } from "./focusMode.jsx";
import { ErrorBoundary } from "./errorBoundary.jsx";
import { FriendsPanel } from "./friends.jsx";
import { fsrsNext, getCardState, getRetrievability, isCardDue, previewIntervals } from "./fsrs.js";
import { AccountScreen, AdminBar, Header } from "./header.jsx";
import { ACHIEVEMENTS, AchievementToast, ExamReadinessGauge, MasteryPanel, MasteryRings, calculateExamReadiness, calculateMastery, checkNewAchievements } from "./mastery.jsx";
import { MockExamScreen } from "./mockExam.jsx";
import { registerReviseIQServiceWorker, syncOfflineQueue, useOfflineQueue } from "./offline.js";
import { GlobalOverlays } from "./overlays.jsx";
import { CalibrationDial, Figure, MasteryConstellation, Ring, SessionRecap, StatTile } from "./lumen.jsx";
import { PracticeSessionScreen, TodayWidget } from "./practice.jsx";
import { AO_COLORS, autoHints, detectAOLabel, detectCW, detectCardType } from "./questionMeta.js";
import { ContentBlock, SmartNoteCard } from "./richText.jsx";
import { calcLongestStreak, calcStreak, ensureCardVariantCached, generateTransferQuestion, generateWeeklyPlan, getLadderLevel, maybeUseVariantText, selectAdaptiveQuestions, todayStr, updateAdaptiveLevel, updateLadderLevel, verifyExplanation } from "./scheduling.js";
import { SubjectSelectionScreen } from "./searchOnboard.jsx";
import { SchoolLeaderboard, GlobalLeaderboard, mergeTopics, upsertGroupScore } from "./social.jsx";
import { GENERATED_CONTENT, getGeneratedTopics } from "./generatedContent.js";
import { getNextGoal, logLearningEvent, loadLearningEvents } from "./learningEngine.js";
import { CalibrationGauge, ForecastBar, MasteryRing, MemoryDecayChart, PastPapersTab, PostSessionReflection, SRInfoTooltip, SessionGoalModal, StrategyRecommendation, StudyJournalTab } from "./studyWidgets.jsx";
import { ALL_SUBJECTS } from "./subjects.js";
import { TimetableScreen } from "./timetable.jsx";
import { AITutorScreen } from "./tutor.jsx";
import { B, C, I, MobileBottomNav, ToastContainer, gradeColor, mu, pctToGrade, showToast, stripHtml, trackEvent, tx } from "./ui.jsx";
import { SectionScreen } from "./section.jsx";
import { SubjectScreen } from "./subject.jsx";
import { DashboardScreen } from "./dashboard.jsx";
import { TargetScreen } from "./target.jsx";
import { HomeScreen } from "./home.jsx";

export default function App() {
  const [user, setUser] = useState("");
  const [userSchool, setUserSchool] = useState("");
  const [userDisplayName, setUserDisplayName] = useState("");
  const [nameIn, setNameIn] = useState("");
  const [passIn, setPassIn] = useState("");
  const [schoolIn, setSchIn] = useState("");
  const [displayNameIn, setDNIn] = useState("");
  const [authMode, setAM] = useState("login");
  const [authErr, setAuthE] = useState("");
  const [accounts, setAccs] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [userGoogleKey, setGK] = useState("");
  const [screen, setScreen] = useState("login");
  const [todaySession, setTodaySession] = useState(null);
  const [D, setD] = useState(false);
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const { enqueue: enqueueOffline, syncOfflineQueue: runOfflineSync } =
    useOfflineQueue(user, online);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutModal, setShortcutModal] = useState(false);
  const [onboarding, setOnboarding] = useState(null);
  const [boardData, setBoardData] = useState({});
  const [boardSels, setBoardSels] = useState({});

  const [subIdx, setSubIdx] = useState(null);
  const [topIdx, setTopIdx] = useState(null);
  const [secId, setSecId] = useState(null);
  const [tab, setTab] = useState("notes");
  const [subjTab, setSubjTab] = useState("sections");
  const [fcIdx, setFcIdx] = useState(0);
  const [flip, setFlip] = useState(false);
  const [cramMode, setCramMode] = useState(false);

  const [noteSearch, setNoteSearch] = useState("");
  const [shuffledCards, setShuffledCards] = useState(null);
  const touchStartRef = useRef(null);
  const [importOpen, setImportOpen] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [manageAccountsOpen, setManageAccountsOpen] = useState(false);

  const [fcHist, setFCH] = useState({});
  const [qIdx, setQIdx] = useState(0);
  const [selOpt, setSelOpt] = useState(null);
  const [textAns, setTA] = useState("");
  const [qRes, setQRes] = useState(null);
  const [marking, setMark] = useState(false);
  const [showMdl, setSmMdl] = useState(false);
  const [elabOpen, setElabOpen] = useState(false);
  const [elabText, setElabText] = useState("");
  const [explainText, setExplainText] = useState("");
  const [explainFeedback, setExplainFeedback] = useState(null);
  const [transferQuestion, setTransferQuestion] = useState(null);
  const [ladderTick, setLadderTick] = useState(0);
  const [weeklyPlan, setWeeklyPlan] = useState([]);
  const [prereqModal, setPrereqModal] = useState(null);
  const [showSketch, setShowSketch] = useState(false);
  const [svgPreview, setSvgPreview] = useState("");
  const [showTreemap, setShowTreemap] = useState(false);
  const [timelineSelected, setTimelineSelected] = useState(null);

  const [fcConf, setFcConf] = useState(null);

  const [fcHintLvl, setFcHintLvl] = useState(0);

  const [fcSelfExp, setFcSelfExp] = useState("");

  const [fcSelfOpen, setFcSelfOpen] = useState(false);
  const [qConf, setQConf] = useState(null);
  const [qHintLvl, setQHintLvl] = useState(0);

  const [qSelfExp, setQSelfExp] = useState("");

  const [qSelfDone, setQSelfDone] = useState(false);
  const [labelTestMode, setLabelTestMode] = useState(false);
  const [labelTestComplete, setLabelTestComplete] = useState(false);

  const [sessionSetup, setSessionSetup] = useState(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [journalData, setJournalData] = useState({});

  const [calibrationData, setCalibrationData] = useState({});
  const [errorPatternsAll, setErrorPatternsAll] = useState({});
  const [pedCtx, setPedCtx] = useState(null);
  const [goalModalShownThisTab, setGoalModalShownThisTab] = useState(false);

  const [achievements, setAchievements] = useState([]);

  const [newAchievement, setNewAchievement] = useState(null);
  const [focusMode, setFocusMode] = useState(false);

  const [totalDaysStudied, setTotalDaysStudied] = useState(0);
  const [stats, setStats] = useState({
    fcC: 0,
    fcT: 0,
    qS: 0,
    qM: 0,
    weakQ: {},
    weakFC: {},
    subjStats: {},
  });
  const lastQCountRef = useRef(0);
  const [targetGrades, setTargetGrades] = useState({});
  const [activityDates, setAD] = useState(new Set());
  const [activityCounts, setAC] = useState({});
  const [gradeSnapshots, setGS] = useState([]);
  const [streakPop, setStreakPop] = useState(false);

  const [modal, setModal] = useState(null);
  const [editingTitle, setEditingTitle] = useState(null);
  const [ttSubj, setTTSubj] = useState(null);
  const [ttItems, setTTI] = useState([]);
  const [ttIdx, setTTIdx] = useState(0);
  const [ttRes, setTTRes] = useState(null);
  const [ttSelOpt, setTTSO] = useState(null);
  const [ttTextAns, setTTTA] = useState("");
  const [ttMarking, setTTMk] = useState(false);
  const [blurtSubjId, setBlurtSubjId] = useState(null);
  const [blurtSecId2, setBlurtSecId2] = useState(null);
  const [tutorSubjId, setTutorSubjId] = useState(null);
  const [coachMode, setCoachMode] = useState("exam");
  const [timetableExams, setTimetableExams] = useState([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState(null);
  const [showSubjectSelection, setShowSubjectSelection] = useState(false);
  const [prefsReady, setPrefsReady] = useState(false);

  // Unified learning-engine event log. Every meaningful user action is pushed
  // here (in-memory for instant reactivity + persisted via logLearningEvent),
  // and the engine reads it to decide the single next goal.
  const [engineEvents, setEngineEvents] = useState([]);
  const logEvent = useCallback(
    (type, payload = {}) => {
      const ev = { t: type, ts: Date.now(), ...payload };
      setEngineEvents((prev) => [...prev, ev].slice(-800));
      if (user) logLearningEvent(user, type, payload);
    },
    [user],
  );
  useEffect(() => {
    if (!user) {
      setEngineEvents([]);
      return;
    }
    let alive = true;
    loadLearningEvents(user).then((evs) => {
      if (alive) setEngineEvents(evs);
    });
    return () => {
      alive = false;
    };
  }, [user]);

  const subjects = React.useMemo(() => {
    // Attach in-code curriculum content (notes/flashcards/questions) to each
    // subject. Content now lives in generatedContent.js, not in an admin store.
    const withContent = (s) => ({ ...s, topics: getGeneratedTopics(s.id) });
    if (selectedSubjectIds === null) return ALL_SUBJECTS.map(withContent);
    if (selectedSubjectIds.length === 0)
      return ALL_SUBJECTS.filter((s) => s._politics).map(withContent);
    return ALL_SUBJECTS.filter(
      (s) => s._politics || selectedSubjectIds.includes(s.id),
    ).map(withContent);
  }, [selectedSubjectIds]);
  const admin = isAdmin(user);
  const subjDef = subIdx != null ? subjects[subIdx] : null;
  const curBoard = subjDef
    ? boardSels[subjDef.id] || DEFAULT_BOARD
    : DEFAULT_BOARD;
  const curBKey = subjDef ? `${subjDef.id}:${curBoard}` : null;
  const curBData = (curBKey && boardData[curBKey]) || {
    custom: [],
    extras: {},
    papers: [],
  };
  const curTopics = React.useMemo(
    () =>
      subjDef
        ? mergeTopics(subjDef.topics || [], curBData.custom, curBData.extras)
        : [],
    [subjDef?.id, curBData.custom, curBData.extras],
  );
  const curTopic = topIdx != null ? curTopics[topIdx] : null;
  const section = curTopic
    ? curTopic.sections.find((s) => s.id === secId)
    : null;

  const streak = calcStreak(activityDates);
  const allSections = React.useMemo(
    () =>
      subjects.flatMap((s) => {
        const b = boardSels[s.id] || DEFAULT_BOARD;
        const bd = boardData[`${s.id}:${b}`] || {
          custom: [],
          extras: {},
          papers: [],
        };
        const merged = mergeTopics(s.topics || [], bd.custom, bd.extras);
        return merged.flatMap((t) =>
          t.sections.map((sec) => ({ ...sec, subjectId: s.id })),
        );
      }),
    [subjects, boardSels, boardData],
  );
  const getBD = (sId, b) =>
    boardData[`${sId}:${b}`] || { custom: [], extras: {}, papers: [] };
  const boardLoadedRef = useRef({});
  const ensureBoardLoaded = useCallback(async (sId, b) => {
    const key = `${sId}:${b}`;
    if (boardLoadedRef.current[key]) return;
    boardLoadedRef.current[key] = true;
    const [rc, re, rp] = await Promise.allSettled([
      window.storage.get(SK.CUSTOM(sId, b), true),
      window.storage.get(SK.EXTRAS(sId, b), true),
      window.storage.get(SK.PAPERS(sId, b), true),
    ]);
    setBoardData((bd) => ({
      ...bd,
      [key]: {
        custom:
          rc.status === "fulfilled" && rc.value?.value
            ? JSON.parse(rc.value.value)
            : [],
        extras:
          re.status === "fulfilled" && re.value?.value
            ? JSON.parse(re.value.value)
            : {},
        papers:
          rp.status === "fulfilled" && rp.value?.value
            ? JSON.parse(rp.value.value)
            : [],
      },
    }));
  }, []);
  const ensureAllBoardsLoaded = useCallback(
    async (savedBoardSels = {}, subjectList) => {
      const list = subjectList || ALL_SUBJECTS;
      const toLoad = list.flatMap((s) => {
        const boards = new Set([DEFAULT_BOARD]);
        const saved = savedBoardSels[s.id];
        if (saved) boards.add(saved);
        return [...boards].map((b) => ({ sId: s.id, b }));
      });
      await Promise.all(toLoad.map(({ sId, b }) => ensureBoardLoaded(sId, b)));
    },
    [ensureBoardLoaded],
  );
  const saveBD = (sId, b, patch) => {
    const key = `${sId}:${b}`;
    setBoardData((prev) => {
      const cur = prev[key] || { custom: [], extras: {}, papers: [] };
      const next = { ...cur, ...patch };
      if (patch.custom !== undefined)
        window.storage
          .set(SK.CUSTOM(sId, b), JSON.stringify(next.custom), true)
          .catch(() => {});
      if (patch.extras !== undefined)
        window.storage
          .set(SK.EXTRAS(sId, b), JSON.stringify(next.extras), true)
          .catch(() => {});
      if (patch.papers !== undefined)
        window.storage
          .set(SK.PAPERS(sId, b), JSON.stringify(next.papers), true)
          .catch(() => {});
      return { ...prev, [key]: next };
    });
  };
  useEffect(() => {
    (async () => {
      let accs = {};
      try {
        const r = await window.storage.get(SK.ACCOUNTS, true);
        if (r?.value) accs = JSON.parse(r.value);
      } catch (_) {}

      // Admin account seeding removed — ReviseIQ no longer has an admin role.
      setAccs(accs);
      setReady(true);
    })();
  }, []);
  useEffect(() => {
    if (!user || !ready) return;
    setPrefsReady(false);
    progLoaded.current = false;
    (async () => {
      let savedSels = {};
      try {
        const r = await window.storage.get(SK.PROG(user), true);
        if (r?.value) {
          const p = JSON.parse(r.value);
          if (p.fcHist) setFCH(p.fcHist);
          if (p.stats)
            setStats({
              fcC: 0,
              fcT: 0,
              qS: 0,
              qM: 0,
              weakQ: {},
              weakFC: {},
              subjStats: {},
              ...p.stats,
            });
          if (p.activityDates) setAD(new Set(p.activityDates));
          if (p.activityCounts) setAC(p.activityCounts);
          if (p.gradeSnapshots) setGS(p.gradeSnapshots);
        }
      } catch (_) {}

      try {
        const pr = await window.storage.get(SK.PREFS(user), true);
        if (pr?.value) {
          const p = JSON.parse(pr.value);
          if (p.targetGrades) setTargetGrades(p.targetGrades);
          if (p.boardSels) {
            setBoardSels(p.boardSels);
            savedSels = p.boardSels;
          }
          if (p.selectedSubjectIds && Array.isArray(p.selectedSubjectIds)) {
            setSelectedSubjectIds(isAdmin(user) ? null : p.selectedSubjectIds);
          } else {
            if (!isAdmin(user)) setShowSubjectSelection(true);
            setSelectedSubjectIds(isAdmin(user) ? null : []);
          }
        } else {
          const r2 = await window.storage.get(SK.PROG(user), true);
          if (r2?.value) {
            const p2 = JSON.parse(r2.value);
            if (p2.targetGrades) setTargetGrades(p2.targetGrades);
            if (p2.boardSels) {
              setBoardSels(p2.boardSels);
              savedSels = p2.boardSels;
            }
            if (p2.selectedSubjectIds && Array.isArray(p2.selectedSubjectIds)) {
              setSelectedSubjectIds(
                isAdmin(user) ? null : p2.selectedSubjectIds,
              );
            } else {
              if (!isAdmin(user)) setShowSubjectSelection(true);
              setSelectedSubjectIds(isAdmin(user) ? null : []);
            }
          } else {
            if (!isAdmin(user)) setShowSubjectSelection(true);
            setSelectedSubjectIds(isAdmin(user) ? null : []);
          }
        }
      } catch (_) {}
      setTimeout(() => {
        progLoaded.current = true;

        setPrefsReady(true);
      }, 0);

      try {
        const tr = await window.storage.get(SK.TIMETABLE(user));
        if (tr?.value) {
          const td = JSON.parse(tr.value);
          if (td.exams && Array.isArray(td.exams)) setTimetableExams(td.exams);
        }
      } catch (_) {}
      await ensureAllBoardsLoaded(savedSels, ALL_SUBJECTS);

      try {
        const epMap = {};
        const sIds = (savedSels ? Object.keys(savedSels) : []).concat(
          ALL_SUBJECTS.map((s) => s.id),
        );
        const uniq = [...new Set(sIds)];
        uniq.forEach((sId) => {
          try {
            const key =
              "gcse:errorPatterns:" +
              (user || "").replace(/\W/g, "-") +
              ":" +
              sId;
            const ep = JSON.parse(localStorage.getItem(key) || "{}");
            if (Object.values(ep).some((v) => v > 0)) epMap[sId] = ep;
          } catch (_) {}
        });
        if (Object.keys(epMap).length) setErrorPatternsAll(epMap);
      } catch (_) {}

      try {
        const sIds = [
          ...new Set([
            ...(savedSels ? Object.keys(savedSels) : []),
            ...ALL_SUBJECTS.map((s) => s.id),
          ]),
        ];
        const calResults = await Promise.allSettled(
          sIds.map((sId) =>
            window.storage.get(SK_CALIBRATION(user, sId), true),
          ),
        );
        const calMap = {};
        calResults.forEach((r, i) => {
          if (r.status === "fulfilled" && r.value?.value) {
            try {
              calMap[sIds[i]] = JSON.parse(r.value.value);
            } catch (_) {}
          }
        });
        if (Object.keys(calMap).length) setCalibrationData(calMap);
      } catch (_) {}

      try {
        const jIds = ALL_SUBJECTS.map((s) => s.id);
        const jResults = await Promise.allSettled(
          jIds.map((sId) => window.storage.get(SK_JOURNAL(user, sId), true)),
        );
        const jMap = {};
        jResults.forEach((r, i) => {
          if (r.status === "fulfilled" && r.value?.value) {
            try {
              const parsed = JSON.parse(r.value.value);
              if (Array.isArray(parsed) && parsed.length)
                jMap[jIds[i]] = parsed;
            } catch (_) {}
          }
        });
        if (Object.keys(jMap).length) setJournalData(jMap);
      } catch (_) {}

      try {
        const ar = await window.storage.get(
          "gcse:achievements:" + user.replace(/\W/g, "-"),
          true,
        );
        if (ar?.value) {
          const a = JSON.parse(ar.value);
          if (Array.isArray(a)) setAchievements(a);
        }
      } catch (_) {}

      try {
        const td = await window.storage.get(
          "gcse:totalDays:" + user.replace(/\W/g, "-"),
          true,
        );
        if (td?.value) setTotalDaysStudied(Number(td.value) || 0);
      } catch (_) {}
    })();
  }, [user, ready]);

  useEffect(() => {
    const go = () => setOnline(true);
    const goff = () => setOnline(false);
    window.addEventListener("online", go);
    window.addEventListener("offline", goff);
    return () => {
      window.removeEventListener("online", go);
      window.removeEventListener("offline", goff);
    };
  }, []);

  useEffect(() => {
    registerReviseIQServiceWorker();
  }, []);
  useEffect(() => {
    if (online) runOfflineSync();
  }, [online, runOfflineSync]);
  useEffect(() => {
    if (!user || !ready || !allSections.length) return;
    const plan = generateWeeklyPlan(
      user,
      subjects,
      allSections,
      fcHist,
      stats,
      timetableExams,
    );
    setWeeklyPlan(Array.isArray(plan) ? plan : []);
  }, [user, ready, allSections, subjects, fcHist, stats, timetableExams]);

  useEffect(() => {
    if (!user || !ready) return;
    const ctx = getPedagogicalContext({
      user,
      subjects,
      allSections,
      stats,
      fcHist,
      calibrationData,
      errorPatterns: errorPatternsAll,
      timetableExams,
      achievements,
      streak: calcStreak(activityDates),
      totalDaysStudied,
    });
    setPedCtx(ctx);
  }, [
    user,
    ready,
    subjects,
    allSections,
    stats,
    fcHist,
    calibrationData,
    errorPatternsAll,
    timetableExams,
    achievements,
    activityDates,
    totalDaysStudied,
  ]);
  useEffect(() => {
    const prev = lastQCountRef.current || 0;
    const cur = Number(stats?.qM || 0);
    if (cur > prev) {
      const delta = cur - prev;
      enqueueOffline({
        type: "question",
        payload: { delta: delta, total: cur },
      });
      upsertGroupScore("default", user, delta, calcStreak(activityDates));
    }
    lastQCountRef.current = cur;
  }, [stats?.qM, user, enqueueOffline, activityDates]);
  const markTodayActive = useCallback(() => {
    const today = todayStr();
    setAD((prev) => {
      if (prev.has(today)) return prev;

      const next = new Set(prev);
      next.add(today);
      setStreakPop(true);
      setTimeout(() => setStreakPop(false), 400);

      setTotalDaysStudied((d) => {
        const nd = d + 1;
        window.storage
          .set("gcse:totalDays:" + user.replace(/\W/g, "-"), String(nd), true)
          .catch(() => {});
        return nd;
      });
      return next;
    });
    setAC((prev) => ({ ...prev, [today]: (prev[today] || 0) + 1 }));
    trackEvent("session_active", { screen });
  }, [user]);
  const saveAccounts = async (n) => {
    try {
      await window.storage.set(SK.ACCOUNTS, JSON.stringify(n), true);
    } catch (_) {}
  };
  const viewAnalytics = async () => {
    try {
      const keys = await window.storage.list("gcse:analytics:", true);
      if (!keys?.keys?.length) {
        showToast("No analytics data yet.", "warn");
        return;
      }
      const recent = keys.keys.slice(-7);
      const results = await Promise.allSettled(
        recent.map((k) => window.storage.get(k, true)),
      );
      const allEvents = results
        .filter((r) => r.status === "fulfilled" && r.value?.value)
        .flatMap((r) => {
          try {
            return JSON.parse(r.value.value);
          } catch (_) {
            return [];
          }
        });
      const summary = {};
      allEvents.forEach((e) => {
        summary[e.event] = (summary[e.event] || 0) + 1;
      });
      setAnalyticsData({
        total: allEvents.length,
        summary,
        days: recent.length,
      });
    } catch (e) {
      showToast("Analytics error: " + e.message, "error");
    }
  };

  const saveJournalEntry = (subjectId, entry) => {
    setJournalData((prev) => {
      const cur = prev[subjectId] || [];
      const next = [...cur, entry].slice(-50);
      window.storage
        .set(SK_JOURNAL(user, subjectId), JSON.stringify(next), true)
        .catch(() => {});
      return { ...prev, [subjectId]: next };
    });
    setShowReflection(false);
    showToast("Reflection saved ✓", "success");

    const subjName = subjDef ? subjDef.name : subjectId || "";
    if (entry && entry.reflections) {
      aiServiceReflectionSummarizer(entry.reflections, subjName)
        .then(function (coaching) {
          if (!coaching || !coaching.summary) return;
          setJournalData(function (prev) {
            const cur = prev[subjectId] || [];

            const updated = cur.map(function (e, i) {
              return i === cur.length - 1
                ? Object.assign({}, e, { coaching: coaching })
                : e;
            });
            window.storage
              .set(SK_JOURNAL(user, subjectId), JSON.stringify(updated), true)
              .catch(function () {});
            return Object.assign({}, prev, { [subjectId]: updated });
          });
        })
        .catch(function () {});
    }
  };
  const saveSessionSetup = async (setup) => {
    setSessionSetup(setup);
    setShowGoalModal(false);
    try {
      const key = SK_SESSION(user);
      const existing = (await window.storage.get(key, true).catch(() => ({})))
        ?.value;
      const all = existing ? JSON.parse(existing) : [];
      all.push({ ...setup, subjectId: subjDef?.id });
      await window.storage.set(key, JSON.stringify(all.slice(-100)), true);
    } catch (_) {}
  };

  const runAchievementCheck = useCallback(
    (curAchievements) => {
      const existingIds = (curAchievements || achievements).map((a) => a.id);
      const streak = calcStreak(activityDates);
      const newIds = checkNewAchievements(
        existingIds,
        stats,
        fcHist,
        allSections,
        calibrationData,
        streak,
        subjects,
      );
      if (!newIds.length) return;
      const now = new Date().toISOString().slice(0, 10);
      const newEntries = newIds.map((id) => {
        const def = ACHIEVEMENTS.find((a) => a.id === id) || {
          id,
          title: id,
          desc: "",
        };
        return { ...def, dateEarned: now };
      });
      const next = [...(curAchievements || achievements), ...newEntries];
      setAchievements(next);
      window.storage.set(
        "gcse:achievements:" + user.replace(/\W/g, "-"),
        JSON.stringify(next),
        true,
      ).catch(() => {});

      if (newIds[0]) {
        setNewAchievement(newIds[0]);
        setTimeout(() => setNewAchievement(null), 4000);
      }
    },
    [
      achievements,
      stats,
      fcHist,
      allSections,
      calibrationData,
      activityDates,
      subjects,
      user,
    ],
  );
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      const typing =
        ["INPUT", "TEXTAREA", "SELECT"].includes(tag) ||
        document.activeElement?.contentEditable === "true";

      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }
      if (typing) return;

      if (e.key === "?") {
        setShortcutModal((s) => !s);
        return;
      }

      if (screen === "section") {
        if (tab === "flashcards") {
          if (e.key === "f" || e.key === "F") {
            e.preventDefault();
            setFlip((v) => !v);
            return;
          }
          if (e.key === "ArrowRight" || e.key === "n" || e.key === "N") {
            e.preventDefault();
            setFlip(false);
            setFcIdx((i) => {
              const cards = section?.flashcards || [];
              return cards.length > 0 ? (i < cards.length - 1 ? i + 1 : 0) : 0;
            });
            return;
          }
          if (e.key === "ArrowLeft" || e.key === "p" || e.key === "P") {
            e.preventDefault();
            setFlip(false);
            setFcIdx((i) => {
              const cards = section?.flashcards || [];
              return cards.length > 0 ? (i > 0 ? i - 1 : cards.length - 1) : 0;
            });
            return;
          }

          if (flip && ["1", "2", "3", "4"].includes(e.key)) {
            e.preventDefault();
            const rating = parseInt(e.key);
            if (section?.flashcards?.length > 0) {
              const cardId =
                section.flashcards[
                  Math.min(fcIdx, section.flashcards.length - 1)
                ]?.id;
              if (cardId) {
                setFCH((prevHist) => {
                  const prevState = getCardState(prevHist, cardId);
                  const next = fsrsNext(prevState, rating);
                  return { ...prevHist, [cardId]: next };
                });
                const correct = rating >= 3;
                setStats((s) => {
                  const wfc = { ...s.weakFC };
                  wfc[secId] = {
                    wrong: (wfc[secId]?.wrong || 0) + (correct ? 0 : 1),
                    total: (wfc[secId]?.total || 0) + 1,
                  };
                  const ss = { ...s.subjStats };
                  const si = subIdx;
                  const sId = si != null ? subjects[si]?.id : null;
                  if (sId)
                    ss[sId] = {
                      ...ss[sId],
                      fcC: (ss[sId]?.fcC || 0) + (correct ? 1 : 0),
                      fcT: (ss[sId]?.fcT || 0) + 1,
                    };
                  return {
                    ...s,
                    fcC: s.fcC + (correct ? 1 : 0),
                    fcT: s.fcT + 1,
                    weakFC: wfc,
                    subjStats: ss,
                  };
                });
                markTodayActive();
                setFlip(false);
                setFcIdx((i) => {
                  const cards = section.flashcards || [];
                  return i < cards.length - 1 ? i + 1 : 0;
                });
              }
            }
            return;
          }
        }
        if (tab === "questions") {
          if (e.key === "ArrowRight" || e.key === "n" || e.key === "N") {
            e.preventDefault();
            setQIdx((i) => {
              const qs = section?.questions || [];
              return qs.length > 0 ? (i < qs.length - 1 ? i + 1 : 0) : 0;
            });
            setQRes(null);
            setSelOpt(null);
            setTA("");
            return;
          }
          if (e.key === "ArrowLeft" || e.key === "p" || e.key === "P") {
            e.preventDefault();
            setQIdx((i) => {
              const qs = section?.questions || [];
              return qs.length > 0 ? (i > 0 ? i - 1 : qs.length - 1) : 0;
            });
            setQRes(null);
            setSelOpt(null);
            setTA("");
            return;
          }
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    screen,
    tab,
    flip,
    fcIdx,
    qIdx,
    secId,
    subIdx,
    section,
    subjects,
    markTodayActive,
  ]);
  const saveTimer = useRef(null);
  const progLoaded = useRef(false);
  const gradeSnapsRef = useRef(gradeSnapshots);
  useEffect(() => {
    gradeSnapsRef.current = gradeSnapshots;
  }, [gradeSnapshots]);

  useEffect(() => {
    if (!user || !progLoaded.current || !prefsReady) return;
    window.storage
      .get(SK.PREFS(user), true)
      .then((r) => {
        const existing = r?.value ? JSON.parse(r.value) : {};
        return window.storage.set(
          SK.PREFS(user),
          JSON.stringify({ ...existing, targetGrades }),
          true,
        );
      })
      .catch(() => {});
  }, [user, targetGrades, prefsReady]);

  useEffect(() => {
    if (!user || !progLoaded.current || !prefsReady) return;
    if (selectedSubjectIds === null) return;
    window.storage
      .get(SK.PREFS(user), true)
      .then((r) => {
        const existing = r?.value ? JSON.parse(r.value) : {};
        return window.storage.set(
          SK.PREFS(user),
          JSON.stringify({
            ...existing,
            selectedSubjectIds: selectedSubjectIds || [],
            boardSels,
          }),
          true,
        );
      })
      .catch(() => {});
  }, [user, selectedSubjectIds, boardSels, prefsReady]);
  useEffect(() => {
    if (!user) return;
    if (!progLoaded.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const today = todayStr();
      const grades = {};
      ALL_SUBJECTS.forEach(function (s) {
        const ss = stats.subjStats && stats.subjStats[s.id];
        if (ss && ss.qM > 0) grades[s.id] = Math.round((ss.qS / ss.qM) * 100);
      });
      const hasAnyGrade = Object.keys(grades).length > 0;

      const currentSnaps = gradeSnapsRef.current || [];

      const filteredSnaps = currentSnaps.filter(function (s) {
        return s.date !== today;
      });
      const newSnaps = hasAnyGrade
        ? [...filteredSnaps, { date: today, grades: grades }].slice(-30)
        : filteredSnaps;
      if (hasAnyGrade) setGS(newSnaps);
      try {
        const r = await window.storage.get(SK.PROG(user), true);
        const existing = r?.value ? JSON.parse(r.value) : {};
        await window.storage.set(
          SK.PROG(user),
          JSON.stringify({
            ...existing,
            fcHist,
            stats,
            activityDates: [...activityDates],
            activityCounts,
            gradeSnapshots: newSnaps,
          }),
          true,
        );
      } catch (_) {}
      if (user) {
        const lbKey = "gcse:lb:" + user.replace(/\W/g, "-");
        const streakVal = calcStreak(activityDates);
        const score = streakVal * 10 + activityDates.size * 3 + (stats.qS || 0);
        try {
          const prev = await window.storage.get(lbKey, true);
          const existing = prev?.value ? JSON.parse(prev.value) : {};
          await window.storage.set(
            lbKey,
            JSON.stringify({
              ...existing,
              username: user,
              displayName:
                userDisplayName || existing.displayName || getDisplayName(user),
              score,
            }),
            true,
          );
        } catch (_) {}
      }
    }, 600);
    return () => clearTimeout(saveTimer.current);
  }, [user, userDisplayName, fcHist, stats, activityDates, activityCounts]);
  const handleOnboardingComplete = useCallback(
    async (board, examDate) => {
      setOnboarding(null);

      const newSels = {};
      subjects.forEach((s) => {
        newSels[s.id] = board;
      });
      setBoardSels(newSels);
      await Promise.all(subjects.map((s) => ensureBoardLoaded(s.id, board)));

      try {
        const prog = await window.storage.get(SK.PROG(user), true);
        const existing = prog && prog.value ? JSON.parse(prog.value) : {};
        await window.storage.set(
          SK.PROG(user),
          JSON.stringify({ ...existing, boardSels: newSels }),
          true,
        );
      } catch (_) {}

      if (examDate) {
        try {
          const r = await window.storage.get(SK.TIMETABLE(user));
          const tt = r && r.value ? JSON.parse(r.value) : [];
          const newEntry = {
            id: "onb-" + Date.now(),
            type: "exam",
            title: "MainExams",
            date: examDate,
            subjectId: null,
          };
          await window.storage.set(
            SK.TIMETABLE(user),
            JSON.stringify([...tt, newEntry]),
          );
        } catch (_) {}
      }
    },
    [user, subjects, ensureBoardLoaded],
  );
  const handleSubjectSelectionComplete = useCallback(
    async (selIds, boardMap) => {
      setShowSubjectSelection(false);
      if (selIds === null) return;
      setSelectedSubjectIds(selIds);
      trackEvent("subjects_selected", { value: selIds?.length });

      if (boardMap && Object.keys(boardMap).length > 0) {
        setBoardSels((prev) => ({ ...prev, ...boardMap }));

        await Promise.all(
          Object.entries(boardMap).map(([sId, b]) => ensureBoardLoaded(sId, b)),
        );
      }

      try {
        const r = await window.storage.get(SK.PREFS(user), true);
        const existing = r?.value ? JSON.parse(r.value) : {};
        const mergedBoards = {
          ...(existing.boardSels || {}),
          ...(boardMap || {}),
        };
        await window.storage.set(
          SK.PREFS(user),
          JSON.stringify({
            ...existing,
            selectedSubjectIds: selIds,
            boardSels: mergedBoards,
          }),
          true,
        );
      } catch (_) {}
    },
    [user, ensureBoardLoaded],
  );
  const handleSearchNavigate = useCallback(
    (result) => {
      const { subj, sec, tab: secTab } = result;
      if (!subj || !sec) return;
      const si = subjects.findIndex((s) => s.id === subj.id);
      if (si < 0) return;

      setSubIdx(si);
      const b = boardSels[subj.id] || DEFAULT_BOARD;
      ensureBoardLoaded(subj.id, b).then(() => {
        const bd = boardData[subj.id + ":" + b] || {
          custom: [],
          extras: {},
          papers: [],
        };
        const merged = mergeTopics(subj.topics || [], bd.custom, bd.extras);
        const ti = merged.findIndex((t) =>
          t.sections.some((s) => s.id === sec.id),
        );
        if (ti < 0) return;
        setTopIdx(ti);
        setSecId(sec.id);
        setTab(secTab || "notes");
        setFcIdx(0);
        setFlip(false);
        setQIdx(0);
        setQRes(null);
        setSelOpt(null);
        setTA("");
        setSubjTab("sections");
        setScreen("section");
        trackEvent("screen_view", { screen: "section" });
      });
    },
    [subjects, boardSels, boardData, ensureBoardLoaded],
  );

  const findCustomOwner = (custom, sectionId) => {
    const top = (custom || []).find((cs) => cs.id === sectionId);
    if (top) return { type: "top", cs: top };
    for (const cs of custom || []) {
      const st = (cs.subtopics || []).find((s) => s.id === sectionId);
      if (st) return { type: "sub", cs, st };
    }
    return null;
  };
  const addToSection = (sectionId, key, item) => {
    if (!subjDef) return;
    const sId = subjDef.id,
      b = curBoard;
    setBoardData((prev) => {
      const cur = prev[`${sId}:${b}`] || { custom: [], extras: {}, papers: [] };
      const owner = findCustomOwner(cur.custom, sectionId);
      let next;
      if (owner?.type === "top") {
        next = {
          ...cur,
          custom: cur.custom.map((cs) =>
            cs.id !== sectionId
              ? cs
              : { ...cs, [key]: [...(cs[key] || []), item] },
          ),
        };
        window.storage
          .set(SK.CUSTOM(sId, b), JSON.stringify(next.custom), true)
          .catch(() => {});
      } else if (owner?.type === "sub") {
        next = {
          ...cur,
          custom: cur.custom.map((cs) =>
            cs.id !== owner.cs.id
              ? cs
              : {
                  ...cs,
                  subtopics: (cs.subtopics || []).map((st) =>
                    st.id !== sectionId
                      ? st
                      : { ...st, [key]: [...(st[key] || []), item] },
                  ),
                },
          ),
        };
        window.storage
          .set(SK.CUSTOM(sId, b), JSON.stringify(next.custom), true)
          .catch(() => {});
      } else {
        const ne = {
          ...cur.extras,
          [sectionId]: {
            ...cur.extras[sectionId],
            [key]: [...(cur.extras[sectionId]?.[key] || []), item],
          },
        };
        next = { ...cur, extras: ne };
        window.storage
          .set(SK.EXTRAS(sId, b), JSON.stringify(ne), true)
          .catch(() => {});
      }
      return { ...prev, [`${sId}:${b}`]: next };
    });
    showToast("✓ Saved");
    setModal(null);
  };
  const editInSection = (sectionId, key, item) => {
    if (!subjDef) return;
    const sId = subjDef.id,
      b = curBoard;
    setBoardData((prev) => {
      const cur = prev[`${sId}:${b}`] || { custom: [], extras: {}, papers: [] };
      const owner = findCustomOwner(cur.custom, sectionId);
      let next;
      if (owner?.type === "top") {
        next = {
          ...cur,
          custom: cur.custom.map((cs) =>
            cs.id !== sectionId
              ? cs
              : {
                  ...cs,
                  [key]: (cs[key] || []).map((x) =>
                    x.id === item.id ? item : x,
                  ),
                },
          ),
        };
        window.storage
          .set(SK.CUSTOM(sId, b), JSON.stringify(next.custom), true)
          .catch(() => {});
      } else if (owner?.type === "sub") {
        next = {
          ...cur,
          custom: cur.custom.map((cs) =>
            cs.id !== owner.cs.id
              ? cs
              : {
                  ...cs,
                  subtopics: (cs.subtopics || []).map((st) =>
                    st.id !== sectionId
                      ? st
                      : {
                          ...st,
                          [key]: (st[key] || []).map((x) =>
                            x.id === item.id ? item : x,
                          ),
                        },
                  ),
                },
          ),
        };
        window.storage
          .set(SK.CUSTOM(sId, b), JSON.stringify(next.custom), true)
          .catch(() => {});
      } else {
        const ne = {
          ...cur.extras,
          [sectionId]: {
            ...cur.extras[sectionId],
            [key]: (cur.extras[sectionId]?.[key] || []).map((x) =>
              x.id === item.id ? item : x,
            ),
          },
        };
        next = { ...cur, extras: ne };
        window.storage
          .set(SK.EXTRAS(sId, b), JSON.stringify(ne), true)
          .catch(() => {});
      }
      return { ...prev, [`${sId}:${b}`]: next };
    });
    setModal(null);
  };

  const removeExtra = (sectionId, key, itemId) => {
    const sId = subjDef.id,
      b = curBoard;
    setBoardData((prev) => {
      const cur = prev[`${sId}:${b}`] || { custom: [], extras: {}, papers: [] };
      const owner = findCustomOwner(cur.custom, sectionId);
      let next;
      if (owner?.type === "top") {
        next = {
          ...cur,
          custom: cur.custom.map((cs) =>
            cs.id !== sectionId
              ? cs
              : {
                  ...cs,
                  [key]: (cs[key] || []).filter((x) => x.id !== itemId),
                },
          ),
        };
        window.storage
          .set(SK.CUSTOM(sId, b), JSON.stringify(next.custom), true)
          .catch(() => {});
      } else if (owner?.type === "sub") {
        next = {
          ...cur,
          custom: cur.custom.map((cs) =>
            cs.id !== owner.cs.id
              ? cs
              : {
                  ...cs,
                  subtopics: (cs.subtopics || []).map((st) =>
                    st.id !== sectionId
                      ? st
                      : {
                          ...st,
                          [key]: (st[key] || []).filter((x) => x.id !== itemId),
                        },
                  ),
                },
          ),
        };
        window.storage
          .set(SK.CUSTOM(sId, b), JSON.stringify(next.custom), true)
          .catch(() => {});
      } else {
        const ne = {
          ...cur.extras,
          [sectionId]: {
            ...cur.extras[sectionId],
            [key]: (cur.extras[sectionId]?.[key] || []).filter(
              (x) => x.id !== itemId,
            ),
          },
        };
        next = { ...cur, extras: ne };
        window.storage
          .set(SK.EXTRAS(sId, b), JSON.stringify(ne), true)
          .catch(() => {});
      }
      return { ...prev, [`${sId}:${b}`]: next };
    });
  };
  const addCustomSection = (sec) => {
    const sId = sec.subjectId || subjDef?.id;
    if (!sId) return;
    const b = boardSels[sId] || DEFAULT_BOARD;
    const cur = getBD(sId, b);
    saveBD(sId, b, {
      custom: [...cur.custom, { ...sec, subtopics: sec.subtopics || [] }],
    });
    setModal(null);
  };
  const addSubtopic = (parentTopicId, subtopic) => {
    if (!subjDef) return;
    const sId = subjDef.id,
      b = curBoard;
    setBoardData((prev) => {
      const cur = prev[`${sId}:${b}`] || { custom: [], extras: {}, papers: [] };
      const next = {
        ...cur,
        custom: cur.custom.map((cs) =>
          cs.id !== parentTopicId
            ? cs
            : { ...cs, subtopics: [...(cs.subtopics || []), subtopic] },
        ),
      };

      window.storage
        .set(SK.CUSTOM(sId, b), JSON.stringify(next.custom), true)
        .catch(() => {});
      return { ...prev, [`${sId}:${b}`]: next };
    });
    setModal(null);
  };
  const deleteSubtopic = (parentTopicId, subtopicId) => {
    if (!subjDef) return;
    const sId = subjDef.id,
      b = curBoard;
    setBoardData((prev) => {
      const cur = prev[`${sId}:${b}`] || { custom: [], extras: {}, papers: [] };
      const next = {
        ...cur,
        custom: cur.custom.map((cs) =>
          cs.id !== parentTopicId
            ? cs
            : {
                ...cs,
                subtopics: (cs.subtopics || []).filter(
                  (st) => st.id !== subtopicId,
                ),
              },
        ),
      };
      window.storage
        .set(SK.CUSTOM(sId, b), JSON.stringify(next.custom), true)
        .catch(() => {});
      return { ...prev, [`${sId}:${b}`]: next };
    });
    if (secId === subtopicId) {
      setScreen("subject");
      setSecId(null);
    }
  };
  const deleteCustomSec = (sId) => {
    const b = curBoard;
    setBoardData((prev) => {
      const cur = prev[`${subjDef.id}:${b}`] || {
        custom: [],
        extras: {},
        papers: [],
      };
      const next = { ...cur, custom: cur.custom.filter((cs) => cs.id !== sId) };
      window.storage
        .set(SK.CUSTOM(subjDef.id, b), JSON.stringify(next.custom), true)
        .catch(() => {});
      return { ...prev, [`${subjDef.id}:${b}`]: next };
    });
    if (secId === sId) {
      setScreen("subject");
      setSecId(null);
    }
  };

  const renameCustomTopic = (topicId, newTitle) => {
    if (!subjDef || !newTitle.trim()) return;
    const sId = subjDef.id,
      b = curBoard;
    setBoardData((prev) => {
      const cur = prev[sId + ":" + b] || { custom: [], extras: {}, papers: [] };
      const next = {
        ...cur,
        custom: cur.custom.map((cs) => {
          if (cs.id === topicId) return { ...cs, title: newTitle.trim() };
          return cs;
        }),
      };
      window.storage
        .set(SK.CUSTOM(sId, b), JSON.stringify(next.custom), true)
        .catch(() => {});
      return { ...prev, [sId + ":" + b]: next };
    });
  };
  const renameCustomSubtopic = (parentTopicId, subtopicId, newTitle) => {
    if (!subjDef || !newTitle.trim()) return;
    const sId = subjDef.id,
      b = curBoard;
    setBoardData((prev) => {
      const cur = prev[sId + ":" + b] || { custom: [], extras: {}, papers: [] };
      const next = {
        ...cur,
        custom: cur.custom.map((cs) => {
          if (cs.id !== parentTopicId) return cs;
          return {
            ...cs,
            subtopics: (cs.subtopics || []).map((st) =>
              st.id === subtopicId ? { ...st, title: newTitle.trim() } : st,
            ),
          };
        }),
      };
      window.storage
        .set(SK.CUSTOM(sId, b), JSON.stringify(next.custom), true)
        .catch(() => {});
      return { ...prev, [sId + ":" + b]: next };
    });
  };
  const addPaper = (paper) => {
    const cur = getBD(subjDef.id, curBoard);
    saveBD(subjDef.id, curBoard, { papers: [...cur.papers, paper] });
    setModal(null);
  };
  const deletePaper = (id) => {
    const cur = getBD(subjDef.id, curBoard);
    saveBD(subjDef.id, curBoard, {
      papers: cur.papers.filter((p) => p.id !== id),
    });
  };
  const navToSection = (si, ti, sId) => {
    try {
      const s = subjects[si];
      const graph = JSON.parse(
        localStorage.getItem(SK_GRAPH(user, s?.id)) ||
          '{"nodes":[],"edges":[]}',
      );
      const mastery = {};
      allSections
        .filter((x) => x.subjectId === s?.id)
        .forEach(function (sec) {
          const m = calculateMastery(sec.subjectId, allSections, fcHist, stats);
          mastery[sec.id] = Math.round(
            (m.flashcardMastery + m.questionAccuracy) / 2,
          );
        });
      const unmet = checkPrerequisites(graph, sId, mastery, 60);
      if (unmet.length) {
        setPrereqModal({ from: unmet[0], to: sId, si, ti });
        return;
      }
    } catch (_) {}
    setSubIdx(si);
    setTopIdx(ti);
    setSecId(sId);
    setTab("notes");
    setFcIdx(0);
    setFlip(false);
    setQIdx(0);
    setQRes(null);
    setSelOpt(null);
    setTA("");
    setSmMdl(false);
    setNoteSearch("");
    setShuffledCards(null);
    setFcConf(null);
    setFcHintLvl(0);
    setFcSelfExp("");
    setFcSelfOpen(false);
    setQConf(null);
    setQHintLvl(0);
    setQSelfExp("");
    setQSelfDone(false);
    setLabelTestMode(false);
    setLabelTestComplete(false);
    setGoalModalShownThisTab(false);
    setShowGoalModal(false);
    setShowReflection(false);
    setScreen("section");
  };

  const selectBoard = async (b) => {
    if (!subjDef) return;
    setBoardSels((s) => ({ ...s, [subjDef.id]: b }));
    await ensureBoardLoaded(subjDef.id, b);
  };
  const bg = D ? "#0a0a14" : "#f9fafb",
    bd2 = D ? "#262844" : "#e5e7eb";
  const focusModeCards =
    section && section.flashcards && section.flashcards.length
      ? section.flashcards
      : subjDef
        ? allSections
            .filter((s) => s.subjectId === subjDef.id)
            .reduce((acc, s) => acc.concat(s.flashcards || []), [])
        : allSections.reduce((acc, s) => acc.concat(s.flashcards || []), []);
  const _goEl = (
    <>
    <GlobalOverlays
      D={D}
      online={online}
      shortcutModal={shortcutModal}
      setShortcutModal={setShortcutModal}
      searchOpen={searchOpen}
      setSearchOpen={setSearchOpen}
      onboarding={onboarding}
      handleOnboardingComplete={handleOnboardingComplete}
      subjects={subjects}
      allSections={allSections}
      boardData={boardData}
      boardSels={boardSels}
      handleSearchNavigate={handleSearchNavigate}
      screen={screen}
      onHome={() => setScreen("home")}
      onMock={() => setScreen("mock")}
      onTutor={() => {
        setTutorSubjId(null);
        setScreen("tutor");
      }}
      onTimetable={() => setScreen("timetable")}
      onDash={() => setScreen("dashboard")}
      onLeaderboards={() => setScreen("friends")}
      streak={streak}
    />
    {focusMode && (
      <ErrorBoundary D={D} label="Couldn't load Focus Mode" resetLabel="Exit Focus Mode" onReset={() => setFocusMode(false)}>
        <FocusMode
          D={D}
          cards={focusModeCards}
          section={section}
          subj={subjDef}
          fcHist={fcHist}
          onExit={() => setFocusMode(false)}
        />
      </ErrorBoundary>
    )}
    </>
  );
  const hProps = {
    user,
    userDisplayName,
    D,
    onDark: () => setD(!D),
    onHome: () => setScreen("home"),
    onDash: () => {
      setScreen("dashboard");
      trackEvent("screen_view", { screen: "dashboard" });
    },
    onTarget: () => {
      setTTSubj(null);
      setScreen("target");
      trackEvent("screen_view", { screen: "target" });
    },
    onTimetable: () => setScreen("timetable"),
    onBlurt: () => {
      setBlurtSubjId(null);
      setBlurtSecId2(null);
      setScreen("blurting");
      trackEvent("screen_view", { screen: "blurting" });
    },
    onMock: () => {
      setScreen("mock");
      trackEvent("screen_view", { screen: "mock" });
    },
    onTutor: () => {
      setTutorSubjId(null);
      setCoachMode("tutor");
      setScreen("coach");
      trackEvent("screen_view", { screen: "coach" });
    },
    onCoach: () => {
      setCoachMode("exam");
      setScreen("coach");
      trackEvent("screen_view", { screen: "coach" });
    },
    onStudy: () => setScreen("study"),
    onLeaderboards: () => setScreen("friends"),
    onAccount: () => setScreen("account"),
    onContact: () => setScreen("contact"),
    onFocus: () => setFocusMode(true),
    streak,
    onSearch: () => setSearchOpen(true),
    globalOverlays: _goEl,
    screen,
  };
  const goToGoal = (goal) => {
    if (!goal) return;
    logEvent("session_start", {
      blockKind: goal.blockKind,
      subjectId: goal.route ? goal.route.subjectId : null,
      sectionId: goal.route ? goal.route.sectionId : null,
    });
    if (goal.action && goal.action.type === "editSubjects") {
      setShowSubjectSelection(true);
      setScreen("account");
      return;
    }
    if (goal.route) {
      const mode = goal.route.mode;
      openSessionBlock({
        type:
          mode === "questions"
            ? "questions"
            : mode === "flashcards"
              ? "flashcards"
              : mode === "mock"
                ? "mock"
                : "blurting",
        subjectId: goal.route.subjectId,
        sectionId: goal.route.sectionId,
      });
      return;
    }
    if (goal.screen) setScreen(goal.screen);
  };
  const openSessionBlock = (block) => {
    if (!block) return;
    if (block.type === "mock") {
      setScreen("mock");
      return;
    }
    if (block.type === "blurting") {
      setBlurtSubjId(block.subjectId || null);
      setBlurtSecId2(block.sectionId || null);
      setScreen("blurting");
      return;
    }
    if (block.type === "flashcards" || block.type === "questions") {
      const sec = allSections.find((s) => s.id === block.sectionId);
      if (!sec) {
        setScreen("home");
        return;
      }
      const si = subjects.findIndex((s) => s.id === sec.subjectId);
      if (si < 0) {
        setScreen("home");
        return;
      }
      const b = boardSels[subjects[si].id] || DEFAULT_BOARD;
      ensureBoardLoaded(subjects[si].id, b).then(function () {
        const bd = boardData[subjects[si].id + ":" + b] || {
          custom: [],
          extras: {},
          papers: [],
        };

        const merged = mergeTopics(
          subjects[si].topics || [],
          bd.custom,
          bd.extras,
        );
        const ti = merged.findIndex((t) =>
          t.sections.some((s) => s.id === sec.id),
        );
        if (ti < 0) return;
        setSubIdx(si);
        setTopIdx(ti);
        setSecId(sec.id);
        setTab(block.type === "questions" ? "questions" : "flashcards");
        setScreen("section");
      });
    }
  };

  if (showSubjectSelection && user && screen !== "login")
    return (
      <SubjectSelectionScreen
        D={D}
        initialSelected={selectedSubjectIds || []}
        initialBoardSels={boardSels}
        isEditing={!!(selectedSubjectIds && selectedSubjectIds.length > 0)}
        onComplete={handleSubjectSelectionComplete}
      />
    );
  if (screen === "login") {
    const idTrim = nameIn.trim();
    const idLower = idTrim.toLowerCase();

    const isEmail = idLower.indexOf("@") !== -1;
    const emailOk = isEmail && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(idLower);
    const uClean = idTrim.trim();
    const usernameOk =
      !isEmail &&
      uClean.length >= 3 &&
      uClean.length <= 30 &&
      /^[a-zA-Z0-9_ ]+$/.test(uClean);
    const idOk = emailOk || usernameOk;
    const passOk = passIn.length >= 4 && passIn.length <= 30;

    const signupIdOk =
      authMode === "signup" ? (isEmail ? emailOk : usernameOk) : idOk;
    const canSubmit = signupIdOk && passOk;
    const handleAuth = () => {
      if (!canSubmit) return;

      const u = isEmail ? idLower : idTrim.trim().replace(/ +/g, " ");
      const dn = displayNameIn.trim() || getDisplayName(u);
      if (authMode === "signup") {
        if (accounts[u]) {
          setAuthE(
            "An account with that " +
              (isEmail ? "email" : "username") +
              " alreadyexists.",
          );
          return;
        }
        const gki = (Object.keys(accounts).length % 10) + 1;
        const n = {
          ...accounts,
          [u]: { h: hashPw(passIn), gki, displayName: dn },
        };
        setAccs(n);
        saveAccounts(n);
        setGK("");
        setUserDisplayName(dn);
        if (schoolIn.trim()) {
          const lbKey = "gcse:lb:" + u.replace(/\W/g, "-");
          window.storage
            .set(
              lbKey,
              JSON.stringify({
                username: u,
                displayName: dn,
                school: schoolIn.trim(),
                score: 0,
              }),
              true,
            )
            .catch(() => {});
          setUserSchool(schoolIn.trim());
        }
        setUser(u);
        setScreen("home");
        setAuthE("");
        setShowPass(false);
        setDNIn("");
      } else {
        var matchKey = null;
        if (accounts[u]) {
          matchKey = u;
        } else {
          var lower = u.toLowerCase();
          var allKeys = Object.keys(accounts);
          for (var ki = 0; ki < allKeys.length; ki++) {
            if (allKeys[ki].toLowerCase() === lower) {
              matchKey = allKeys[ki];
              break;
            }
          }
        }
        if (!matchKey) {
          setAuthE("No account found. Check spelling or sign up.");
          return;
        }
        if (getAccHash(accounts[matchKey]) !== hashPw(passIn)) {
          setAuthE("Incorrectpassword.");
          return;
        }
        boardLoadedRef.current = {};
        setGK("");
        const storedDN =
          getAccDisplayName(accounts[matchKey]) || getDisplayName(matchKey);
        setUserDisplayName(storedDN);
        if (matchKey === ADMIN_USER) {
          setUserSchool(ADMIN_SCHOOL);
        } else {
          const lbKey = "gcse:lb:" + matchKey.replace(/\W/g, "-");
          window.storage
            .get(lbKey, true)
            .then(function (r) {
              if (r && r.value) {
                try {
                  var e = JSON.parse(r.value);
                  if (e.school) setUserSchool(e.school);
                  if (!e.displayName && storedDN) {
                    window.storage
                      .set(
                        lbKey,
                        JSON.stringify({ ...e, displayName: storedDN }),
                        true,
                      )
                      .catch(function () {});
                  }
                } catch (ex) {}
              }
            })
            .catch(function () {});
        }
        setUser(matchKey);
        setScreen("home");
        setAuthE("");
        setShowPass(false);
      }
    };
    var idPlaceholder =
      authMode === "signup"
        ? "Username or email (optional email)"
        : "Email or username";
    var idHint =
      authMode === "signup"
        ? isEmail
          ? emailOk
            ? ""
            : "Enter a valid email"
          : !uClean
            ? ""
            : "3-30 chars,letters/numbers/spaces allowed"
        : "";
    return (
      <div
        style={{
          minHeight: "100vh",
          background: D ? "radial-gradient(1200px 820px at 12% -12%, rgba(var(--riq-accent-rgb),.20), transparent 60%), radial-gradient(1000px 720px at 102% 4%, rgba(var(--riq-primary-3-rgb),.14), transparent 55%), radial-gradient(900px 700px at 50% 120%, rgba(59,130,246,.10), transparent 55%), #0a0a14" : "radial-gradient(1100px 780px at 10% -10%, rgba(var(--riq-accent-rgb),.10), transparent 60%), radial-gradient(940px 660px at 104% 2%, rgba(var(--riq-primary-3-rgb),.08), transparent 55%), radial-gradient(820px 640px at 50% 116%, rgba(59,130,246,.06), transparent 55%), #f6f6fc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div
          style={{
            ...C(D),
            width: "100%",
            maxWidth: 400,
            padding: 40,
            boxShadow: "0 25px 60px rgba(0,0,0,.12)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🧠</div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: tx(D),
                marginBottom: 4,
              }}
            >
              ReviseIQ
            </h1>
            <p style={{ fontSize: 12, color: mu(D) }}>
              {ALL_SUBJECTS.length} subjects · AI-powered revision
            </p>
          </div>
          <div
            style={{
              display: "flex",
              background: D ? "#191a2b" : "#f3f4f6",
              borderRadius: 10,
              padding: 3,
              marginBottom: 22,
              gap: 3,
            }}
          >
            {["login", "signup"].map(function (m) {
              return (
                <button
                  key={m}
                  onClick={function () {
                    setAM(m);
                    setAuthE("");
                  }}
                  style={{
                    flex: 1,
                    padding: "9px 0",
                    borderRadius: 8,
                    border: "none",
                    background:
                      authMode === m ? (D ? "#374151" : "#fff") : "transparent",
                    fontWeight: authMode === m ? 600 : 400,
                    fontSize: 13,
                    cursor: "pointer",
                    color: authMode === m ? tx(D) : mu(D),
                    transition: "all .15s",
                    boxShadow:
                      authMode === m ? "0 1px 4px rgba(0,0,0,.08)" : "none",
                  }}
                >
                  {m === "login" ? "Log In" : "Sign Up"}
                </button>
              );
            })}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <div>
              <input
                style={I(D)}
                placeholder={idPlaceholder}
                value={nameIn}
                onChange={function (e) {
                  setNameIn(e.target.value);
                  setAuthE("");
                }}
                onKeyDown={function (e) {
                  if (e.key === "Enter") handleAuth();
                }}
                autoCapitalize="off"
                autoCorrect="off"
                autoComplete="username"
                spellCheck="false"
              />
              {idHint && idTrim && (
                <p
                  style={{
                    fontSize: 11,
                    color: "#f59e0b",
                    marginTop: 3,
                    marginLeft: 2,
                  }}
                >
                  {idHint}
                </p>
              )}
            </div>
            {authMode === "signup" && (
              <input
                style={I(D)}
                placeholder="Display name (shown on leaderboard)"
                value={displayNameIn}
                onChange={function (e) {
                  setDNIn(e.target.value);
                }}
                onKeyDown={function (e) {
                  if (e.key === "Enter") handleAuth();
                }}
              />
            )}
            <input
              type="password"
              style={I(D)}
              placeholder="Password (4–30 characters)"
              value={passIn}
              maxLength={30}
              onChange={function (e) {
                setPassIn(e.target.value);
                setAuthE("");
              }}
              onKeyDown={function (e) {
                if (e.key === "Enter") handleAuth();
              }}
            />
            {authMode === "signup" && (
              <input
                style={I(D)}
                placeholder="School (optional — for leaderboard)"
                value={schoolIn}
                onChange={function (e) {
                  setSchIn(e.target.value);
                }}
                onKeyDown={function (e) {
                  if (e.key === "Enter") handleAuth();
                }}
              />
            )}
          </div>

          {authErr && (
            <p
              style={{
                fontSize: 12,
                color: "#ef4444",
                marginBottom: 10,
                textAlign: "center",
                background: D ? "rgba(239,68,68,.1)" : "#fef2f2",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #fca5a5",
              }}
            >
              {authErr}
            </p>
          )}
          <button
            disabled={!canSubmit}
            onClick={handleAuth}
            style={{
              width: "100%",
              background: canSubmit ? "var(--riq-accent)" : "#d1d5db",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "13px 0",
              fontSize: 14,
              fontWeight: 700,
              cursor: canSubmit ? "pointer" : "default",
              transition: "background .2s",
              letterSpacing: "0.02em",
            }}
          >
            {authMode === "login" ? "Log In →" : "Create Account →"}
          </button>
          {authMode === "login" && (
            <p
              style={{
                fontSize: 11,
                color: mu(D),
                textAlign: "center",
                marginTop: 10,
              }}
            >
              No account? Switch to Sign Up above.
            </p>
          )}
          <div
            style={{
              marginTop: 16,
              display: "flex",
              gap: 5,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {ALL_SUBJECTS.map(function (s) {
              return (
                <span
                  key={s.id}
                  style={{
                    fontSize: 11,
                    color: mu(D),
                    background: D ? "#191a2b" : "#f3f4f6",
                    padding: "2px 8px",
                    borderRadius: 20,
                  }}
                >
                  {s.icon}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
  if (screen === "timetable") {
    const handleTimetableNav = (act) => {
      if (act.navType === "target") {
        const si = subjects.findIndex((s) => s.id === act.subjectId);
        setTTSubj(si >= 0 ? si : null);
        setScreen("target");
      } else if (act.navType === "blurt") {
        setBlurtSubjId(act.subjectId || null);
        setBlurtSecId2(act.sectionId || null);
        setScreen("blurting");
      } else if (act.navType === "section" && act.sectionId) {
        const si = subjects.findIndex((s) => s.id === act.subjectId);
        if (si >= 0) {
          const b = boardSels[subjects[si].id] || DEFAULT_BOARD;
          const bdata = boardData[`${subjects[si].id}:${b}`] || {
            custom: [],
            extras: {},
            papers: [],
          };
          const merged = mergeTopics(
            subjects[si].topics || [],
            bdata.custom,
            bdata.extras,
          );
          let ti = -1;
          for (let t = 0; t < merged.length; t++) {
            if (merged[t].sections.find((s) => s.id === act.sectionId)) {
              ti = t;
              break;
            }
          }
          if (ti >= 0) {
            setSubIdx(si);
            setTopIdx(ti);
            setSecId(act.sectionId);
            setTab(act.navTab || "notes");
            setFcIdx(0);
            setFlip(false);
            setQIdx(0);
            setQRes(null);
            setSelOpt(null);
            setTA("");
            setSmMdl(false);
            setScreen("section");
          }
        }
      }
    };
    return (
      <>
        <Header {...hProps} />
        <TimetableScreen
          D={D}
          subjects={subjects}
          allSections={allSections}
          user={user}
          stats={stats}
          onNav={handleTimetableNav}
          onBack={() => setScreen("home")}
        />
      </>
    );
  }
  if (screen === "practice" && todaySession) {
    return (
      <PracticeSessionScreen
        D={D}
        session={todaySession}
        onBack={() => setScreen("home")}
        onOpenBlock={openSessionBlock}
        onComplete={() =>
          showToast("Great work — guided session complete!", "success")
        }
        onReset={() => {
          const plan = buildTodaySessionPlan({
            subjects,
            allSections,
            stats,
            fcHist,
            timetableExams,
          });

          buildAIPersonalisedSession(pedCtx, allSections, stats, fcHist, plan)
            .then(function (aiPlan) {
              setTodaySession(aiPlan);
            })
            .catch(function () {
              setTodaySession(plan);
            });
          setTodaySession(plan);
          showToast("Session regenerated");
        }}
      />
    );
  }
  if (screen === "blurting")
    return (
      <>
        <Header {...hProps} />
        <BlurtingScreen
          D={D}
          subjects={subjects}
          allSections={allSections}
          initSubjId={blurtSubjId}
          initSecId={blurtSecId2}
          onBack={() => setScreen("home")}
        />
      </>
    );
  if (screen === "mock")
    return (
      <>
        <Header {...hProps} />
        <MockExamScreen
          user={user}
          D={D}
          subjects={subjects.filter(function (s) {
            return !s._politics;
          })}
          allSections={allSections}
          boardSels={boardSels}
          boardData={boardData}
          onBack={() => setScreen("home")}
          onMarkActivity={markTodayActive}
        />
      </>
    );

  if (screen === "tutor")
    return (
      <>
        <Header {...hProps} />
        <AITutorScreen
          D={D}
          subjects={subjects}
          allSections={allSections}
          boardSels={boardSels}
          boardData={boardData}
          user={user}
          googleKey={userGoogleKey}
          calibrationData={calibrationData}
          stats={stats}
          onBack={() => setScreen("home")}
        />
      </>
    );
  if (screen === "coach") {
    return (
      <>
        <Header {...hProps} />
        <AITutorScreen
          D={D}
          subjects={subjects}
          allSections={allSections}
          boardSels={boardSels}
          boardData={boardData}
          user={user}
          googleKey={userGoogleKey}
          calibrationData={calibrationData}
          stats={stats}
          onBack={() => setScreen("home")}
        />
      </>
    );
  }
  if (screen === "contact")
    return (
      <ContactScreen
        D={D}
        user={user}
        isAdmin={admin}
        onBack={() => setScreen("home")}
      />
    );
  if (screen === "account")
    return (
      <AccountScreen
        D={D}
        user={user}
        userDisplayName={userDisplayName}
        userSchool={userSchool}
        accounts={accounts}
        selectedSubjectIds={selectedSubjectIds || []}
        boardSels={boardSels}
        achievements={achievements}
        reportData={{
          streak: streak,
          totalDaysStudied: totalDaysStudied,
          questionsAttempted: stats?.qM || 0,
          weakestTopics: Object.entries(stats?.weakQ || {})
            .sort((a, b) => (b[1]?.wrong || 0) - (a[1]?.wrong || 0))
            .slice(0, 5)
            .map((x) => x[0]),
          readinessScore: Math.round(
            ((stats?.fcT ? ((stats.fcC || 0) / (stats.fcT || 1)) * 100 : 40) +
              (stats?.qM ? ((stats.qS || 0) / (stats.qM || 1)) * 100 : 40)) /
              2,
          ),
        }}
        onBack={() => setScreen("home")}
        onEditSubjects={() => setShowSubjectSelection(true)}
        onSave={function (changes) {
          var updatedDN = changes.displayName || userDisplayName;
          var updatedSchool = changes.school;

          if (changes.displayName !== undefined) {
            setUserDisplayName(changes.displayName);
            var accs2 = {
              ...accounts,
              [user]: { ...accounts[user], displayName: changes.displayName },
            };

            setAccs(accs2);
            saveAccounts(accs2);
          }

          if (changes.newPassword) {
            var accs3 = {
              ...accounts,
              [user]: { ...accounts[user], h: hashPw(changes.newPassword) },
            };
            setAccs(accs3);
            saveAccounts(accs3);
          }

          if (changes.school !== undefined) {
            setUserSchool(changes.school);
            var lbKey = "gcse:lb:" + user.replace(/\W/g, "-");
            window.storage
              .get(lbKey, true)
              .then(function (r) {
                var existing = {};
                try {
                  if (r && r.value) existing = JSON.parse(r.value);
                } catch (e) {}
                window.storage
                  .set(
                    lbKey,
                    JSON.stringify({
                      ...existing,
                      school: changes.school,
                      displayName: updatedDN,
                      username: user,
                    }),
                    true,
                  )
                  .catch(function () {});
              })
              .catch(function () {});
          }
        }}
      />
    );
  if (screen === "friends")
    return (
      <div
        style={{ minHeight: "100vh", background: bg, color: tx(D) }}
        className="fade-in"
      >
        <Header {...hProps} />
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 24px" }}>
          <button
            onClick={() => setScreen("home")}
            style={{
              fontSize: 13,
              color: mu(D),
              background: "none",
              border: "none",
              cursor: "pointer",
              marginBottom: 20,
            }}
          >
            {" "}
            Home
          </button>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
            Leaderboards
          </h2>
          <p style={{ fontSize: 13, color: mu(D), marginBottom: 24 }}>
            See how you rank at your school and with friends
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ ...C(D), padding: 22 }}>
              <GlobalLeaderboard user={user} D={D} />
              <SchoolLeaderboard user={user} school={userSchool} D={D} />
              {!userSchool && (
                <p style={{ fontSize: 12, color: mu(D), marginTop: 10 }}>
                  You can add your school in Account Settings.
                </p>
              )}
            </div>
            <div style={{ ...C(D), padding: 22 }}>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  marginBottom: 12,
                  color: tx(D),
                }}
              >
                Friends
              </p>
              <FriendsPanel user={user} D={D} />
            </div>
          </div>
        </div>
      </div>
    );
  if (screen === "study") {
    const _dnk = D ? "#eef1fb" : "#0f1729";
    const _sub = D ? "#9aa3c2" : "#5b6478";
    const _line = D ? "rgba(255,255,255,.09)" : "rgba(16,24,40,.08)";
    const _glass = D ? "rgba(255,255,255,.045)" : "rgba(255,255,255,.72)";
    const _sh = D
      ? "0 20px 50px -34px rgba(0,0,0,.85)"
      : "0 20px 50px -34px rgba(76,29,149,.35)";
    const GRAD = "linear-gradient(120deg,var(--riq-primary),var(--riq-primary-2),var(--riq-primary-3))";
    const studyShell = {
      minHeight: "100vh",
      background: D ? "#0a0a14" : "#f6f7fb",
      color: _dnk,
    };
    const studyWrap = {
      maxWidth: 1100,
      margin: "0 auto",
      padding: "8px 16px 60px",
    };
    const studyH2 = { fontSize: 26, fontWeight: 800, margin: "8px 0 2px" };
    const studyLead = { color: _sub, margin: 0, fontSize: 14 };
    const studyEmpty = { color: _sub, marginTop: 24 };
    const studyName = { fontSize: 16, fontWeight: 800 };
    const studyReady = { fontSize: 12.5, fontWeight: 700, color: _sub };
    const sectionLabel = {
      fontSize: 12,
      fontWeight: 800,
      letterSpacing: ".08em",
      textTransform: "uppercase",
      color: _sub,
      margin: "28px 0 0",
    };
    const grid = {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
      gap: 14,
      marginTop: 14,
    };
    const card = {
      textAlign: "left",
      padding: 18,
      borderRadius: 20,
      border: "1px solid " + _line,
      background: _glass,
      boxShadow: _sh,
      cursor: "pointer",
      display: "flex",
      flexDirection: "column",
      gap: 8,
    };
    const examGrid = {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
      gap: 14,
      marginTop: 14,
    };
    const examCard = {
      textAlign: "left",
      padding: "18px 20px",
      borderRadius: 22,
      border: "1px solid transparent",
      background:
        "linear-gradient(" +
        (D ? "#101024,#101024" : "#ffffff,#ffffff") +
        ") padding-box, " +
        GRAD +
        " border-box",
      boxShadow: _sh,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 16,
      color: _dnk,
    };
    const examIcon = {
      width: 46,
      height: 46,
      borderRadius: 14,
      background: GRAD,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 22,
      flexShrink: 0,
    };
    const examTitle = { fontSize: 16, fontWeight: 800, margin: 0 };
    const examDesc = { fontSize: 12.5, color: _sub, margin: "3px 0 0" };
    const real = subjects.filter((s) => !s._politics);
    const examModes = [
      {
        id: "target",
        icon: "\uD83C\uDFAF",
        title: "Target Tests",
        desc: "Short, focused tests on your weak spots",
        fn: hProps.onTarget,
      },
      {
        id: "mock",
        icon: "\uD83D\uDCDD",
        title: "Mock Exams",
        desc: "Sit a full, timed past paper",
        fn: hProps.onMock,
      },
    ].filter((m) => typeof m.fn === "function");
    return (
      <div style={studyShell} className="fade-in">
        <Header {...hProps} />
        <div style={studyWrap}>
          <h2 style={studyH2}>Study</h2>
          <p style={studyLead}>
            Choose a subject to learn, review flashcards and practise questions —
            or sit a target test or a full mock exam.
          </p>
          <p style={sectionLabel}>Your subjects</p>
          {real.length === 0 ? (
            <p style={studyEmpty}>
              No subjects yet — add some from your Account to start studying.
            </p>
          ) : (
            <div style={grid}>
              {real.map((s) => {
                let readiness = 0;
                try {
                  readiness =
                    calculateExamReadiness(
                      s.id,
                      allSections,
                      fcHist,
                      stats,
                      calibrationData[s.id],
                      timetableExams,
                    )?.score ?? 0;
                } catch (e) {}
                const si = subjects.findIndex((x) => x.id === s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSubIdx(si);
                      setScreen("subject");
                    }}
                    style={card}
                  >
                    <span style={studyName}>
                      {s.icon ? s.icon + " " : ""}
                      {s.name}
                    </span>
                    <span style={studyReady}>{readiness}% exam ready</span>
                  </button>
                );
              })}
            </div>
          )}
          {examModes.length > 0 && (
            <>
              <p style={sectionLabel}>Tests &amp; exams</p>
              <div style={examGrid}>
                {examModes.map((m) => (
                  <button key={m.id} onClick={m.fn} style={examCard}>
                    <span style={examIcon}>{m.icon}</span>
                    <span>
                      <p style={examTitle}>{m.title}</p>
                      <p style={examDesc}>{m.desc}</p>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
  if (screen === "home") return <HomeScreen D={D} activityDates={activityDates} allSections={allSections} boardData={boardData} boardSels={boardSels} calibrationData={calibrationData} engineEvents={engineEvents} ensureBoardLoaded={ensureBoardLoaded} fcHist={fcHist} getBD={getBD} goToGoal={goToGoal} hProps={hProps} setBlurtSecId2={setBlurtSecId2} setBlurtSubjId={setBlurtSubjId} setFcIdx={setFcIdx} setFlip={setFlip} setQIdx={setQIdx} setQRes={setQRes} setScreen={setScreen} setSecId={setSecId} setSelOpt={setSelOpt} setShowTreemap={setShowTreemap} setSubIdx={setSubIdx} setSubjTab={setSubjTab} setTA={setTA} setTab={setTab} setTopIdx={setTopIdx} showTreemap={showTreemap} stats={stats} streak={streak} subjects={subjects} targetGrades={targetGrades} timetableExams={timetableExams} totalDaysStudied={totalDaysStudied} user={user} userDisplayName={userDisplayName} weeklyPlan={weeklyPlan} />;

  if (screen === "subject" && subjDef) return <SubjectScreen D={D} addCustomSection={addCustomSection} addPaper={addPaper} addSubtopic={addSubtopic} admin={admin} allSections={allSections} bd2={bd2} bg={bg} calibrationData={calibrationData} curBData={curBData} curBoard={curBoard} curTopics={curTopics} deleteCustomSec={deleteCustomSec} deletePaper={deletePaper} deleteSubtopic={deleteSubtopic} editingTitle={editingTitle} fcHist={fcHist} hProps={hProps} journalData={journalData} modal={modal} navToSection={navToSection} renameCustomSubtopic={renameCustomSubtopic} renameCustomTopic={renameCustomTopic} setBlurtSecId2={setBlurtSecId2} setBlurtSubjId={setBlurtSubjId} setEditingTitle={setEditingTitle} setFocusMode={setFocusMode} setModal={setModal} setScreen={setScreen} setSubjTab={setSubjTab} setTTSubj={setTTSubj} setTab={setTab} setTargetGrades={setTargetGrades} stats={stats} subIdx={subIdx} subjDef={subjDef} subjTab={subjTab} subjects={subjects} targetGrades={targetGrades} timetableExams={timetableExams} user={user} />;

  if (screen === "section" && section) return <ErrorBoundary D={D} label="Couldn't load this study screen" resetLabel="Back to notes" onReset={() => setTab("notes")}><SectionScreen D={D} addToSection={addToSection} admin={admin} bd2={bd2} bg={bg} cramMode={cramMode} curBData={curBData} curBoard={curBoard} editInSection={editInSection} elabOpen={elabOpen} elabText={elabText} enqueueOffline={enqueueOffline} errorPatternsAll={errorPatternsAll} explainFeedback={explainFeedback} explainText={explainText} fcConf={fcConf} fcHintLvl={fcHintLvl} fcHist={fcHist} fcIdx={fcIdx} fcSelfExp={fcSelfExp} fcSelfOpen={fcSelfOpen} flip={flip} goalModalShownThisTab={goalModalShownThisTab} hProps={hProps} labelTestComplete={labelTestComplete} labelTestMode={labelTestMode} logEvent={logEvent} markTodayActive={markTodayActive} marking={marking} modal={modal} noteSearch={noteSearch} qConf={qConf} qHintLvl={qHintLvl} qIdx={qIdx} qRes={qRes} qSelfDone={qSelfDone} qSelfExp={qSelfExp} removeExtra={removeExtra} runAchievementCheck={runAchievementCheck} section={section} selOpt={selOpt} setCalibrationData={setCalibrationData} setCramMode={setCramMode} setD={setD} setElabOpen={setElabOpen} setElabText={setElabText} setExplainFeedback={setExplainFeedback} setExplainText={setExplainText} setFCH={setFCH} setFcConf={setFcConf} setFcHintLvl={setFcHintLvl} setFcIdx={setFcIdx} setFcSelfExp={setFcSelfExp} setFcSelfOpen={setFcSelfOpen} setFlip={setFlip} setFocusMode={setFocusMode} setGoalModalShownThisTab={setGoalModalShownThisTab} setLabelTestComplete={setLabelTestComplete} setLabelTestMode={setLabelTestMode} setLadderTick={setLadderTick} setMark={setMark} setModal={setModal} setNoteSearch={setNoteSearch} setQConf={setQConf} setQHintLvl={setQHintLvl} setQIdx={setQIdx} setQRes={setQRes} setQSelfDone={setQSelfDone} setQSelfExp={setQSelfExp} setScreen={setScreen} setSelOpt={setSelOpt} setShowGoalModal={setShowGoalModal} setShowReflection={setShowReflection} setShowSketch={setShowSketch} setShuffledCards={setShuffledCards} setSmMdl={setSmMdl} setStats={setStats} setSvgPreview={setSvgPreview} setTA={setTA} setTab={setTab} setTransferQuestion={setTransferQuestion} showGoalModal={showGoalModal} showMdl={showMdl} showSketch={showSketch} shuffledCards={shuffledCards} subjDef={subjDef} subjects={subjects} svgPreview={svgPreview} tab={tab} textAns={textAns} touchStartRef={touchStartRef} transferQuestion={transferQuestion} user={user} /></ErrorBoundary>;
  if (screen === "dashboard") return <DashboardScreen D={D} achievements={achievements} activityCounts={activityCounts} activityDates={activityDates} allSections={allSections} bg={bg} boardData={boardData} boardSels={boardSels} calibrationData={calibrationData} ensureBoardLoaded={ensureBoardLoaded} fcHist={fcHist} gradeSnapshots={gradeSnapshots} hProps={hProps} pedCtx={pedCtx} setScreen={setScreen} setSubIdx={setSubIdx} setSubjTab={setSubjTab} setTTSubj={setTTSubj} setTargetGrades={setTargetGrades} setTimelineSelected={setTimelineSelected} stats={stats} streak={streak} subjects={subjects} targetGrades={targetGrades} timelineSelected={timelineSelected} timetableExams={timetableExams} totalDaysStudied={totalDaysStudied} user={user} />;
  if (screen === "target") return <TargetScreen D={D} bd2={bd2} bg={bg} boardSels={boardSels} getBD={getBD} hProps={hProps} markTodayActive={markTodayActive} setScreen={setScreen} setStats={setStats} setTTI={setTTI} setTTIdx={setTTIdx} setTTMk={setTTMk} setTTRes={setTTRes} setTTSO={setTTSO} setTTSubj={setTTSubj} setTTTA={setTTTA} stats={stats} subjects={subjects} ttIdx={ttIdx} ttItems={ttItems} ttMarking={ttMarking} ttRes={ttRes} ttSelOpt={ttSelOpt} ttSubj={ttSubj} ttTextAns={ttTextAns} />;
  return (
    <>
      {}
      {showGoalModal && (
        <SessionGoalModal
          D={D}
          onStart={(setup) => {
            saveSessionSetup(setup);
          }}
          onSkip={() => {
            setShowGoalModal(false);
            setGoalModalShownThisTab(true);
          }}
        />
      )}
      {}
      {showReflection && screen === "section" && subjDef && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 800,
            padding: "0 16px 16px",
            maxWidth: 680,
            margin: "0 auto",
          }}
        >
          {(function () {
            const _s = section || {};
            const _q = (stats.weakQ && stats.weakQ[_s.id]) || null;
            const _f = (stats.weakFC && stats.weakFC[_s.id]) || null;
            const _qT = _q ? _q.total || 0 : 0;
            const _fT = _f ? _f.total || 0 : 0;
            const _reviewed = _qT + _fT;
            if (!_reviewed) return null;
            const _mins = Math.max(1, Math.round((_qT * 180 + _fT * 30) / 60));
            const _wrong = _q ? _q.wrong || 0 : 0;
            const _acc = _qT ? (_qT - _wrong) / _qT : 1;
            const _nm = _s.name || (subjDef && subjDef.name) || "this topic";
            const _recapWrap = { maxWidth: 460, margin: "0 auto 14px" };
            return (
              <div style={_recapWrap}>
                <SessionRecap D={D} minutes={_mins} reviewed={_reviewed} strengthened={_acc >= 0.7 ? [_nm] : []} shaky={_acc < 0.7 ? [_nm] : []} nextNudge={sessionSetup && sessionSetup.goal ? ("Next: " + sessionSetup.goal) : ("Revisit " + _nm + " in a couple of days to lock it in.")} />
              </div>
            );
          })()}
          <PostSessionReflection
            D={D}
            sessionGoal={sessionSetup?.goal}
            subjectId={subjDef.id}
            onSave={(entry) => {
              saveJournalEntry(subjDef.id, entry);
              runAchievementCheck(null);
            }}
            onSkip={() => setShowReflection(false)}
          />
        </div>
      )}
      {}
      {newAchievement && (
        <AchievementToast
          achievement={newAchievement}
          D={D}
          onClose={() => setNewAchievement(null)}
        />
      )}
      {prereqModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.55)",
            zIndex: 12000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div style={{ ...C(D), padding: 18, maxWidth: 420, width: "100%" }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
              This topic has prerequisites
            </h3>
            <p style={{ fontSize: 13, color: mu(D), marginBottom: 12 }}>
              This topic builds on
              {prereqModal.from}. Review it first?
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => {
                  setSecId(prereqModal.from);
                  setScreen("section");
                  setPrereqModal(null);
                }}
                style={{
                  ...B("var(--riq-accent)", false, { padding: "8px 12px", fontSize: 12 }),
                }}
              >
                Go to prerequisite
              </button>
              <button
                onClick={() => {
                  setSubIdx(prereqModal.si);
                  setTopIdx(prereqModal.ti);
                  setSecId(prereqModal.to);
                  setScreen("section");
                  setPrereqModal(null);
                }}
                style={{
                  ...B("#9ca3af", false, { padding: "8px 12px", fontSize: 12 }),
                }}
              >
                Continue anyway
              </button>
            </div>
          </div>
        </div>
      )}
      {}
      <MobileBottomNav
        screen={screen}
        onHome={() => setScreen("home")}
        onStudy={() => {
          setBlurtSubjId(null);
          setBlurtSecId2(null);
          setScreen("blurting");
        }}
        onProgress={() => setScreen("dashboard")}
        onTutor={() => {
          setTutorSubjId(null);
          setScreen("tutor");
        }}
        D={D}
      />
      <ToastContainer />
      {analyticsData && (
        <div
          onClick={() => setAnalyticsData(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.6)",
            zIndex: 9500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: D ? "#191a2b" : "#fff",
              borderRadius: 16,
              width: 480,
              maxWidth: "96vw",
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 30px 80px rgba(0,0,0,.3)",
            }}
          >
            <div
              style={{
                padding: "18px 22px",
                borderBottom: "1px solid" + (D ? "#374151" : "#e5e7eb"),
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  margin: 0,
                  color: tx(D),
                }}
              >
                Analytics — Last
                {analyticsData.days} day{analyticsData.days !== 1 ? "s" : ""}
              </h2>
              <button
                onClick={() => setAnalyticsData(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 20,
                  cursor: "pointer",
                  color: mu(D),
                }}
              ></button>
            </div>
            <div style={{ padding: "16px 22px", flex: 1, overflowY: "auto" }}>
              <p style={{ fontSize: 13, color: mu(D), marginBottom: 14 }}>
                {analyticsData.total} total events
              </p>
              {Object.entries(analyticsData.summary)
                .sort((a, b) => b[1] - a[1])
                .map(([event, count]) => (
                  <div
                    key={event}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: D ? "#13131f" : "#f9fafb",
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontFamily: "monospace",
                        color: tx(D),
                      }}
                    >
                      {event}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--riq-accent)",
                      }}
                    >
                      {count}
                    </span>
                  </div>
                ))}
            </div>
            <div
              style={{
                padding: "12px 22px",
                borderTop: "1px solid " + (D ? "#374151" : "#e5e7eb"),
              }}
            >
              <button
                onClick={() => setAnalyticsData(null)}
                style={{
                  width: "100%",
                  padding: "9px 0",
                  borderRadius: 10,
                  border: "1px solid📊" + (D ? "#374151" : "#e5e7eb"),
                  background: "transparent",
                  color: mu(D),
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
