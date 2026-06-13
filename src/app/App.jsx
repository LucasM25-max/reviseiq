import "../../src/storage.js";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";
import { buildTodaySessionPlan, getPedagogicalContext, selectCommandWordQuestions } from "./learningEngine.js";
import { ImportModal, ManageAccountsModal } from "./accountModals.jsx";
import { _aiWithRetry, _parseAIJson, aiServiceReflectionSummarizer, buildAIPersonalisedSession, callAI, detectErrorType, getAccDisplayName, getAccHash, markAnswer } from "./aiService.js";
import { ADMIN_PASS_HASH, ADMIN_SCHOOL, ADMIN_USER, DEFAULT_BOARD, SK, SK_CALIBRATION, SK_ERROR_PATTERNS, SK_GRAPH, SK_JOURNAL, SK_PERSONAL, SK_SESSION, calcBrierScore, classifyError, confToProb, getDisplayName, hashPw, incrementErrorPattern, isAdmin } from "./coreHelpers.js";
import { AnnotatedImage } from "./annotation.jsx";
import { BlurtingScreen } from "./blurtingScreen.jsx";
import { ClozeCard, QuestionFigure, SequenceCard, generateWhyPrompt } from "./cards.jsx";
import { ContactScreen } from "./contact.jsx";
import { CreateModal } from "./createModal.jsx";
import { ConceptMap, DiagramRenderer, GraphCard, GraphEditor, KnowledgeGraph, LabelledStructure, LearningTimeline, MasteryTreemap, ProcessCard, ProgressiveDiagram, SketchCanvas, SketchnoteCanvas, checkPrerequisites, generateSVGDiagram } from "./diagrams.jsx";
import { ExamCoachScreen } from "./examCoach.jsx";
import { FocusMode } from "./focusMode.jsx";
import { FriendsPanel } from "./friends.jsx";
import { fsrsNext, getCardState, getRetrievability, isCardDue, previewIntervals } from "./fsrs.js";
import { AccountScreen, AdminBar, Header } from "./header.jsx";
import { ACHIEVEMENTS, AchievementToast, ExamReadinessGauge, MasteryPanel, MasteryRings, calculateExamReadiness, calculateMastery, checkNewAchievements } from "./mastery.jsx";
import { MockExamScreen } from "./mockExam.jsx";
import { registerReviseIQServiceWorker, syncOfflineQueue, useOfflineQueue } from "./offline.js";
import { GlobalOverlays } from "./overlays.jsx";
import { CalibrationDial, Figure, MasteryConstellation, Ring, SessionRecap, StatTile } from "./lumen.jsx";
import { AppFooter, CreatePersonalSubjectModal, PersonalSubjectScreen, SubjMyNotesTab } from "./personalSubjects.jsx";
import { PracticeSessionScreen, TodayWidget } from "./practice.jsx";
import { AO_COLORS, autoHints, detectAOLabel, detectCW, detectCardType } from "./questionMeta.js";
import { ContentBlock, SmartNoteCard } from "./richText.jsx";
import { calcLongestStreak, calcStreak, ensureCardVariantCached, generateInterleavedSession, generateSessionOptions, generateTransferQuestion, generateWeeklyPlan, getLadderLevel, maybeUseVariantText, selectAdaptiveQuestions, todayStr, updateAdaptiveLevel, updateLadderLevel, verifyExplanation } from "./scheduling.js";
import { SubjectSelectionScreen } from "./searchOnboard.jsx";
import { SchoolLeaderboard, mergeTopics, upsertGroupScore } from "./social.jsx";
import { GENERATED_CONTENT, getGeneratedTopics } from "./generatedContent.js";
import { getNextGoal, logLearningEvent, loadLearningEvents } from "./learningEngine.js";
import { CalibrationGauge, ForecastBar, MasteryRing, MemoryDecayChart, PastPapersTab, PostSessionReflection, SRInfoTooltip, SessionGoalModal, StrategyRecommendation, StudyJournalTab } from "./studyWidgets.jsx";
import { ALL_SUBJECTS } from "./subjects.js";
import { TimetableScreen } from "./timetable.jsx";
import { AITutorScreen } from "./tutor.jsx";
import { B, C, I, MobileBottomNav, ToastContainer, gradeColor, mu, pctToGrade, showToast, stripHtml, trackEvent, tx } from "./ui.jsx";
import { UCNewSectionModal, UCSectionModal, UserContentScreen } from "./userContent.jsx";

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

  const [personalSubjects, setPersonalSubjects] = useState([]);
  const [personalScreen, setPersonalScreen] = useState(null);
  const [createPersonalOpen, setCreatePersonalOpen] = useState(false);
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
  const [userContent, setUserContent] = useState({});
  const [ucScreen, setUCScreen] = useState(null);
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
        const pr = await window.storage.get(SK_PERSONAL(user), false);
        if (pr?.value) {
          var ps = JSON.parse(pr.value);
          if (Array.isArray(ps)) setPersonalSubjects(ps);
        }
      } catch (_) {}

      try {
        const ucr = await window.storage.get(
          "gcse:uc:all:" + user.replace(/\W/g, "-"),
          false,
        );
        if (ucr?.value) {
          var ucParsed = JSON.parse(ucr.value);
          if (ucParsed && typeof ucParsed === "object")
            setUserContent(ucParsed);
        }
      } catch (_) {}

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
  const saveUserContent = (nextUC) => {
    if (!user) return;
    setUserContent(nextUC);
    window.storage
      .set(
        "gcse:uc:all:" + user.replace(/\W/g, "-"),
        JSON.stringify(nextUC),
        false,
      )
      .catch(function () {});
  };
  const ucForSubj = (sId) => userContent[sId] || { sections: [] };
  const saveUCSection = (sId, sec) => {
    var prev = ucForSubj(sId);
    var exists = prev.sections.find(function (s) {
      return s.id === sec.id;
    });
    var next = exists
      ? {
          ...prev,
          sections: prev.sections.map(function (s) {
            return s.id === sec.id ? sec : s;
          }),
        }
      : { ...prev, sections: [...prev.sections, sec] };
    saveUserContent({ ...userContent, [sId]: next });
  };
  const deleteUCSection = (sId, secId) => {
    var prev = ucForSubj(sId);
    saveUserContent({
      ...userContent,
      [sId]: {
        ...prev,
        sections: prev.sections.filter(function (s) {
          return s.id !== secId;
        }),
      },
    });
  };
  const savePersonalSubjects = (ps) => {
    if (!user) return;
    setPersonalSubjects(ps);
    window.storage
      .set(SK_PERSONAL(user), JSON.stringify(ps), false)
      .catch(() => {});
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
  const _goEl = (
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
  const openMyNotes = (subjId) => {
    setUCScreen({
      subjId: subjId || subjects.filter((s) => !s._politics)[0]?.id || null,
    });
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

  if (ucScreen)
    return (
      <div>
        <Header {...hProps} />
        <UserContentScreen
          D={D}
          user={user}
          subjects={subjects.filter(function (s) {
            return !s._politics;
          })}
          ucData={userContent}
          onSaveSection={saveUCSection}
          onDeleteSection={deleteUCSection}
          onBack={function () {
            setUCScreen(null);
          }}
        />
      </div>
    );

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
  if (personalScreen && personalScreen.subjId) {
    var _ps = personalSubjects.find(function (s) {
      return s.id === personalScreen.subjId;
    });
    if (_ps)
      return (
        <PersonalSubjectScreen
          D={D}
          subj={_ps}
          personalSubjects={personalSubjects}
          user={user}
          onBack={function () {
            setPersonalScreen(null);
          }}
          onSaveSubjects={savePersonalSubjects}
        />
      );
  }
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
          background: D ? "radial-gradient(1200px 820px at 12% -12%, rgba(124,58,237,.20), transparent 60%), radial-gradient(1000px 720px at 102% 4%, rgba(217,70,239,.14), transparent 55%), radial-gradient(900px 700px at 50% 120%, rgba(59,130,246,.10), transparent 55%), #0a0a14" : "radial-gradient(1100px 780px at 10% -10%, rgba(124,58,237,.10), transparent 60%), radial-gradient(940px 660px at 104% 2%, rgba(217,70,239,.08), transparent 55%), radial-gradient(820px 640px at 50% 116%, rgba(59,130,246,.06), transparent 55%), #f6f6fc",
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
              background: canSubmit ? "#7c3aed" : "#d1d5db",
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
    const _cline = D ? "rgba(255,255,255,.09)" : "rgba(16,24,40,.08)";
    const coachTabs = [
      { id: "tutor", label: "AI Tutor" },
      { id: "exam", label: "Exam Technique" },
    ];
    const coachWrap = { maxWidth: 1100, margin: "0 auto", padding: "12px 16px 0" };
    const coachTabBar = {
      display: "inline-flex",
      gap: 4,
      padding: 4,
      borderRadius: 12,
      background: D ? "rgba(255,255,255,.06)" : "rgba(16,24,40,.05)",
      border: "1px solid " + _cline,
    };
    const coachTabBtn = (active) => ({
      border: "none",
      cursor: "pointer",
      borderRadius: 9,
      padding: "7px 16px",
      fontSize: 13.5,
      fontWeight: 700,
      background: active ? (D ? "#5b54f0" : "#7c3aed") : "transparent",
      color: active ? "#fff" : D ? "#9aa3c2" : "#5b6478",
    });
    return (
      <>
        <Header {...hProps} />
        <div style={coachWrap}>
          <div style={coachTabBar}>
            {coachTabs.map((m) => (
              <button
                key={m.id}
                onClick={() => setCoachMode(m.id)}
                style={coachTabBtn(coachMode === m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        {coachMode === "tutor" ? (
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
        ) : (
          <ExamCoachScreen
            D={D}
            subjects={subjects}
            allSections={allSections}
            boardSels={boardSels}
            boardData={boardData}
            onBack={() => setScreen("home")}
          />
        )}
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
    const studyShell = {
      minHeight: "100vh",
      background: D ? "#0a0a14" : "#f6f7fb",
      color: _dnk,
    };
    const studyWrap = { maxWidth: 1100, margin: "0 auto", padding: "8px 16px 60px" };
    const studyH2 = { fontSize: 26, fontWeight: 800, margin: "8px 0 2px" };
    const studyLead = { color: _sub, margin: 0, fontSize: 14 };
    const studyEmpty = { color: _sub, marginTop: 24 };
    const studyName = { fontSize: 16, fontWeight: 800 };
    const studyReady = { fontSize: 12.5, fontWeight: 700, color: _sub };
    const grid = {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
      gap: 14,
      marginTop: 18,
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
    const real = subjects.filter((s) => !s._politics);
    return (
      <div style={studyShell} className="fade-in">
        <Header {...hProps} />
        <div style={studyWrap}>
          <h2 style={studyH2}>Study</h2>
          <p style={studyLead}>
            Choose a subject to learn, review flashcards, practise questions, blurt or sit a mock.
          </p>
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
                    <span style={studyReady}>
                      {readiness}% exam ready
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }
  if (screen === "home") {
    const _dn = userDisplayName || getDisplayName(user);
    const _hh = new Date().getHours();
    const _greet = _hh < 12 ? "Good morning" : _hh < 18 ? "Good afternoon" : "Good evening";
    const guidedPlan = buildTodaySessionPlan({ subjects, allSections, stats, fcHist, timetableExams });
    const gb = guidedPlan.primaryBlock || {};
    const nextGoal = getNextGoal({ subjects, allSections, stats, fcHist, calibrationData, timetableExams, streak, events: engineEvents });
    const sid0 = subjects[0] ? subjects[0].id : null;
    const opts = sid0 ? generateSessionOptions(user, sid0, allSections, stats, fcHist) : [];

    const ink = D ? "#eef1fb" : "#0f1729";
    const sub = D ? "#9aa3c2" : "#5b6478";
    const glassBg = D ? "rgba(255,255,255,.045)" : "rgba(255,255,255,.72)";
    const line = D ? "rgba(255,255,255,.09)" : "rgba(16,24,40,.08)";
    const cardSh = D ? "0 20px 50px -34px rgba(0,0,0,.85)" : "0 20px 50px -34px rgba(76,29,149,.35)";
    const auroraBg = D
      ? "radial-gradient(1200px 820px at 12% -12%, rgba(124,58,237,.20), transparent 60%), radial-gradient(1000px 720px at 102% 4%, rgba(217,70,239,.14), transparent 55%), radial-gradient(900px 700px at 50% 120%, rgba(59,130,246,.10), transparent 55%), #0a0a14"
      : "radial-gradient(1100px 780px at 10% -10%, rgba(124,58,237,.10), transparent 60%), radial-gradient(940px 660px at 104% 2%, rgba(217,70,239,.08), transparent 55%), radial-gradient(820px 640px at 50% 116%, rgba(59,130,246,.06), transparent 55%), #f6f6fc";

    const pageShell = { minHeight: "100vh", background: auroraBg, color: ink, paddingBottom: 64 };
    const container = { maxWidth: 1080, margin: "0 auto", padding: "0 22px", display: "flex", flexDirection: "column", gap: 22, boxSizing: "border-box" };
    const greetRow = { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginTop: 28 };
    const greetH = { margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.08, color: ink, fontFamily: "var(--riq-display, inherit)" };
    const greetSub = { margin: "7px 0 0", fontSize: 14.5, color: sub, fontWeight: 500 };
    const ghostBtn = { fontSize: 13, fontWeight: 700, color: D ? "#c4b5fd" : "#6d28d9", padding: "9px 15px", borderRadius: 11, border: "1px solid " + (D ? "rgba(167,139,250,.3)" : "rgba(124,58,237,.25)"), background: D ? "rgba(124,58,237,.08)" : "rgba(124,58,237,.05)", cursor: "pointer", whiteSpace: "nowrap" };

    const hero = { position: "relative", overflow: "hidden", borderRadius: 26, padding: "30px 30px", background: "linear-gradient(135deg, #5b21b6 0%, #7c3aed 42%, #c026d3 100%)", boxShadow: "0 30px 70px -34px rgba(124,58,237,.75)", color: "#fff" };
    const heroGlow = { position: "absolute", top: -120, right: -80, width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,.22), transparent 70%)", pointerEvents: "none" };
    const heroCol = { flex: 1, minWidth: 0 };
    const heroInner = { position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24, flexWrap: "wrap" };
    const heroKicker = { fontSize: 11.5, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(255,255,255,.8)" };
    const heroTitle = { margin: "8px 0 0", fontSize: 26, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.12, fontFamily: "var(--riq-display, inherit)", maxWidth: 560 };
    const heroSub = { margin: "8px 0 0", fontSize: 14.5, color: "rgba(255,255,255,.86)", maxWidth: 540, lineHeight: 1.5 };
    const heroRow = { display: "flex", alignItems: "center", gap: 10, marginTop: 16, flexWrap: "wrap" };
    const startWith = { fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,.95)", padding: "7px 13px", borderRadius: 999, background: "rgba(255,255,255,.16)", border: "1px solid rgba(255,255,255,.25)" };
    const heroBadge = { fontSize: 11, fontWeight: 800, letterSpacing: ".06em", padding: "5px 10px", borderRadius: 999, background: "rgba(255,255,255,.92)", color: "#6d28d9" };
    const startBtn = { flexShrink: 0, fontSize: 15, fontWeight: 800, color: "#5b21b6", padding: "14px 24px", borderRadius: 14, border: "none", background: "#fff", cursor: "pointer", boxShadow: "0 14px 30px -12px rgba(0,0,0,.4)", whiteSpace: "nowrap" };

    const statStrip = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 };
    const statTile = { background: glassBg, border: "1px solid " + line, borderRadius: 18, padding: "16px 18px", boxShadow: cardSh, backdropFilter: "blur(12px)" };
    const statNum = { fontSize: 26, fontWeight: 800, color: ink, fontFamily: "var(--riq-display, inherit)", lineHeight: 1 };
    const statLbl = { fontSize: 12, fontWeight: 600, color: sub, marginTop: 6, textTransform: "uppercase", letterSpacing: ".04em" };
    const heatTile = { background: glassBg, border: "1px solid " + line, borderRadius: 18, padding: "16px 18px", boxShadow: cardSh, backdropFilter: "blur(12px)", display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" };
    const weekCol = { display: "flex", flexDirection: "column", gap: 4 };
    const cellStyle = function (c) { return { width: 13, height: 13, borderRadius: 4, background: c.a ? "linear-gradient(135deg,#7c3aed,#c026d3)" : (D ? "rgba(255,255,255,.08)" : "rgba(16,24,40,.06)"), outline: c.t ? "2px solid " + (D ? "#c4b5fd" : "#7c3aed") : "none", outlineOffset: 1 }; };

    const sectionLbl = { fontSize: 12.5, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: sub, margin: "6px 0 -6px" };
    const card = { background: glassBg, border: "1px solid " + line, borderRadius: 22, padding: 22, boxShadow: cardSh, backdropFilter: "blur(12px)" };
    const choiceGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12, marginTop: 14 };
    const choiceCard = { textAlign: "left", padding: "15px 16px", borderRadius: 15, border: "1px solid " + line, background: D ? "rgba(255,255,255,.03)" : "#fff", cursor: "pointer", transition: "transform .16s cubic-bezier(.22,1,.36,1), border-color .16s ease" };
    const choiceTitle = { fontSize: 14.5, fontWeight: 800, color: ink };
    const choiceDesc = { fontSize: 12.5, color: sub, marginTop: 4, lineHeight: 1.45 };
    const h3s = { margin: 0, fontSize: 17, fontWeight: 800, color: ink, fontFamily: "var(--riq-display, inherit)" };
    const dayRow = { display: "flex", gap: 10, marginTop: 14, overflowX: "auto", paddingBottom: 4 };
    const dayChip = { flexShrink: 0, minWidth: 124, textAlign: "left", padding: "12px 14px", borderRadius: 14, border: "1px solid " + line, background: D ? "rgba(255,255,255,.03)" : "#fff", cursor: "pointer" };
    const dayName = { fontSize: 12, fontWeight: 800, color: D ? "#c4b5fd" : "#7c3aed", textTransform: "uppercase", letterSpacing: ".05em" };
    const dayTask = { fontSize: 12.5, color: sub, marginTop: 5, lineHeight: 1.4 };
    const toggleRow = { display: "flex", justifyContent: "flex-end" };
    const toggleBtn = { fontSize: 12.5, fontWeight: 700, color: D ? "#c4b5fd" : "#6d28d9", padding: "8px 14px", borderRadius: 11, border: "1px solid " + (D ? "rgba(167,139,250,.3)" : "rgba(124,58,237,.25)"), background: "transparent", cursor: "pointer" };

    const subjGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(216px, 1fr))", gap: 14 };
    const subjCard = { position: "relative", textAlign: "left", padding: 18, borderRadius: 20, border: "1px solid " + line, background: glassBg, boxShadow: cardSh, backdropFilter: "blur(12px)", cursor: "pointer", transition: "transform .18s cubic-bezier(.22,1,.36,1), box-shadow .18s ease", display: "flex", flexDirection: "column" };
    const subjTopRow = { display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 6, minHeight: 56 };
    const gradeBadge = { fontSize: 13, fontWeight: 800, color: ink };
    const targetBadge = { fontSize: 11.5, fontWeight: 700, color: sub };
    const subjIcon = function (accent) { return { width: 46, height: 46, borderRadius: 13, background: "linear-gradient(135deg," + accent + "," + accent + "99)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 23, marginBottom: 12, boxShadow: "0 8px 18px -8px " + accent }; };
    const subjName = { fontSize: 15.5, fontWeight: 800, color: ink };
    const subjMeta = { display: "flex", alignItems: "center", gap: 7, marginTop: 6, flexWrap: "wrap" };
    const boardBadge = { fontSize: 11, fontWeight: 700, color: sub, padding: "3px 8px", borderRadius: 7, background: D ? "rgba(255,255,255,.06)" : "rgba(16,24,40,.05)" };
    const metaSmall = { fontSize: 11.5, color: sub, fontWeight: 600 };

    const personalWrap = { ...card, marginTop: 4 };
    const personalHead = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" };
    const personalGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12, marginTop: 16 };
    const personalCard = { textAlign: "left", padding: 16, borderRadius: 16, border: "1px solid " + line, background: D ? "rgba(255,255,255,.03)" : "#fff", cursor: "pointer", transition: "transform .16s ease" };
    const emptyNote = { fontSize: 13, color: sub, marginTop: 14, lineHeight: 1.5 };
    const adminBar = { borderRadius: 16, border: "1px solid " + (D ? "rgba(167,139,250,.3)" : "#ddd6fe"), background: D ? "rgba(124,58,237,.08)" : "rgba(124,58,237,.05)", overflow: "hidden" };
    const adminHead = { padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", borderBottom: "1px solid " + (D ? "rgba(167,139,250,.25)" : "#ddd6fe") };
    const adminTag = { fontSize: 12, fontWeight: 800, color: D ? "#c4b5fd" : "#6d28d9", textTransform: "uppercase", letterSpacing: ".06em" };
    const adminHint = { fontSize: 12.5, color: sub };
    const adminBtns = { padding: "12px 16px", display: "flex", gap: 10, flexWrap: "wrap" };
    const adminBtn = { fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 9, border: "1.5px solid " + (D ? "#a78bfa" : "#7c3aed"), background: "transparent", color: D ? "#c4b5fd" : "#6d28d9", cursor: "pointer" };

    const liftIn = function (e) { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 26px 56px -30px rgba(124,58,237,.5)"; };
    const liftOut = function (e) { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = cardSh; };
    const choiceIn = function (e) { e.currentTarget.style.borderColor = D ? "#a78bfa" : "#7c3aed"; e.currentTarget.style.transform = "translateY(-2px)"; };
    const choiceOut = function (e) { e.currentTarget.style.borderColor = line; e.currentTarget.style.transform = ""; };

    const _subjReadiness = subjects.map(function (s) { try { return calculateExamReadiness(s.id, allSections, fcHist, stats, calibrationData[s.id], timetableExams)?.score ?? 0; } catch (e) { return 0; } });
    const overallReadiness = _subjReadiness.length ? Math.round(_subjReadiness.reduce(function (a, b) { return a + b; }, 0) / _subjReadiness.length) : 0;
    const readyCardWrap = { display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", padding: 22, borderRadius: 22, background: glassBg, border: "1px solid " + line, boxShadow: cardSh, backdropFilter: "blur(12px)" };
    const readyLbl = { fontSize: 12.5, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: sub };
    const readyTextWrap = { minWidth: 0, flex: 1 };
    const readyFigWrap = { marginTop: 8 };
    const readyP = { margin: "8px 0 0", fontSize: 13.5, color: sub, lineHeight: 1.5, maxWidth: 480 };

    return (
      <div style={pageShell} className="fade-in">
        <Header {...hProps} />
        <div style={container}>
          <div style={greetRow}>
            <div>
              <h2 style={greetH}>{_greet}, {_dn}</h2>
              <p style={greetSub}>Here’s your focused plan for today — one clear step at a time.</p>
            </div>
            <button onClick={function () { openMyNotes(null); }} style={ghostBtn}>
              My Notes &amp; Flashcards
            </button>
          </div>

          <div style={hero}>
            <div style={heroGlow} />
            <div style={heroInner}>
              <div style={heroCol}>
                <div style={heroKicker}>Your next goal {nextGoal.icon}</div>
                <h3 style={heroTitle}>{nextGoal.title}</h3>
                <p style={heroSub}>{nextGoal.instruction}</p>
                <div style={heroRow}>
                  <span style={startWith}>Why now: {nextGoal.reason}</span>
                  <span style={heroBadge}>≈ {nextGoal.etaMin} min</span>
                </div>
              </div>
              <button
                onClick={() => goToGoal(nextGoal)}
                style={startBtn}
              >
                Start →
              </button>
            </div>
          </div>

          {subjects.length > 0 ? (
            <div style={readyCardWrap}>
              <Ring value={overallReadiness / 100} size={104} stroke={11} label={overallReadiness + "%"} sub="ready" D={D} />
              <div style={readyTextWrap}>
                <div style={readyLbl}>Exam readiness</div>
                <div style={readyFigWrap}>
                  <Figure size={28} D={D} gradient>{overallReadiness >= 70 ? "On track" : overallReadiness >= 50 ? "Building momentum" : "Getting started"}</Figure>
                </div>
                <p style={readyP}>A blended signal across {subjects.length} subject{subjects.length === 1 ? "" : "s"} — retention, accuracy, coverage, calibration and spacing combined.</p>
              </div>
            </div>
          ) : null}

          {streak > 0 ? (
            <div style={statStrip}>
              <div style={statTile}>
                <div style={statNum}>{streak}🔥</div>
                <div style={statLbl}>Day streak</div>
              </div>
              <div style={statTile}>
                <div style={statNum}>{calcLongestStreak(activityDates)}d</div>
                <div style={statLbl}>Longest streak</div>
              </div>
              {totalDaysStudied > 0 ? (
                <div style={statTile}>
                  <div style={statNum}>{totalDaysStudied}</div>
                  <div style={statLbl}>Total days</div>
                </div>
              ) : null}
              <div style={heatTile}>
                {(() => {
                  const weeks = [];
                  const t = new Date();
                  t.setHours(0, 0, 0, 0);
                  const dow = t.getDay() === 0 ? 6 : t.getDay() - 1;
                  const startD = new Date(t);
                  startD.setDate(startD.getDate() - dow - 14);
                  for (let w = 0; w < 3; w++) {
                    const week = [];
                    for (let d = 0; d < 7; d++) {
                      const dt = new Date(startD);
                      dt.setDate(dt.getDate() + w * 7 + d);
                      const k = dt.toISOString().slice(0, 10);
                      week.push({ k, a: activityDates.has(k), t: k === todayStr() });
                    }
                    weeks.push(week);
                  }
                  return weeks.map((wk, wi) => (
                    <div key={wi} style={weekCol}>
                      {wk.map((c) => (<div key={c.k} title={c.k} style={cellStyle(c)} />))}
                    </div>
                  ));
                })()}
              </div>
            </div>
          ) : null}

          {null}

          <TodayWidget
            D={D}
            subjects={subjects}
            allSections={allSections}
            fcHist={fcHist}
            stats={stats}
            timetableExams={timetableExams}
            boardSels={boardSels}
            onNavigateSection={function (sec, toTab) {
              const si = subjects.findIndex(function (s) { return s.id === sec.subjectId; });
              if (si < 0) return;
              setSubIdx(si);
              const b = boardSels[subjects[si].id] || DEFAULT_BOARD;
              ensureBoardLoaded(subjects[si].id, b).then(function () {
                const bd = boardData[subjects[si].id + ":" + b] || { custom: [], extras: {}, papers: [] };
                const merged = mergeTopics(subjects[si].topics || [], bd.custom, bd.extras);
                const ti = merged.findIndex(function (t) { return t.sections.some(function (s) { return s.id === sec.id; }); });
                if (ti < 0) return;
                setTopIdx(ti);
                setSecId(sec.id);
                setTab(toTab || "flashcards");
                setFcIdx(0);
                setFlip(false);
                setQIdx(0);
                setQRes(null);
                setSelOpt(null);
                setTA("");
                setSubjTab("sections");
                setScreen("section");
              });
            }}
            onNavigateBlurt={function (subjId, secId2) {
              setBlurtSubjId(subjId);
              setBlurtSecId2(secId2);
              setScreen("blurting");
            }}
            onMock={function () { setScreen("mock"); }}
          />

          {opts.length > 0 ? (
            <div style={card}>
              <h3 style={h3s}>Structured session choices</h3>
              <div style={choiceGrid}>
                {opts.map((o, i) => (
                  <button
                    key={i}
                    onMouseEnter={choiceIn}
                    onMouseLeave={choiceOut}
                    onClick={() => {
                      if (o.action.type === "target") { setScreen("target"); return; }
                      if (o.action.type === "interleaved") {
                        const plan = generateInterleavedSession(sid0, allSections);
                        if (plan.length) {
                          try { localStorage.setItem("gcse:interleaved:" + user.replace(/\W/g, "-") + ":" + sid0, JSON.stringify(plan)); } catch (_) {}
                          const first = plan[0];
                          const sec = allSections.find((s) => s.id === first.sectionId);
                          if (sec) {
                            const si = subjects.findIndex((s) => s.id === sec.subjectId);
                            if (si >= 0) {
                              setSubIdx(si); setTopIdx(0); setSecId(sec.id);
                              setTab(first.kind === "question" ? "questions" : "flashcards");
                              setScreen("section");
                            }
                          }
                        } else {
                          showToast("Need at least 3 topics with cards/questions for interleaving.", "warn");
                        }
                        return;
                      }
                      if (o.action.sectionId) {
                        const sec = allSections.find((s) => s.id === o.action.sectionId);
                        if (!sec) return;
                        const si = subjects.findIndex((s) => s.id === sec.subjectId);
                        if (si < 0) return;
                        setSubIdx(si); setTopIdx(0); setSecId(sec.id);
                        setTab(o.action.type === "questions" ? "questions" : "flashcards");
                        setScreen("section");
                      }
                    }}
                    style={choiceCard}
                  >
                    <div style={choiceTitle}>{o.title}</div>
                    <div style={choiceDesc}>{o.description}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {weeklyPlan && weeklyPlan.length > 0 ? (
            <div style={card}>
              <h3 style={h3s}>Weekly AI learning plan</h3>
              <div style={dayRow}>
                {weeklyPlan.slice(0, 7).map((d, idx) => (
                  <button key={idx} onClick={() => setScreen("target")} style={dayChip}>
                    <div style={dayName}>{d.day}</div>
                    <div style={dayTask}>{d.tasks ? d.tasks[0] : null}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div style={sectionLbl}>Your subjects</div>
          <div style={toggleRow}>
            <button onClick={() => setShowTreemap((v) => !v)} style={toggleBtn}>
              {showTreemap ? "Show subject cards" : "Show mastery treemap"}
            </button>
          </div>
          {showTreemap ? (
            <MasteryTreemap
              D={D}
              nodes={allSections.map(function (sec) {
                const s = subjects.find((x) => x.id === sec.subjectId);
                const m = calculateMastery(sec.subjectId, allSections, fcHist, stats);
                return {
                  subjectId: sec.subjectId,
                  topicId: sec.id,
                  name: (s ? s.icon + "" : "") + sec.title,
                  mastery: Math.round((m.flashcardMastery + m.questionAccuracy) / 2),
                  contentSize: (sec.notes || []).length + (sec.flashcards || []).length + (sec.questions || []).length + 1,
                };
              })}
              onSelect={function (n) {
                const si = subjects.findIndex((s) => s.id === n.subjectId);
                if (si < 0) return;
                setSubIdx(si);
                setSecId(n.topicId);
                setScreen("section");
              }}
            />
          ) : (
            <div style={subjGrid}>
              {subjects.map((s, si) => {
                const selBoard = boardSels[s.id] || DEFAULT_BOARD;
                const bData = getBD(s.id, selBoard);
                const ss = stats.subjStats ? stats.subjStats[s.id] : null;
                const qPct = ss && ss.qM > 0 ? Math.round((ss.qS / ss.qM) * 100) : null;
                const predicted = qPct != null ? pctToGrade(qPct) : null;
                const target = targetGrades[s.id] || null;
                const customCount = (bData.custom || []).length;
                const mastery = calculateMastery(s.id, allSections, fcHist, stats);
                const hasMasteryData = mastery.flashcardMastery > 0 || mastery.questionAccuracy > 0 || mastery.coverage > 0;
                return (
                  <button
                    key={s.id}
                    onClick={async () => {
                      setSubIdx(si);
                      setSubjTab("sections");
                      await ensureBoardLoaded(s.id, selBoard);
                      setScreen("subject");
                    }}
                    style={subjCard}
                    onMouseEnter={liftIn}
                    onMouseLeave={liftOut}
                  >
                    <div style={subjTopRow}>
                      {hasMasteryData ? (
                        <MasteryRings mastery={mastery} accent={s.accent} size={54} D={D} />
                      ) : (
                        predicted ? <span style={gradeBadge}>{predicted}</span> : null
                      )}
                      {target ? <span style={targetBadge}>→ {target}</span> : null}
                    </div>
                    <div style={subjIcon(s.accent)}>{s.icon}</div>
                    <div style={subjName}>{s.name}</div>
                    <div style={subjMeta}>
                      <span style={boardBadge}>{selBoard}</span>
                      {customCount > 0 ? <span style={metaSmall}>+{customCount}</span> : null}
                      {qPct != null ? <span style={metaSmall}>{qPct}%</span> : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={container}>
          <div style={personalWrap}>
            <div style={personalHead}>
              <div>
                <h3 style={h3s}>My subjects</h3>
                <p style={greetSub}>Personal content — only visible to you</p>
              </div>
              <button onClick={() => setCreatePersonalOpen(true)} style={ghostBtn}>＋ New subject</button>
            </div>
            {personalSubjects.length === 0 ? (
              <div style={emptyNote}>Create personal subjects for anything you want to learn — Spanish vocab, music theory, anything. Only you can see them.</div>
            ) : (
              <div style={personalGrid}>
                {personalSubjects.map(function (ps) {
                  return (
                    <button
                      key={ps.id}
                      onClick={() => setPersonalScreen({ subjId: ps.id })}
                      style={personalCard}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
                    >
                      <div style={subjIcon("#7c3aed")}>{ps.icon}</div>
                      <div style={subjName}>{ps.name}</div>
                      <span style={metaSmall}>{(ps.topics || []).length} topics</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {createPersonalOpen && (
          <CreatePersonalSubjectModal
            D={D}
            onClose={() => setCreatePersonalOpen(false)}
            onSave={function (ns) {
              savePersonalSubjects([...personalSubjects, ns]);
              setCreatePersonalOpen(false);
            }}
          />
        )}
        <AppFooter D={D} onContact={() => setScreen("contact")} />
      </div>
    );
  }

  if (screen === "subject" && subjDef) {
    const subj = subjDef;
    return (
      <div
        style={{ minHeight: "100vh", background: bg, color: tx(D) }}
        className="fade-in"
      >
        <Header {...hProps} />
        <div
          style={{
            maxWidth: 960,
            margin: "0 auto",
            padding: "32px 24px",
            paddingBottom: window.innerWidth < 640 ? 70 : 0,
          }}
        >
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
            All subjects
          </button>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 16,
              marginBottom: 20,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: `linear-gradient(135deg,${subj.accent},
${subj.accent}88)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                flexShrink: 0,
              }}
            >
              {subj.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
                {subj.name}
              </h2>
              {!subj._politics && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      padding: "4px 14px",
                      borderRadius: 20,
                      background: subj.accent,
                      color: "#fff",
                    }}
                  >
                    {curBoard}
                  </span>
                  <button
                    onClick={() => setScreen("account")}
                    style={{
                      fontSize: 11,
                      color: mu(D),
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textDecoration: "underline",
                      padding: 0,
                    }}
                  >
                    Change in Account Settings
                  </button>
                </div>
              )}
              {!subj._politics &&
                (() => {
                  const ss = stats.subjStats?.[subj.id];
                  const qPct =
                    ss?.qM > 0 ? Math.round((ss.qS / ss.qM) * 100) : null;
                  const predicted = qPct != null ? pctToGrade(qPct) : null;
                  const target = targetGrades[subj.id] || null;
                  const grades = [
                    "9",
                    "8",
                    "7",
                    "6",
                    "5",
                    "4",
                    "3",
                    "2",
                    "1",
                    "U",
                  ];
                  return (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {predicted && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                            padding: "8px 12px",
                            borderRadius: 10,
                            background: D
                              ? "rgba(255,255,255,.04)"
                              : "rgba(0,0,0,.03)",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 11,
                              color: mu(D),
                              fontWeight: 600,
                            }}
                          >
                            Predicted
                          </span>
                          <span
                            style={{
                              fontSize: 20,
                              fontWeight: 900,
                              color: "#fff",
                              background: gradeColor(predicted),
                              padding: "3px 13px",
                              borderRadius: 9,
                              letterSpacing: "0.04em",
                            }}
                          >
                            {predicted}
                          </span>
                          {qPct != null && (
                            <span style={{ fontSize: 11, color: mu(D) }}>
                              {qPct}% · {ss.qM} marks answered
                            </span>
                          )}
                          {target && (
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                padding: "3px 10px",
                                borderRadius: 8,
                                background:
                                  parseInt(predicted) >= parseInt(target) ||
                                  predicted === target
                                    ? "#dcfce7"
                                    : "#fef3c7",

                                color:
                                  parseInt(predicted) >= parseInt(target) ||
                                  predicted === target
                                    ? "#15803d"
                                    : "#92400e",
                              }}
                            >
                              {predicted === target
                                ? "✓ On target!"
                                : parseInt(predicted) > parseInt(target)
                                  ? "Above target!"
                                  : `${parseInt(target) - parseInt(predicted)}
grade${parseInt(target) - parseInt(predicted) !== 1 ? "s" : ""} to go`}
                            </span>
                          )}
                        </div>
                      )}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            color: mu(D),
                            flexShrink: 0,
                            fontWeight: 600,
                          }}
                        >
                          Target:
                        </span>
                        <div
                          style={{ display: "flex", gap: 3, flexWrap: "wrap" }}
                        >
                          {grades.map((g) => {
                            const sel = target === g;
                            const gc = gradeColor(g);
                            return (
                              <button
                                key={g}
                                onClick={() =>
                                  setTargetGrades((p) => ({
                                    ...p,
                                    [subj.id]: sel ? undefined : g,
                                  }))
                                }
                                aria-label={`Set target grade ${g}${sel ? " (selected, click to clear)" : ""}`}
                                aria-pressed={sel}
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 7,
                                  border: `2px solid ${sel ? gc : D ? "#374151" : "#d1d5db"}`,
                                  background: sel ? gc : D ? "#13131f" : "#fff",
                                  color: sel
                                    ? "#fff"
                                    : D
                                      ? "#8896b3"
                                      : "#9ca3af",
                                  fontWeight: sel ? 800 : 500,
                                  fontSize: 12,
                                  cursor: "pointer",
                                  transition: "all .15s",
                                  boxShadow: sel ? `0 0 0 3px ${gc}33` : "",
                                }}
                              >
                                {g}
                              </button>
                            );
                          })}
                          {target && (
                            <span
                              style={{
                                fontSize: 11,
                                color: mu(D),
                                alignSelf: "center",
                                marginLeft: 4,
                              }}
                            >
                              click again to clear
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
            </div>
          </div>

          {subj._politics && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                background: D ? "#134e4a22" : "#f0fdfa",
                border: "1.5px solid #0f766e",
                marginBottom: 20,
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 18 }}> </span>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    flexWrap: "wrap",
                    marginBottom: 3,
                  }}
                >
                  <span
                    style={{ fontWeight: 700, fontSize: 13, color: "#0f766e" }}
                  >
                    General Political Knowledge
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      background: "#0f766e",
                      color: "#fff",
                      padding: "2px 8px",
                      borderRadius: 20,
                    }}
                  >
                    Updated Weekly
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: D ? "#9ca3af" : "#6b7280",
                    margin: 0,
                  }}
                >
                  This is <strong>not GCSE content</strong> — it's factual,
                  non-biased political awareness for well-rounded world
                  knowledge. Notes only. Use the AI Tutor to explore any topic
                  further.
                </p>
              </div>
            </div>
          )}
          {!subj._politics &&
            (admin ? (
              <GraphEditor
                D={D}
                user={user}
                subjectId={subj.id}
                masteryMap={{}}
                onSelectNode={function () {}}
                onGoToPrereq={function (from, to) {
                  setPrereqModal({ from, to, si: subIdx, ti: topIdx || 0 });
                }}
              />
            ) : (
              <KnowledgeGraph
                D={D}
                user={user}
                subjectId={subj.id}
                masteryMap={{}}
                onSelectNode={function () {}}
                onGoToPrereq={function (from, to) {
                  setPrereqModal({ from, to, si: subIdx, ti: topIdx || 0 });
                }}
              />
            ))}
          {!subj._politics && (
            <SketchnoteCanvas D={D} user={user} subjectId={subj.id} />
          )}
          {subjTab === "sections" &&
            (() => {
              const allSecsDue = curTopics
                .flatMap((t) => t.sections)
                .filter((s) =>
                  (s.flashcards || []).some((c) => isCardDue(fcHist, c.id)),
                );
              const allSecsNew = curTopics
                .flatMap((t) => t.sections)
                .filter(
                  (s) =>
                    (s.questions || []).length > 0 ||
                    (s.flashcards || []).length > 0,
                );
              const ctaSection = allSecsDue[0] || allSecsNew[0];
              const dueCount = curTopics
                .flatMap((t) => t.sections)
                .reduce(
                  (acc, s) =>
                    acc +
                    (s.flashcards || []).filter((c) => isCardDue(fcHist, c.id))
                      .length,
                  0,
                );
              if (!ctaSection) return null;
              const ti = curTopics.findIndex((t) =>
                t.sections.some((s) => s.id === ctaSection.id),
              );
              return (
                <div
                  style={{
                    marginBottom: 20,
                    padding: "16px 20px",
                    borderRadius: 14,
                    background: D ? "rgba(99,102,241,.08)" : "#f5f3ff",
                    border: "1.5px solid #7c3aed",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#7c3aed",
                        marginBottom: 2,
                      }}
                    >
                      {dueCount > 0
                        ? `${dueCount} flashcard${dueCount !== 1 ? "s" : ""} due for review`
                        : "Continue revision"}
                    </div>
                    <div
                      style={{ fontSize: 12, color: D ? "#8896b3" : "#9ca3af" }}
                    >
                      {ctaSection.title}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      navToSection(subIdx, ti >= 0 ? ti : 0, ctaSection.id)
                    }
                    style={{
                      padding: "10px 22px",
                      borderRadius: 10,
                      border: "none",
                      background: "#7c3aed",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: "pointer",
                      flexShrink: 0,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {dueCount > 0 ? "Review Now →" : "Continue →"}
                  </button>
                </div>
              );
            })()}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              borderBottom: "1px solid" + bd2,
              marginBottom: 24,
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            {(subj._politics
              ? [["sections", "Topics"]]
              : [
                  ["sections", "Topics"],
                  ["mynotes", "MyNotes"],
                  ["papers", "Papers"],
                  ["journal", "Journal"],
                ]
            ).map(function (pair) {
              var t = pair[0],
                label = pair[1];
              return (
                <button
                  key={t}
                  onClick={function () {
                    setSubjTab(t);
                  }}
                  style={{
                    padding: "10px 18px",
                    fontSize: 13,
                    fontWeight: subjTab === t ? 600 : 400,
                    color: subjTab === t ? subj.accent : mu(D),
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    borderBottom:
                      subjTab === t
                        ? "2px solid" + subj.accent
                        : "2px solid transparent",
                    marginBottom: -1,
                    transition: "color .15s",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {}
          {subjTab === "sections" && !subj._politics && (
            <StrategyRecommendation
              D={D}
              subj={subj}
              allSections={allSections}
              fcHist={fcHist}
              calibData={calibrationData[subj.id]}
              timetableExams={timetableExams}
              stats={stats}
              onFlashcards={() => {
                const sec = allSections.filter(
                  (s) =>
                    s.subjectId === subj.id && (s.flashcards || []).length > 0,
                )[0];
                if (!sec) return;
                const ti = curTopics.findIndex((t) =>
                  t.sections.some((s) => s.id === sec.id),
                );
                if (ti >= 0) navToSection(subIdx, ti, sec.id);
              }}
              onBlurt={() => {
                setBlurtSubjId(subj.id);
                setBlurtSecId2(null);
                setScreen("blurting");
              }}
              onQuestions={() => {
                const sec = allSections.filter(
                  (s) =>
                    s.subjectId === subj.id && (s.questions || []).length > 0,
                )[0];
                if (!sec) return;

                const ti = curTopics.findIndex((t) =>
                  t.sections.some((s) => s.id === sec.id),
                );
                if (ti >= 0) {
                  navToSection(subIdx, ti, sec.id);
                  setTab("questions");
                }
              }}
              onWeak={() => {
                setTTSubj(subIdx);
                setScreen("target");
              }}
            />
          )}
          {subjTab === "sections" && (
            <div className="fade-in">
              {admin && (
                <AdminBar
                  D={D}
                  actions={[
                    {
                      label: `＋ New Topic
(${curBoard})`,
                      fn: () => setModal({ mode: "section" }),
                    },
                  ]}
                />
              )}
              {curTopics.length === 0 && (
                <div style={{ ...C(D), padding: 48, textAlign: "center" }}>
                  <p style={{ fontSize: 28, marginBottom: 10 }}>{subj.icon}</p>
                  <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                    {subj.name} · {curBoard}
                  </p>
                  <p style={{ fontSize: 13, color: mu(D) }}>
                    No topics yet.{admin ? " Add one above." : ""}
                  </p>
                </div>
              )}
              {curTopics.map((tp, ti) => {
                if (tp.id === "_admin" && tp._adminGroups) {
                  return tp._adminGroups.map((grp) => (
                    <div key={grp._adminTopicId} style={{ marginBottom: 22 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                          marginBottom: 12,
                          paddingBottom: 8,
                          borderBottom: "2px solid " + subj.accent + "44",
                          flexWrap: "wrap",
                        }}
                      >
                        {admin &&
                        editingTitle &&
                        editingTitle.id === grp._adminTopicId ? (
                          <input
                            autoFocus
                            value={editingTitle.value}
                            onChange={(e) =>
                              setEditingTitle((t) => ({
                                ...t,
                                value: e.target.value,
                              }))
                            }
                            onBlur={() => {
                              renameCustomTopic(
                                grp._adminTopicId,
                                editingTitle.value,
                              );
                              setEditingTitle(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                renameCustomTopic(
                                  grp._adminTopicId,
                                  editingTitle.value,
                                );
                                setEditingTitle(null);
                              }
                              if (e.key === "Escape") setEditingTitle(null);
                            }}
                            style={{
                              fontWeight: 700,
                              fontSize: 15,
                              border: "1.5px solid #7c3aed",
                              borderRadius: 6,
                              padding: "2px 8px",
                              background: "transparent",
                              color: "inherit",
                              flex: 1,
                            }}
                          />
                        ) : (
                          <span
                            style={{
                              fontWeight: 800,
                              fontSize: 16,
                              color: subj.accent,
                            }}
                          >
                            {grp._adminTopicTitle}
                          </span>
                        )}
                        {admin && (
                          <div
                            style={{
                              display: "flex",
                              gap: 6,
                              alignItems: "center",
                              flexShrink: 0,
                            }}
                          >
                            {!editingTitle && (
                              <button
                                onClick={() =>
                                  setEditingTitle({
                                    id: grp._adminTopicId,
                                    value: grp._adminTopicTitle,
                                  })
                                }
                                style={{
                                  padding: "5px 10px",
                                  borderRadius: 7,
                                  border: "1.5px solid #7c3aed",
                                  background: "transparent",
                                  cursor: "pointer",
                                  fontSize: 11,
                                  color: "#7c3aed",
                                  fontWeight: 600,
                                }}
                              >
                                Rename
                              </button>
                            )}
                            <button
                              onClick={() =>
                                setModal({
                                  mode: "subtopic",
                                  _parentTopicId: grp._adminTopicId,
                                })
                              }
                              style={{
                                padding: "5px 10px",
                                borderRadius: 7,
                                border: "none",
                                background: "#7c3aed",
                                cursor: "pointer",
                                fontSize: 11,
                                color: "#fff",
                                fontWeight: 600,
                              }}
                            >
                              ＋ Sub-topic
                            </button>
                            <button
                              onClick={() => deleteCustomSec(grp._adminTopicId)}
                              style={{
                                padding: "5px 10px",
                                borderRadius: 7,
                                border: "1.5px solid #ef4444",
                                background: "transparent",
                                cursor: "pointer",
                                fontSize: 11,
                                color: "#ef4444",
                                fontWeight: 600,
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                      {grp.sections.length === 0 && (
                        <p
                          style={{
                            fontSize: 12,
                            color: mu(D),
                            fontStyle: "italic",
                            marginTop: 4,
                          }}
                        >
                          No sub-topics yet — click "＋Sub-topic" to add one.
                        </p>
                      )}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit,minmax(190px,1fr))",
                          gap: 10,
                        }}
                      >
                        {grp.sections.map((sec) => (
                          <div
                            key={sec.id}
                            style={{
                              border: `1.5px solid ${bd2}`,
                              borderRadius: 12,
                              overflow: "hidden",
                              transition: "border-color .15s",
                            }}
                          >
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() => navToSection(subIdx, ti, sec.id)}
                              onKeyDown={(e) =>
                                e.key === "Enter" &&
                                navToSection(subIdx, ti, sec.id)
                              }
                              style={{
                                width: "100%",
                                textAlign: "left",
                                padding: "12px 14px",
                                background: "transparent",
                                cursor: "pointer",
                                color: tx(D),
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.closest(
                                  "div[style]",
                                ).style.borderColor = subj.accent;
                                e.currentTarget.style.background = subj.light;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.closest(
                                  "div[style]",
                                ).style.borderColor = bd2;
                                e.currentTarget.style.background =
                                  "transparent";
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  justifyContent: "space-between",
                                  gap: 6,
                                  marginBottom: 5,
                                }}
                              >
                                {admin &&
                                editingTitle &&
                                editingTitle.id === sec.id ? (
                                  <input
                                    autoFocus
                                    value={editingTitle.value}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) =>
                                      setEditingTitle((t) => ({
                                        ...t,
                                        value: e.target.value,
                                      }))
                                    }
                                    onBlur={() => {
                                      if (sec._isSubtopic)
                                        renameCustomSubtopic(
                                          grp._adminTopicId,
                                          sec.id,
                                          editingTitle.value,
                                        );
                                      else
                                        renameCustomTopic(
                                          sec.id,
                                          editingTitle.value,
                                        );
                                      setEditingTitle(null);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        if (sec._isSubtopic)
                                          renameCustomSubtopic(
                                            grp._adminTopicId,
                                            sec.id,
                                            editingTitle.value,
                                          );
                                        else
                                          renameCustomTopic(
                                            sec.id,
                                            editingTitle.value,
                                          );
                                        setEditingTitle(null);
                                      }
                                      if (e.key === "Escape") setEditingTitle(null);
                                    }}
                                    style={{
                                      fontSize: 13,
                                      fontWeight: 600,
                                      border: "1.5px solid #7c3aed",
                                      borderRadius: 6,
                                      padding: "2px 6px",
                                      background: "transparent",
                                      color: "inherit",
                                      width: "100%",
                                    }}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      fontSize: 13,
                                      fontWeight: 600,
                                      flex: 1,
                                      minWidth: 0,
                                    }}
                                  >
                                    {sec.title}
                                  </div>
                                )}
                                {(() => {
                                  const cards = sec.flashcards || [];
                                  if (!cards.length) return null;
                                  const mastered = cards.filter((c) => {
                                    const s = getCardState(fcHist, c.id);
                                    return s && s.interval > 7;
                                  }).length;
                                  const pct = Math.round(
                                    (mastered / cards.length) * 100,
                                  );
                                  return (
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 3,
                                        flexShrink: 0,
                                      }}
                                      title={pct + "% mastered(interval>7d)"}
                                    >
                                      <MasteryRing
                                        pct={pct}
                                        size={22}
                                        accent="#10b981"
                                      />
                                      <span
                                        style={{
                                          fontSize: 9,
                                          color: "#10b981",
                                          fontWeight: 700,
                                        }}
                                      >
                                        {pct}%
                                      </span>
                                    </div>
                                  );
                                })()}
                              </div>
                              <div style={{ display: "flex", gap: 8 }}>
                                <span style={{ fontSize: 11, color: mu(D) }}>
                                  {(sec.flashcards || []).length}
                                </span>
                                <span style={{ fontSize: 11, color: mu(D) }}>
                                  {(sec.questions || []).length}
                                </span>
                              </div>
                            </div>
                            {admin && (
                              <div
                                style={{
                                  display: "flex",
                                  gap: 0,
                                  borderTop: `1px solid ${bd2}`,
                                  background: D
                                    ? "rgba(0,0,0,.2)"
                                    : "rgba(0,0,0,.03)",
                                }}
                              >
                                {!editingTitle && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingTitle({
                                        id: sec.id,
                                        parentId: sec._isSubtopic
                                          ? grp._adminTopicId
                                          : null,
                                        value: sec.title,
                                      });
                                    }}
                                    style={{
                                      flex: 1,
                                      padding: "5px 0",
                                      fontSize: 11,
                                      background: "none",
                                      border: "none",
                                      cursor: "pointer",
                                      color: "#7c3aed",
                                      fontWeight: 600,
                                    }}
                                  >
                                    Rename
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (sec._isSubtopic)
                                      deleteSubtopic(grp._adminTopicId, sec.id);
                                    else deleteCustomSec(sec.id);
                                  }}
                                  style={{
                                    flex: 1,
                                    padding: "5px 0",
                                    fontSize: 11,
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#ef4444",
                                    fontWeight: 600,
                                    borderLeft: `1px solid ${bd2}`,
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                }
                return (
                  <div key={tp.id} style={{ marginBottom: 22 }}>
                    {}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 12,
                        paddingBottom: 8,
                        borderBottom: "2px solid " + subj.accent + "44",
                      }}
                    >
                      {tp.number && (
                        <span
                          style={{
                            fontSize: 11,
                            fontFamily: "monospace",
                            fontWeight: 700,
                            color: "#fff",
                            background: subj.accent,
                            padding: "2px 9px",
                            borderRadius: 6,
                            flexShrink: 0,
                          }}
                        >
                          {tp.number}
                        </span>
                      )}
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: 16,
                          color: subj.accent,
                        }}
                      >
                        {tp.title}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: mu(D),
                          marginLeft: "auto",
                        }}
                      >
                        {tp.sections.length}
                        topic{tp.sections.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit,minmax(190px,1fr))",
                        gap: 10,
                      }}
                    >
                      {tp.sections.map(function (sec) {
                        var cards = sec.flashcards || [];
                        var mastered = cards.filter(function (c) {
                          var s = getCardState(fcHist, c.id);
                          return s && s.interval > 7;
                        }).length;
                        var pct = cards.length
                          ? Math.round((mastered / cards.length) * 100)
                          : null;
                        return (
                          <div key={sec.id} style={{ position: "relative" }}>
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={function () {
                                navToSection(subIdx, ti, sec.id);
                              }}
                              onKeyDown={function (e) {
                                if (e.key === "Enter")
                                  navToSection(subIdx, ti, sec.id);
                              }}
                              style={{
                                width: "100%",
                                textAlign: "left",
                                padding: "12px 14px",
                                borderRadius: 12,
                                border: "1.5px solid" + bd2,
                                background: "transparent",
                                cursor: "pointer",
                                transition: "all .15s",
                                color: tx(D),
                              }}
                              onMouseEnter={function (e) {
                                e.currentTarget.style.borderColor = subj.accent;
                                e.currentTarget.style.background = subj.light;
                              }}
                              onMouseLeave={function (e) {
                                e.currentTarget.style.borderColor = bd2;
                                e.currentTarget.style.background = "transparent";
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  justifyContent: "space-between",
                                  gap: 6,
                                  marginBottom: 5,
                                }}
                              >
                                <div style={{ fontSize: 13, fontWeight: 600 }}>
                                  {sec.title}
                                </div>

                                {pct !== null && (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 3,
                                      flexShrink: 0,
                                    }}
                                    title={pct + "% mastered"}
                                  >
                                    <MasteryRing
                                      pct={pct}
                                      size={22}
                                      accent="#10b981"
                                    />
                                    <span
                                      style={{
                                        fontSize: 9,
                                        color: "#10b981",
                                        fontWeight: 700,
                                      }}
                                    >
                                      {pct}%
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div style={{ display: "flex", gap: 8 }}>
                                <span style={{ fontSize: 11, color: mu(D) }}>
                                  {(sec.flashcards || []).length}
                                </span>
                                <span style={{ fontSize: 11, color: mu(D) }}>
                                  {(sec.questions || []).length}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {subjTab === "mynotes" && (
            <SubjMyNotesTab
              D={D}
              subjId={subj.id}
              ucData={userContent}
              setModal={setModal}
              deleteUCSection={deleteUCSection}
              tx2={tx(D)}
              mu2={mu(D)}
            />
          )}
          {subjTab === "papers" && (
            <PastPapersTab
              papers={curBData.papers}
              onAdd={() => setModal({ mode: "paper" })}
              onDelete={deletePaper}
              admin={admin}
              D={D}
              accent={subj.accent}
              board={curBoard}
              subjectName={subj.name}
            />
          )}
          {subjTab === "journal" && (
            <div className="fade-in">
              {}
              {!subj._politics &&
                (() => {
                  const mastery = calculateMastery(
                    subj.id,
                    allSections,
                    fcHist,
                    stats,
                  );
                  const readiness = calculateExamReadiness(
                    subj.id,
                    allSections,
                    fcHist,
                    stats,
                    calibrationData[subj.id],
                    timetableExams,
                  );
                  return (
                    <>
                      <MasteryPanel
                        D={D}
                        mastery={mastery}
                        subjectName={subj.name}
                      />
                      <ExamReadinessGauge
                        D={D}
                        readiness={readiness}
                        subjectName={subj.name}
                        accent={subj.accent}
                      />
                      {(calibrationData[subj.id] || []).length >= 3 && (
                        <CalibrationGauge
                          D={D}
                          calibData={calibrationData[subj.id]}
                          subjectName={subj.name}
                        />
                      )}
                    </>
                  );
                })()}
              {}
              {!subj._politics && (
                <button
                  onClick={() => setFocusMode(true)}
                  style={{
                    ...B("#7c3aed", true, {
                      width: "100%",
                      padding: "11px 0",
                      fontSize: 13,
                      fontWeight: 700,
                      marginBottom: 18,
                    }),
                  }}
                >
                  Start Focus Mode
                </button>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
                    Study Journal
                  </h3>
                  <p style={{ fontSize: 12, color: mu(D), margin: "2px 0 0" }}>
                    Your post-session reflections for {subj.name}
                  </p>
                </div>
              </div>
              <StudyJournalTab
                D={D}
                entries={journalData[subj.id] || []}
                mu2={mu(D)}
                tx2={tx(D)}
              />
            </div>
          )}
        </div>
        {modal?.mode === "section" && (
          <CreateModal
            mode="section"
            D={D}
            subjects={subjects}
            onClose={() => setModal(null)}
            onSave={addCustomSection}
          />
        )}
        {modal?.mode === "subtopic" && modal._parentTopicId && (
          <CreateModal
            mode="subtopic"
            D={D}
            subjects={subjects}
            onClose={() => setModal(null)}
            onSave={(st) => addSubtopic(modal._parentTopicId, st)}
          />
        )}
        {modal?.mode === "paper" && (
          <CreateModal
            mode="paper"
            D={D}
            subjects={subjects}
            onClose={() => setModal(null)}
            onSave={addPaper}
          />
        )}
        {modal?.mode === "uc-new-section" && (
          <UCNewSectionModal
            D={D}
            onClose={() => setModal(null)}
            onSave={function (title) {
              if (!title.trim()) return;
              var sec = {
                id: Math.random().toString(36).slice(2),
                title: title.trim(),
                notes: [],
                flashcards: [],
                questions: [],
                created: Date.now(),
              };
              saveUCSection(modal.subjId, sec);
              setModal({ mode: "uc-section", subjId: modal.subjId, sec });
            }}
          />
        )}
        {modal?.mode === "uc-section" && (
          <UCSectionModal
            D={D}
            user={user}
            subjId={modal.subjId}
            sec={
              (userContent[modal.subjId] || { sections: [] }).sections.find(
                function (s) {
                  return s.id === (modal.sec?.id || modal.secId);
                },
              ) || modal.sec
            }
            subjects={subjects}
            onSaveSection={saveUCSection}
            onClose={() => setModal(null)}
          />
        )}
      </div>
    );
  }

  if (screen === "section" && section) {
    const inFocusMode = tab === "flashcards" || tab === "questions";
    const subj = subjDef;
    const cards = section.flashcards || [],
      rawQs = section.questions || [];

    const _epForSec = errorPatternsAll[subj?.id] || {};
    const _cwQs = Object.values(_epForSec).some((v) => v >= 5)
      ? selectCommandWordQuestions(rawQs, _epForSec, 30)
      : rawQs;
    const qs = selectAdaptiveQuestions(_cwQs, user, subj?.id);
    const safeFcIdx = cards.length > 0 ? Math.min(fcIdx, cards.length - 1) : 0;
    const fc = cards.length > 0 ? cards[safeFcIdx] : null;
    const q =
      transferQuestion ||
      (qs.length > 0 ? qs[Math.min(qIdx, qs.length - 1)] : null);
    const isCustomSec = section.src === "admin";
    const ladderTopicId = section._parentTopicId || section.id;
    const ladderLevel = getLadderLevel(user, ladderTopicId);
    const isAdminItem = (key, item) => {
      if (isCustomSec) return true;
      const extras = curBData.extras?.[section.id];
      return !!extras?.[key]?.find((x) => x.id === item.id);
    };
    const dueCards = cramMode
      ? cards
      : cards.filter((c) => isCardDue(fcHist, c.id));
    const curState = fc ? getCardState(fcHist, fc.id) : null;
    const previews = fc
      ? previewIntervals(curState)
      : ["today", "today", "6d", "1w"];
    const doSM2 = (rating) => {
      if (!fc) return;
      const cardId = fc.id;
      markTodayActive();
      if (!cramMode) {
        setFCH((prevHist) => {
          const prevState = getCardState(prevHist, cardId);
          const next = fsrsNext(prevState, rating);
          return { ...prevHist, [cardId]: next };
        });
      }
      const correct = rating >= 3;
      logEvent("card_rated", { subjectId: subj.id, sectionId: section.id, cardId, conf: rating, correct });
      updateLadderLevel(user, ladderTopicId, correct);
      setLadderTick((v) => v + 1);
      if (correct) {
        setElabOpen(true);
      }
      setStats((s) => {
        const wfc = { ...s.weakFC };

        wfc[section.id] = {
          wrong: (wfc[section.id]?.wrong || 0) + (correct ? 0 : 1),
          total: (wfc[section.id]?.total || 0) + 1,
        };
        const ss = { ...s.subjStats };
        ss[subj.id] = {
          ...ss[subj.id],
          fcC: (ss[subj.id]?.fcC || 0) + (correct ? 1 : 0),
          fcT: (ss[subj.id]?.fcT || 0) + 1,
        };
        return {
          ...s,
          fcC: s.fcC + (correct ? 1 : 0),
          fcT: s.fcT + 1,
          weakFC: wfc,
          subjStats: ss,
        };
      });
      setFlip(false);
      setFcIdx((i) => {
        const len = section.flashcards?.length || 0;
        return len > 0 ? (i < len - 1 ? i + 1 : 0) : 0;
      });
    };
    const handleDeleteFC = (id) => {
      removeExtra(section.id, "flashcards", id);

      setFcIdx((i) =>
        Math.min(i, Math.max(0, (section.flashcards?.length || 1) - 2)),
      );
      setFlip(false);
      showToast("Flashcard deleted");
    };
    const handleDeleteQ = (id) => {
      removeExtra(section.id, "questions", id);
      setQIdx(0);
      setQRes(null);
      setSelOpt(null);
      setTA("");
      setSmMdl(false);
      showToast("Question deleted");
    };
    const SM2_BTNS = [
      { label: "Again", color: "#ef4444", desc: "Forgot completely", q: 0 },
      { label: "Hard", color: "#f59e0b", desc: "Struggled", q: 1 },
      { label: "Good", color: "#3b82f6", desc: "Got it", q: 2 },
      { label: "Easy", color: "#10b981", desc: "Very easy", q: 3 },
    ];
    return (
      <div
        style={{ minHeight: "100vh", background: bg, color: tx(D) }}
        className="fade-in"
      >
        {!inFocusMode && <Header {...hProps} />}
        {inFocusMode && (
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 50,
              background: D ? "#13131f" : "#fff",
              borderBottom: `1px solid ${D ? "#262844" : "#e5e7eb"}`,
              padding: "10px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <button
              onClick={() => setTab("notes")}
              style={{
                fontSize: 13,
                color: D ? "#8896b3" : "#9ca3af",
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {section?.title || "Back"}
            </button>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setTab("flashcards")}
                style={{
                  fontSize: 12,
                  padding: "4px 12px",
                  borderRadius: 20,
                  border: "none",
                  background: tab === "flashcards" ? "#7c3aed" : "transparent",
                  color:
                    tab === "flashcards" ? "#fff" : D ? "#8896b3" : "#9ca3af",
                  cursor: "pointer",
                  fontWeight: tab === "flashcards" ? 600 : 400,
                }}
              >
                Cards
              </button>
              <button
                onClick={() => setTab("questions")}
                style={{
                  fontSize: 12,
                  padding: "4px 12px",
                  borderRadius: 20,
                  border: "none",
                  background: tab === "questions" ? "#7c3aed" : "transparent",
                  color:
                    tab === "questions" ? "#fff" : D ? "#8896b3" : "#9ca3af",
                  cursor: "pointer",
                  fontWeight: tab === "questions" ? 600 : 400,
                }}
              >
                Questions
              </button>
            </div>
            <button
              onClick={() => setD(!D)}
              style={{
                fontSize: 15,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: D ? "#8896b3" : "#9ca3af",
              }}
            >
              {D ? "☀️" : "🌙"}
            </button>
          </div>
        )}
        <div
          style={{
            maxWidth: inFocusMode ? 680 : 760,
            margin: "0 auto",
            padding: inFocusMode ? "16px 24px" : "28px 24px",
            paddingBottom: 100,
          }}
        >
          {!inFocusMode && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <button
                onClick={() => setScreen("subject")}
                style={{
                  fontSize: 13,
                  color: mu(D),
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {subj.name}
              </button>
              <button
                onClick={() => setFocusMode(true)}
                style={{
                  fontSize: 12,
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: "1px solid #7c3aed",
                  background: "transparent",
                  color: "#7c3aed",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Focus Mode
              </button>
            </div>
          )}
          {!inFocusMode && (
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                {section.title}
              </h2>
              <p style={{ fontSize: 12, color: mu(D) }}>
                {subj.name} · {curBoard}
              </p>
            </div>
          )}

          <div
            style={{
              display: "flex",
              borderBottom: `1px solid ${bd2}`,
              marginBottom: 24,
              gap: 2,
            }}
          >
            {(subj._politics
              ? [["notes", "Notes"]]
              : [
                  ["notes", "Notes"],
                  ["flashcards", "Flashcards"],
                  ["questions", "Questions"],
                ]
            ).map(([t, label]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: "10px 16px",
                  fontSize: 13,
                  fontWeight: tab === t ? 600 : 400,
                  color: tab === t ? subj.accent : mu(D),
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  borderBottom:
                    tab === t
                      ? `2px solid ${subj.accent}`
                      : "2px solidtransparent",
                  marginBottom: -1,
                  transition: "color .15s",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "notes" && (
            <div className="fade-in">
              {admin && (
                <AdminBar
                  D={D}
                  actions={[
                    {
                      label: "＋ AddNote",
                      fn: () =>
                        setModal({ mode: "note", sectionId: section.id }),
                    },
                  ]}
                />
              )}
              {(section.notes || []).length > 2 && (
                <input
                  value={noteSearch}
                  onChange={(e) => setNoteSearch(e.target.value)}
                  placeholder="Search notes…"
                  style={{ ...I(D, { marginBottom: 14, fontSize: 12 }) }}
                />
              )}
              {(() => {
                const allN = section.notes || [];
                const shown = noteSearch
                  ? allN.filter((n) =>
                      (
                        (n.heading || "") +
                        " " +
                        (typeof n.body === "string" ? stripHtml(n.body) : "")
                      )
                        .toLowerCase()
                        .includes(noteSearch.toLowerCase()),
                    )
                  : allN;
                if (!allN.length)
                  return (
                    <div
                      style={{
                        ...C(D),
                        padding: 40,
                        textAlign: "center",
                        color: mu(D),
                        fontSize: 14,
                      }}
                    >
                      No notes yet.{admin ? "Add one above." : ""}
                    </div>
                  );
                if (!shown.length)
                  return (
                    <p
                      style={{
                        fontSize: 13,
                        color: mu(D),
                        textAlign: "center",
                        padding: "20px 0",
                      }}
                    >
                      No notes match "{noteSearch}"
                    </p>
                  );
                return (
                  <div>
                    {shown.map((note) => (
                      <SmartNoteCard
                        key={note.id}
                        note={note}
                        D={D}
                        subjectAccent={subj.accent}
                        canEdit={admin && isAdminItem("notes", note)}
                        onEdit={() =>
                          setModal({
                            mode: "note",
                            sectionId: section.id,
                            initialItem: note,
                          })
                        }
                        onDelete={() => {
                          removeExtra(section.id, "notes", note.id);
                          showToast("Notedeleted");
                        }}
                        onAddVisual={async (note) => {
                          if (note._removeDiagram) {
                            editInSection(section.id, "notes", {
                              ...note,
                              diagram: null,
                              _removeDiagram: undefined,
                            });
                            showToast("Diagram removed");
                            return;
                          }
                          showToast("Generating diagram…");
                          try {
                            const textContent =
                              note.heading +
                              ": " +
                              stripHtml(note.body || "").slice(0, 500);
                            const prompt = `You are a GCSE revision diagram designer. Analyse this note and
return ONLY valid JSON (no markdown) for the best diagram.\n\nNote:
${textContent}\n\nChoose ONE type: process, cycle, hierarchy, comparison, structure,
timeline.\nReturn:
{"type":"process","accent":"#059669","data":{"steps":[{"id":"1","label":"Step","sublabel":"detail"}]}}
\nRules: labels max 4 words, max 8 items, use subject-appropriate accent colour.`;

                            const diagram = await _aiWithRetry(
                              async () => {
                                const raw = await callAI(prompt, 700);
                                const p = _parseAIJson(raw);
                                if (!p || !p.type)
                                  throw new Error("No diagram");
                                return p;
                              },
                              2,
                              null,
                            );
                            if (diagram) {
                              editInSection(section.id, "notes", {
                                ...note,
                                diagram,
                              });
                              showToast("Diagram added ✓", "success");
                            } else {
                              showToast(
                                "Could not generate diagram — try again",
                                "error",
                              );
                            }
                          } catch (err) {
                            showToast(
                              "Generation failed: " + err.message,
                              "error",
                            );
                          }
                        }}
                      />
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
          {tab === "flashcards" &&
            (() => {
              if (
                !goalModalShownThisTab &&
                !showGoalModal &&
                cards.length > 0
              ) {
                setGoalModalShownThisTab(true);
                setShowGoalModal(true);
              }

              const [shuffled, setShuffled] = [shuffledCards, setShuffledCards];
              const activeCards = shuffled || cards;
              const safeFI =
                activeCards.length > 0
                  ? Math.min(fcIdx, activeCards.length - 1)
                  : 0;
              const fc2 = activeCards.length > 0 ? activeCards[safeFI] : null;
              const curState2 = fc2 ? getCardState(fcHist, fc2.id) : null;
              const reviewCount = Number(curState2?.reps || 0);
              const stabilityDays = Number(curState2?.stability || 0);
              if (fc2) {
                ensureCardVariantCached(
                  user,
                  fc2,
                  reviewCount,
                  stabilityDays,
                ).catch(function () {});
              }
              const fcVariantText = fc2
                ? maybeUseVariantText(user, fc2, reviewCount, stabilityDays)
                : null;
              const previews2 = fc2
                ? previewIntervals(curState2)
                : ["today", "today", "6d", "1w"];
              const dueCards2 = cramMode
                ? activeCards
                : activeCards.filter((c) => isCardDue(fcHist, c.id));

              const cardType2 = fc2
                ? detectCardType(fc2.q || "")
                : { label: "Recall", color: "#7c3aed", icon: "🧠" };

              const fcHints2 = fc2
                ? [
                    fc2.hint1 ||
                      `Think: the answer relates to "${(fc2.a || "").split(" ").slice(0, 5).join(" ")}…"`,
                    fc2.hint2 ||
                      `This is a ${cardType2.icon} ${cardType2.label} card.
${cardType2.label === "Calculate" ? "Start by writing the formula." : cardType2.label === "Explain" ? "Use 'because' or 'therefore' in your answer." : "Think about the key term or process being tested."}`,
                  ]
                : [
                    "Think carefully before flipping.",
                    "Consider which topic this relates to.",
                  ];

              const handleTouchStart = (e) => {
                touchStartRef.current = {
                  x: e.touches[0].clientX,
                  y: e.touches[0].clientY,
                };
              };
              const handleTouchEnd = (e) => {
                if (!touchStartRef.current) return;
                const dx =
                  e.changedTouches[0].clientX - touchStartRef.current.x;
                const dy = Math.abs(
                  e.changedTouches[0].clientY - touchStartRef.current.y,
                );
                touchStartRef.current = null;
                if (Math.abs(dx) < 40 || dy > Math.abs(dx)) return;
                if (fcConf === null) return;
                setFlip(false);
                setFcConf(null);
                setFcHintLvl(0);
                setFcSelfExp("");
                setFcSelfOpen(false);
                if (dx < 0)
                  setFcIdx((i) => (i < activeCards.length - 1 ? i + 1 : 0));
                else setFcIdx((i) => (i > 0 ? i - 1 : activeCards.length - 1));
              };
              const doSM2local = (rating) => {
                if (!fc2) return;
                const cardId = fc2.id;
                markTodayActive();
                enqueueOffline({
                  type: "fsrs",
                  payload: {
                    cardId: cardId,
                    rating: rating,
                    subjectId: subjDef?.id || "",
                    sectionId: section?.id || "",
                  },
                });
                if (!cramMode) {
                  setFCH((prevH) => {
                    const ps = getCardState(prevH, cardId);
                    return { ...prevH, [cardId]: fsrsNext(ps, rating) };
                  });
                }
                const correct = rating >= 3;
                updateLadderLevel(user, ladderTopicId, correct);
                setLadderTick((v) => v + 1);

                if (fcConf !== null) {
                  const pred = confToProb(fcConf);
                  const outcome = correct ? 1 : 0;
                  const sId = subjDef?.id || "";
                  setCalibrationData((prev) => {
                    const cur = prev[sId] || [];
                    const next = [
                      ...cur,
                      { pred, outcome, ts: Date.now() },
                    ].slice(-200);

                    window.storage
                      .set(
                        SK_CALIBRATION(user, sId),
                        JSON.stringify(next),
                        true,
                      )
                      .catch(() => {});
                    return { ...prev, [sId]: next };
                  });
                }
                setStats((s) => {
                  const wfc = { ...s.weakFC };
                  wfc[section.id] = {
                    wrong: (wfc[section.id]?.wrong || 0) + (correct ? 0 : 1),
                    total: (wfc[section.id]?.total || 0) + 1,
                  };
                  const ss = { ...s.subjStats };
                  ss[subj.id] = {
                    ...ss[subj.id],
                    fcC: (ss[subj.id]?.fcC || 0) + (correct ? 1 : 0),
                    fcT: (ss[subj.id]?.fcT || 0) + 1,
                  };
                  return {
                    ...s,
                    fcC: s.fcC + (correct ? 1 : 0),
                    fcT: s.fcT + 1,
                    weakFC: wfc,
                    subjStats: ss,
                  };
                });
                trackEvent("card_rated", {
                  sectionId: section?.id,
                  subjectId: subjDef?.id,
                  value: rating,
                });
                setFlip(false);
                setFcConf(null);
                setFcHintLvl(0);
                setFcSelfExp("");
                setFcSelfOpen(false);
                if (correct) setElabOpen(true);
                setFcIdx((i) => {
                  const len = activeCards.length;
                  return len > 0 ? (i < len - 1 ? i + 1 : 0) : 0;
                });

                setTimeout(() => runAchievementCheck(null), 300);
              };

              const CONF3 = [
                {
                  v: 1,
                  label: "Not sure",
                  icon: "😕",
                  color: "#ef4444",
                  tip: "I'll need to see this again",
                },
                {
                  v: 2,
                  label: "Maybe",
                  icon: "🙂",
                  color: "#f59e0b",
                  tip: "I kind of knew it",
                },
                {
                  v: 3,
                  label: "Got it",
                  icon: "😎",
                  color: "#10b981",
                  tip: "I know this well",
                },
              ];
              const SM2B = [
                { label: "Again", color: "#ef4444", rating: 1 },
                { label: "Hard", color: "#f59e0b", rating: 2 },
                { label: "Good", color: "#3b82f6", rating: 3 },
                { label: "Easy", color: "#10b981", rating: 4 },
              ];

              const isDualCoded = !!(fc2?.cardImage || fc2?.diagram);

              const hasLabelTest = !!(
                fc2?.diagram?.type === "structure" &&
                (fc2?.diagram?.data?.labels || []).length > 0
              );
              return (
                <div className="fade-in">
                  {admin && (
                    <AdminBar
                      D={D}
                      actions={[
                        {
                          label: "＋ AddFlashcard",
                          fn: () =>
                            setModal({
                              mode: "flashcard",
                              sectionId: section.id,
                            }),
                        },
                      ]}
                    />
                  )}

                  {activeCards.length === 0 && (
                    <div
                      style={{
                        ...C(D),
                        padding: 32,
                        textAlign: "center",
                        color: mu(D),
                        fontSize: 14,
                      }}
                    >
                      No flashcards yet.{admin ? " Add one above." : ""}
                    </div>
                  )}
                  {fc2 && (
                    <div>
                      {}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px 14px",
                          borderRadius: 10,
                          background: D ? "#191a2b" : "#f3f4f6",
                          marginBottom: 8,
                        }}
                      >
                        <span style={{ fontSize: 12, color: mu(D) }}>
                          <strong
                            style={{
                              color: cramMode
                                ? "#7c3aed"
                                : dueCards2.length > 0
                                  ? "#f59e0b"
                                  : tx(D),
                            }}
                          >
                            {cramMode ? "CRAM" : dueCards2.length}
                          </strong>
                          {cramMode ? " mode" : " due"} ·{" "}
                          {
                            activeCards.filter((c) => {
                              const s = getCardState(fcHist, c.id);
                              return s && !isCardDue(fcHist, c.id);
                            }).length
                          }{" "}
                          scheduled
                        </span>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <button
                            onClick={() => {
                              if (shuffled) {
                                setShuffled(null);
                                setFcIdx(0);
                                setFlip(false);
                                setFcConf(null);
                                showToast("Shuffle off");
                              } else {
                                const arr = [...cards].sort(
                                  () => Math.random() - 0.5,
                                );
                                setShuffled(arr);
                                setFcIdx(0);
                                setFlip(false);
                                setFcConf(null);
                                showToast("Shuffled!");
                              }
                            }}
                            style={{
                              fontSize: 10,
                              padding: "3px 9px",
                              borderRadius: 8,
                              border: `1.5px solid ${shuffled ? "#f59e0b" : "#d1d5db"}`,
                              background: shuffled ? "#f59e0b" : "transparent",
                              color: shuffled ? "#fff" : mu(D),
                              cursor: "pointer",
                              fontWeight: shuffled ? 700 : 400,
                            }}
                          >
                            {" "}
                          </button>
                          <button
                            onClick={() => {
                              setCramMode((v) => !v);
                              setFcIdx(0);
                              setFlip(false);
                              setFcConf(null);
                            }}
                            style={{
                              fontSize: 10,
                              padding: "3px 9px",
                              borderRadius: 8,
                              border: `1.5px solid ${cramMode ? "#7c3aed" : "#d1d5db"}`,
                              background: cramMode ? "#7c3aed" : "transparent",
                              color: cramMode ? "#fff" : mu(D),
                              cursor: "pointer",
                              fontWeight: cramMode ? 700 : 400,
                            }}
                          >
                            Cram
                          </button>
                          {hasLabelTest && (
                            <button
                              onClick={() => {
                                setLabelTestMode((v) => !v);
                                setLabelTestComplete(false);
                              }}
                              style={{
                                fontSize: 10,
                                padding: "3px 9px",
                                borderRadius: 8,
                                border: `1.5px solid ${labelTestMode ? "#0891B2" : "#d1d5db"}`,
                                background: labelTestMode
                                  ? "#0891B2"
                                  : "transparent",

                                color: labelTestMode ? "#fff" : mu(D),
                                cursor: "pointer",
                                fontWeight: labelTestMode ? 700 : 400,
                              }}
                            >
                              Label Test
                            </button>
                          )}
                          <span style={{ fontSize: 11, color: mu(D) }}>
                            FSRS
                          </span>
                          <SRInfoTooltip D={D} />
                        </div>
                      </div>
                      {}
                      {fc2 && curState2 && curState2.stability > 0 && (
                        <MemoryDecayChart
                          D={D}
                          cardState={curState2}
                          accent={subj.accent}
                        />
                      )}
                      <ForecastBar
                        cards={activeCards}
                        fcHist={fcHist}
                        D={D}
                        accent={subj.accent}
                      />
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 8,
                          marginTop: 10,
                        }}
                      >
                        <span style={{ fontSize: 13, color: mu(D) }}>
                          {safeFI + 1} / {activeCards.length}
                          {shuffled ? "" : ""}
                        </span>

                        <span style={{ fontSize: 12, color: mu(D) }}>
                          {cramMode
                            ? "cram"
                            : curState2
                              ? curState2.reps > 0
                                ? `${curState2.interval}d`
                                : "new"
                              : "new"}
                        </span>
                      </div>
                      {}
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          alignItems: "center",
                          marginBottom: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "3px 9px",
                            borderRadius: 12,
                            background: cardType2.color + "22",
                            color: cardType2.color,
                          }}
                        >
                          {cardType2.icon} {cardType2.label}
                        </span>
                        {isDualCoded && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "3px 8px",
                              borderRadius: 10,
                              background: D
                                ? "rgba(99,102,241,.15)"
                                : "#f5f3ff",
                              color: "#7c3aed",
                            }}
                          >
                            Dual-coded
                          </span>
                        )}
                        {hasLabelTest && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "3px 8px",
                              borderRadius: 10,
                              background: D ? "rgba(8,145,178,.15)" : "#f0f9ff",
                              color: D ? "#67e8f9" : "#0e7490",
                            }}
                          >
                            {(fc2.diagram.data?.labels || []).length} labels
                          </span>
                        )}
                        {curState2 && (
                          <span
                            style={{
                              fontSize: 10,
                              color: mu(D),
                              background: D ? "#191a2b" : "#f3f4f6",
                              padding: "3px 8px",
                              borderRadius: 10,
                            }}
                          >{`Stability: ${curState2.stability?.toFixed(1)}d ·
${getRetrievability(fcHist, fc2.id) ?? "—"}% recall`}</span>
                        )}
                      </div>

                      {admin && fc2 && isAdminItem("flashcards", fc2) && (
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            justifyContent: "flex-end",
                            marginBottom: 8,
                          }}
                        >
                          <button
                            onClick={() =>
                              setModal({
                                mode: "flashcard",
                                sectionId: section.id,
                                initialItem: fc2,
                              })
                            }
                            style={{
                              ...B("#7c3aed", true, {
                                fontSize: 12,
                                padding: "5px 12px",
                              }),
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteFC(fc2.id)}
                            style={{
                              ...B("#ef4444", true, {
                                fontSize: 12,
                                padding: "5px 12px",
                              }),
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}

                      {}
                      {!flip && fcConf === null && (
                        <div
                          style={{
                            marginBottom: 12,
                            padding: "12px 16px",
                            borderRadius: 12,
                            background: D ? "#191a2b" : "#fafafa",
                            border: `1px solid ${D ? "#374151" : "#e5e7eb"}`,
                          }}
                        >
                          <p
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: mu(D),
                              marginBottom: 10,
                              textAlign: "center",
                            }}
                          >
                            Before you flip — how confident are you?
                          </p>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(3,1fr)",
                              gap: 8,
                            }}
                          >
                            {CONF3.map((opt) => (
                              <button
                                key={opt.v}
                                onClick={() => setFcConf(opt.v)}
                                className="conf-pop"
                                style={{
                                  padding: "10px 4px",
                                  borderRadius: 12,
                                  border: `2px solid ${opt.color}22`,
                                  background: D ? "#13131f" : "#fff",
                                  cursor: "pointer",
                                  textAlign: "center",
                                  transition: "border-color .15s",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = opt.color;
                                  e.currentTarget.style.background = opt.color + "15";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor =
                                    opt.color + "22";
                                  e.currentTarget.style.background = D ? "#13131f" : "#fff";
                                }}
                              >
                                <div style={{ fontSize: 20, marginBottom: 3 }}>
                                  {opt.icon}
                                </div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: opt.color,
                                  }}
                                >
                                  {opt.label}
                                </div>
                                <div
                                  style={{
                                    fontSize: 9,
                                    color: mu(D),
                                    marginTop: 1,
                                  }}
                                >
                                  {opt.tip}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {}
                      {!flip && fcConf !== null && (
                        <div style={{ marginBottom: 10 }}>
                          {fcHintLvl === 0 ? (
                            <button
                              onClick={() => setFcHintLvl(1)}
                              style={{
                                fontSize: 11,
                                color: mu(D),
                                background: "none",
                                border: `1px solid ${D ? "#374151" : "#d1d5db"}`,
                                borderRadius: 8,
                                padding: "5px 12px",
                                cursor: "pointer",
                                marginBottom: 6,
                              }}
                            >
                              Need a hint?
                            </button>
                          ) : fcHintLvl === 1 ? (
                            <div
                              className="hint-slide"
                              style={{
                                padding: "9px 13px",
                                borderRadius: 10,
                                background: D
                                  ? "rgba(245,158,11,.1)"
                                  : "#fffbeb",
                                border: "1px solid #f59e0b33",
                                fontSize: 12,
                                color: D ? "#fcd34d" : "#92400e",
                                lineHeight: 1.6,
                                marginBottom: 6,
                              }}
                            >
                              <strong>Hint 1:</strong> {fcHints2[0]}
                              <button
                                onClick={() => setFcHintLvl(2)}
                                style={{
                                  display: "block",
                                  marginTop: 5,
                                  fontSize: 11,

                                  color: mu(D),
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  textDecoration: "underline",
                                }}
                              >
                                Still not sure? See hint 2
                              </button>
                            </div>
                          ) : (
                            <div
                              className="hint-slide"
                              style={{
                                padding: "9px 13px",
                                borderRadius: 10,
                                background: D
                                  ? "rgba(245,158,11,.1)"
                                  : "#fffbeb",
                                border: "1px solid #f59e0b55",
                                fontSize: 12,
                                color: D ? "#fcd34d" : "#92400e",
                                lineHeight: 1.6,
                                marginBottom: 6,
                              }}
                            >
                              <strong>Hint 1:</strong> {fcHints2[0]}
                              <br />
                              <strong>Hint 2:</strong> {fcHints2[1]}
                            </div>
                          )}
                        </div>
                      )}

                      {}
                      {labelTestMode && hasLabelTest ? (
                        <div style={{ ...C(D), padding: 20, marginBottom: 14 }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: 12,
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: D ? "#67e8f9" : "#0e7490",
                                }}
                              >
                                Label Reveal Test
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: mu(D),
                                  marginTop: 2,
                                }}
                              >
                                Type each label from memory. All correct to
                                continue.
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setLabelTestMode(false);
                                setLabelTestComplete(false);
                              }}
                              style={{
                                fontSize: 11,
                                color: mu(D),
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                              }}
                            >
                              Exit
                            </button>
                          </div>
                          {!labelTestComplete ? (
                            <LabelledStructure
                              imageUrl={fc2.diagram.data?.imageUrl || null}
                              labels={fc2.diagram.data?.labels || []}
                              accent={fc2.diagram.accent || subj.accent}
                              D={D}
                              width={560}
                              selfTestMode={true}
                              onAllCorrect={() => {
                                setLabelTestComplete(true);
                                markTodayActive();
                                showToast(
                                  "All labels correct!",
                                  "success",
                                  2600,
                                );
                              }}
                            />
                          ) : (
                            <div
                              style={{ textAlign: "center", padding: "20px 0" }}
                            >
                              <div style={{ fontSize: 36, marginBottom: 8 }}>
                                {" "}
                              </div>
                              <div
                                style={{
                                  fontSize: 15,
                                  fontWeight: 700,
                                  marginBottom: 4,
                                  color: "#059669",
                                }}
                              >
                                All labels correct!
                              </div>
                              <div
                                style={{
                                  fontSize: 13,
                                  color: mu(D),
                                  marginBottom: 16,
                                }}
                              >
                                Rate how well you knew this:
                              </div>
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "repeat(4,1fr)",
                                  gap: 8,
                                  maxWidth: 360,
                                  margin: "0auto",
                                }}
                              >
                                {[
                                  {
                                    label: "Again",
                                    color: "#ef4444",
                                    rating: 1,
                                  },
                                  {
                                    label: "Hard",
                                    color: "#f59e0b",
                                    rating: 2,
                                  },
                                  {
                                    label: "Good",
                                    color: "#3b82f6",
                                    rating: 3,
                                  },
                                  {
                                    label: "Easy",
                                    color: "#10b981",
                                    rating: 4,
                                  },
                                ].map((btn) => (
                                  <button
                                    key={btn.rating}
                                    onClick={() => {
                                      doSM2local(btn.rating);
                                      setLabelTestMode(false);
                                      setLabelTestComplete(false);
                                    }}
                                    style={{
                                      padding: "10px 4px",
                                      borderRadius: 12,
                                      border: `2px solid ${btn.color}`,
                                      background: "transparent",
                                      cursor: "pointer",
                                      color: btn.color,
                                      fontWeight: 700,
                                      fontSize: 13,
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background =
                                        btn.color;
                                      e.currentTarget.style.color = "#fff";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background =
                                        "transparent";
                                      e.currentTarget.style.color = btn.color;
                                    }}
                                  >
                                    {btn.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          className="fc-scene"
                          onTouchStart={handleTouchStart}
                          onTouchEnd={handleTouchEnd}
                        >
                          <div
                            className={`fc-card${flip ? " flipped" : ""}`}
                            onClick={() => {
                              if (fcConf !== null) {
                                setFlip((v) => !v);
                                setFcHintLvl(0);
                              }
                            }}
                            style={{
                              minHeight: isDualCoded ? 260 : 180,
                              borderRadius: 14,
                              border: `1.5px solid ${flip ? subj.accent : bd2}`,
                              cursor: fcConf !== null ? "pointer" : "default",
                              opacity: fcConf === null ? 0.5 : 1,
                              transition: "opacity .2s",
                            }}
                          >
                            {}
                            <div
                              className="fc-face"
                              style={{
                                background: D ? "#13131f" : "#fff",
                                padding: "20px 24px",
                                justifyContent: "flex-start",
                              }}
                            >
                              {isDualCoded && (
                                <div
                                  style={{
                                    width: "100%",
                                    marginBottom: 12,
                                    opacity: 0.75,
                                    transition: "opacity .3s",
                                  }}
                                >
                                  {fc2.cardImage ? (
                                    <img
                                      src={fc2.cardImage}
                                      alt="card visual"
                                      style={{
                                        maxWidth: "100%",
                                        maxHeight: 130,
                                        borderRadius: 8,
                                        display: "block",
                                        margin: "0 auto",
                                        border: `1px solid ${D ? "#262844" : "#e5e7eb"}`,
                                      }}
                                    />
                                  ) : fc2.diagram ? (
                                    <DiagramRenderer
                                      diagram={fc2.diagram}
                                      D={D}
                                      width={400}
                                    />
                                  ) : null}
                                </div>
                              )}
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  letterSpacing: "0.1em",
                                  color: mu(D),
                                  textTransform: "uppercase",
                                  marginBottom: 8,
                                  alignSelf: "flex-start",
                                }}
                              >
                                Question
                                {fcConf !== null && (
                                  <span
                                    style={{
                                      marginLeft: 8,
                                      fontSize: 10,
                                      fontWeight: 700,
                                      color: CONF3.find((c) => c.v === fcConf)
                                        ?.color,
                                    }}
                                  >
                                    · {CONF3.find((c) => c.v === fcConf)?.icon}{" "}
                                    {CONF3.find((c) => c.v === fcConf)?.label}
                                  </span>
                                )}
                              </div>
                              {(fc2.images || []).length > 0 &&
                                fc2.images.map((img, ii) => (
                                  <AnnotatedImage key={ii} img={img} D={D} />
                                ))}
                              <ContentBlock
                                content={
                                  fc2.type === "cloze"
                                    ? String(fc2.text || fc2.q || "").replace(
                                        /\{\{(.*?)\}\}/g,
                                        "_____",
                                      )
                                    : fc2.type === "sequence"
                                      ? fc2.prompt ||
                                        "Arrange these steps in the correct order."
                                      : fcVariantText || fc2.q
                                }
                                D={D}
                                fontSize={15}
                                style={{
                                  color: tx(D),
                                  textAlign: isDualCoded ? "left" : "center",
                                  width: "100%",
                                }}
                              />
                              {fcConf === null ? (
                                <p
                                  style={{
                                    fontSize: 11,
                                    color: mu(D),
                                    marginTop: 14,
                                    alignSelf: "center",
                                  }}
                                >
                                  {" "}
                                  Rate your confidence first
                                </p>
                              ) : (
                                <p
                                  style={{
                                    fontSize: 11,
                                    color: mu(D),
                                    marginTop: 14,
                                    alignSelf: "center",
                                  }}
                                >
                                  Tap to reveal · Swipe to navigate
                                </p>
                              )}
                            </div>
                            {}
                            <div
                              className="fc-face fc-back"
                              style={{
                                background: D ? "#1a1040" : "#f5f3ff",
                                borderRadius: 14,
                                padding: "20px 24px",
                                justifyContent: "flex-start",
                              }}
                            >
                              {isDualCoded && (
                                <div
                                  style={{ width: "100%", marginBottom: 12 }}
                                >
                                  {fc2.cardImage ? (
                                    <div>
                                      <img
                                        src={fc2.cardImage}
                                        alt="card visual"
                                        style={{
                                          maxWidth: "100%",
                                          maxHeight: 140,
                                          borderRadius: 8,
                                          display: "block",
                                          margin: "0 auto",
                                          border: `1.5px solid ${subj.accent}44`,
                                        }}
                                      />
                                      {fc2.cardImageCaption && (
                                        <p
                                          style={{
                                            fontSize: 10,
                                            color: subj.accent,
                                            textAlign: "center",
                                            marginTop: 4,
                                            fontStyle: "italic",
                                            fontWeight: 600,
                                          }}
                                        >
                                          {fc2.cardImageCaption}
                                        </p>
                                      )}
                                    </div>
                                  ) : fc2.diagram ? (
                                    <DiagramRenderer
                                      diagram={fc2.diagram}
                                      D={D}
                                      width={400}
                                    />
                                  ) : null}
                                </div>
                              )}
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  letterSpacing: "0.1em",
                                  color: subj.accent,
                                  textTransform: "uppercase",
                                  marginBottom: 8,
                                  alignSelf: "flex-start",
                                }}
                              >
                                Answer
                              </div>
                              {fc2.type === "cloze" ||
                              fc2.type === "sequence" ||
                              fc2.type === "process" ||
                              fc2.type === "graph" ? (
                                fc2.type === "cloze" ? (
                                  <ClozeCard
                                    card={fc2}
                                    D={D}
                                    onSubmit={() => setFcSelfOpen(true)}
                                    DiagramRendererComp={DiagramRenderer}
                                  />
                                ) : fc2.type === "sequence" ? (
                                  <SequenceCard
                                    card={fc2}
                                    D={D}
                                    onSubmit={() => setFcSelfOpen(true)}
                                  />
                                ) : fc2.type === "process" ? (
                                  <ProcessCard card={fc2} D={D} />
                                ) : (
                                  <GraphCard card={fc2} D={D} />
                                )
                              ) : (
                                <ContentBlock
                                  content={fc2.a}
                                  D={D}
                                  fontSize={15}
                                  style={{
                                    color: subj.accent,
                                    fontWeight: 500,
                                    textAlign: isDualCoded ? "left" : "center",
                                    width: "100%",
                                  }}
                                />
                              )}
                              {!!fc2?.diagram && (
                                <div style={{ marginTop: 8 }}>
                                  <button
                                    onClick={() => setShowSketch((s) => !s)}
                                    style={{
                                      fontSize: 11,
                                      padding: "4px 9px",
                                      borderRadius: 8,
                                      border: "1px solid #7c3aed",
                                      background: "transparent",
                                      color: "#7c3aed",
                                    }}
                                  >
                                    Sketch it
                                  </button>
                                  {showSketch && (
                                    <div
                                      style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr1fr",
                                        gap: 8,
                                        marginTop: 8,
                                      }}
                                    >
                                      <SketchCanvas D={D} />
                                      <DiagramRenderer
                                        diagram={fc2.diagram}
                                        D={D}
                                        width={240}
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      {}
                      {flip && (
                        <div style={{ marginTop: 12 }}>
                          {}
                          {fcConf !== null && (
                            <div
                              style={{
                                padding: "7px 12px",
                                borderRadius: 9,
                                marginBottom: 10,
                                fontSize: 11,
                                background: D ? "#191a2b" : "#f3f4f6",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                flexWrap: "wrap",
                              }}
                            >
                              <span style={{ color: mu(D) }}>
                                You predicted:
                              </span>
                              <span
                                style={{
                                  fontWeight: 700,
                                  color: CONF3.find((c) => c.v === fcConf)
                                    ?.color,
                                }}
                              >
                                {CONF3.find((c) => c.v === fcConf)?.icon}{" "}
                                {CONF3.find((c) => c.v === fcConf)?.label}
                              </span>

                              <span style={{ color: mu(D) }}>
                                — how did that match?
                              </span>
                            </div>
                          )}
                          {}
                          {!fcSelfOpen ? (
                            <button
                              onClick={() => setFcSelfOpen(true)}
                              style={{
                                fontSize: 11,
                                color: "#7c3aed",
                                background: "none",
                                border: "1px solid #7c3aed",
                                borderRadius: 8,
                                padding: "5px 12px",
                                cursor: "pointer",
                                marginBottom: 10,
                                display: "block",
                              }}
                            >
                              Explain the answer in your own words (+50%
                              retention boost)
                            </button>
                          ) : (
                            <div style={{ marginBottom: 10 }}>
                              <p
                                style={{
                                  fontSize: 11,
                                  color: mu(D),
                                  marginBottom: 5,
                                }}
                              >
                                In your own words, why is this the answer?
                              </p>
                              <textarea
                                value={fcSelfExp}
                                onChange={(e) => setFcSelfExp(e.target.value)}
                                rows={2}
                                placeholder="e.g. 'This works because…' / 'The key principle is…'"
                                style={{
                                  ...I(D, {
                                    resize: "none",
                                    fontSize: 12,
                                    lineHeight: 1.6,
                                  }),
                                }}
                              />
                            </div>
                          )}
                          {}
                          <div
                            style={{
                              position: "sticky",
                              bottom: window.innerWidth < 640 ? 78 : 16,
                              zIndex: 10,
                              background: D ? "#0a0a14" : "#f9fafb",
                              padding: "10px 0",
                              margin: "0 -4px",
                            }}
                          >
                            <p
                              style={{
                                fontSize: 11,
                                color: mu(D),
                                textAlign: "center",
                                marginBottom: 8,
                              }}
                            >
                              How well did you know this?
                            </p>
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(4,1fr)",
                                gap: 8,
                              }}
                            >
                              {SM2B.map((btn) => (
                                <button
                                  key={btn.rating}
                                  onClick={() => doSM2local(btn.rating)}
                                  aria-label={btn.label}
                                  style={{
                                    padding: "12px 4px",
                                    borderRadius: 12,
                                    border: `2px solid ${btn.color}`,
                                    background: "transparent",
                                    cursor: "pointer",
                                    transition: "all .12s",
                                    color: btn.color,
                                    minHeight:
                                      window.innerWidth < 640 ? 52 : 44,
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background =
                                      btn.color;
                                    e.currentTarget.style.color = "#fff";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background =
                                      "transparent";
                                    e.currentTarget.style.color = btn.color;
                                  }}
                                >
                                  <div
                                    style={{ fontWeight: 700, fontSize: 13 }}
                                  >
                                    {btn.label}
                                  </div>
                                  {!cramMode && (
                                    <div
                                      style={{
                                        fontSize: 10,
                                        marginTop: 2,
                                        opacity: 0.8,
                                      }}
                                    >
                                      {previews2[btn.rating - 1]}
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                            {!cramMode && (
                              <p
                                style={{
                                  fontSize: 10,
                                  color: mu(D),
                                  textAlign: "center",
                                  marginTop: 6,
                                }}
                              >
                                Again{previews2[0]} · Hard{previews2[1]} · Good
                                {previews2[2]} · Easy{previews2[3]}
                              </p>
                            )}
                            {cramMode && (
                              <p
                                style={{
                                  fontSize: 10,
                                  color: "#7c3aed",
                                  textAlign: "center",
                                  marginTop: 6,
                                }}
                              >
                                Cram mode — FSRS scheduling paused
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      <div
                        style={{
                          marginTop: 10,
                          padding: "10px 12px",
                          borderRadius: 10,
                          background: D ? "#191a2b" : "#f8fafc",
                          border: `1px solid ${D ? "#374151" : "#e5e7eb"}`,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            marginBottom: 6,
                          }}
                        >
                          Difficulty Ladder
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(5,1fr)",
                            gap: 4,
                          }}
                        >
                          {[
                            "Know",
                            "Understand",
                            "Apply",
                            "Evaluate",
                            "Mastery",
                          ].map((l, i) => (
                            <div
                              key={l}
                              style={{
                                padding: "5px 4px",
                                borderRadius: 6,
                                fontSize: 9,
                                textAlign: "center",
                                background:
                                  i + 1 <= ladderLevel
                                    ? "#7c3aed"
                                    : "transparent",
                                color: i + 1 <= ladderLevel ? "#fff" : mu(D),
                                border: `1px solid ${bd2}`,
                              }}
                            >
                              {l}
                            </div>
                          ))}
                        </div>
                      </div>
                      {flip && elabOpen && fc2 && (
                        <details style={{ marginTop: 8 }}>
                          <summary
                            style={{
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            Why/How prompt
                          </summary>
                          <div
                            style={{ marginTop: 6, fontSize: 12, color: mu(D) }}
                          >
                            {generateWhyPrompt(fc2)}
                          </div>
                          <textarea
                            value={elabText}
                            onChange={(e) => setElabText(e.target.value)}
                            rows={2}
                            style={{ ...I(D, { marginTop: 6, fontSize: 12 }) }}
                            placeholder="Write 1–2 sentences…"
                          />
                          <button
                            onClick={() => {
                              try {
                                localStorage.setItem(
                                  "gcse:elab:" +
                                    user.replace(/\W/g, "-") +
                                    ":" +
                                    fc2.id,
                                  JSON.stringify({
                                    prompt: generateWhyPrompt(fc2),
                                    response: elabText,
                                    date: new Date().toISOString(),
                                  }),
                                );
                                showToast("Saved");
                              } catch (_) {}
                            }}
                            style={{
                              marginTop: 6,
                              padding: "6px 10px",
                              borderRadius: 8,
                              border: "none",
                              background: "#7c3aed",
                              color: "#fff",
                              fontSize: 12,
                            }}
                          >
                            Save
                          </button>
                        </details>
                      )}
                      {fc2 && (
                        <details style={{ marginTop: 8 }}>
                          <summary
                            style={{
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            Explain It
                          </summary>
                          <textarea
                            value={explainText}
                            onChange={(e) => setExplainText(e.target.value)}
                            rows={2}
                            style={{ ...I(D, { marginTop: 6, fontSize: 12 }) }}
                            placeholder="Explain this card in your own words…"
                          />
                          <button
                            onClick={() =>
                              setExplainFeedback(
                                verifyExplanation(
                                  fc2.a || fc2.text || fc2.q,
                                  explainText,
                                ),
                              )
                            }
                            style={{
                              marginTop: 6,
                              padding: "6px 10px",
                              borderRadius: 8,
                              border: "none",
                              background: "#0ea5e9",
                              color: "#fff",
                              fontSize: 12,
                            }}
                          >
                            Check explanation
                          </button>
                          <button
                            onClick={async () => {
                              const svg = await generateSVGDiagram(
                                stripHtml(fc2.a || fc2.text || fc2.q),
                                user,
                              );
                              setSvgPreview(svg);
                            }}
                            style={{
                              marginTop: 6,
                              marginLeft: 6,
                              padding: "6px 10px",
                              borderRadius: 8,
                              border: "none",
                              background: "#7c3aed",
                              color: "#fff",
                              fontSize: 12,
                            }}
                          >
                            PromptS VG
                          </button>
                          {explainFeedback && (
                            <div style={{ marginTop: 6, fontSize: 12 }}>
                              <div>{explainFeedback.correct}</div>
                              <div>{explainFeedback.missing}</div>
                            </div>
                          )}
                          {svgPreview && (
                            <div
                              style={{ marginTop: 8 }}
                              dangerouslySetInnerHTML={{
                                __html: String(svgPreview).includes("<svg")
                                  ? svgPreview
                                  : "",
                              }}
                            />
                          )}
                          {explainFeedback && (
                            <div style={{ marginTop: 6, fontSize: 12 }}>
                              <div>{explainFeedback.correct}</div>
                              <div>{explainFeedback.missing}</div>
                            </div>
                          )}
                        </details>
                      )}

                      {!flip && (
                        <div
                          style={{ display: "flex", gap: 12, marginTop: 12 }}
                        >
                          <button
                            onClick={() => {
                              setFlip(false);
                              setFcConf(null);
                              setFcHintLvl(0);
                              setFcSelfExp("");
                              setFcSelfOpen(false);
                              setFcIdx((i) =>
                                i > 0 ? i - 1 : activeCards.length - 1,
                              );
                            }}
                            style={{
                              flex: 1,
                              padding: "12px 0",
                              borderRadius: 12,
                              background: "transparent",
                              border: `1px solid ${bd2}`,
                              color: mu(D),
                              cursor: "pointer",
                              fontSize: 13,
                              minHeight: 44,
                            }}
                          >
                            {" "}
                            Prev
                          </button>
                          <button
                            onClick={() => {
                              setFlip(false);
                              setFcConf(null);
                              setFcHintLvl(0);
                              setFcSelfExp("");
                              setFcSelfOpen(false);
                              setFcIdx((i) =>
                                i < activeCards.length - 1 ? i + 1 : 0,
                              );
                            }}
                            style={{
                              flex: 1,
                              padding: "12px 0",
                              borderRadius: 12,
                              background: "transparent",
                              border: `1px solid ${bd2}`,
                              color: mu(D),
                              cursor: "pointer",
                              fontSize: 13,
                              minHeight: 44,
                            }}
                          >
                            Next{" "}
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          const c = { ...fcHist };
                          activeCards.forEach((x) => delete c[x.id]);
                          setFCH(c);
                          setFcIdx(0);
                          setFlip(false);
                          setFcConf(null);
                          setFcHintLvl(0);
                          showToast("Cardsreset");
                        }}
                        style={{
                          marginTop: 14,
                          display: "block",
                          margin: "14px auto0",
                          fontSize: 11,
                          color: mu(D),
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                      >
                        Reset all cards
                      </button>
                      <button
                        onClick={() => {
                          setShowReflection(true);
                          runAchievementCheck(null);
                        }}
                        style={{
                          display: "block",
                          margin: "8px auto0",
                          fontSize: 11,
                          color: "#7c3aed",
                          background: "none",
                          border: "1px solid #7c3aed",
                          borderRadius: 8,
                          padding: "5px 14px",
                          cursor: "pointer",
                        }}
                      >
                        End Session & Reflect
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

          {tab === "questions" && (
            <div className="fade-in">
              {admin && (
                <AdminBar
                  D={D}
                  actions={[
                    {
                      label: "＋ AddQuestion",
                      fn: () =>
                        setModal({ mode: "question", sectionId: section.id }),
                    },
                  ]}
                />
              )}
              {}
              {(() => {
                const ep = errorPatternsAll[subj?.id] || {};
                const epTotal = Object.values(ep).reduce((a, b) => a + b, 0);
                if (epTotal < 8) return null;
                const sorted = Object.entries(ep).sort((a, b) => b[1] - a[1]);
                const dominant = sorted[0][0];
                const pct = Math.round((sorted[0][1] / epTotal) * 100);
                const tips = {
                  "Knowledge Gap":
                    "Focus on recall — state definitions and key facts before explaining.",
                  "Command Word Error":
                    "Check the command word first. Evaluate = argue bothsides + conclude. Explain = WHY, not WHAT.",
                  "Application Error":
                    "Apply knowledge to the specific context. Link your answer to the scenario given.",
                  "Communication Error":
                    "Write in full sentences. Use PEEL: Point → Evidence →Explanation → Link.",
                };
                const icons = {
                  "Knowledge Gap": " ",
                  "Command Word Error": " ",
                  ApplicationError: " ",
                  "Communication Error": " ",
                };
                return (
                  <div
                    style={{
                      padding: "9px 14px",
                      borderRadius: 10,
                      marginBottom: 10,
                      background: D ? "rgba(245,158,11,.08)" : "#fffbeb",
                      border: "1px solid #f59e0b44",

                      fontSize: 12,
                      color: D ? "#fcd34d" : "#92400e",
                      lineHeight: 1.6,
                    }}
                  >
                    {icons[dominant]}{" "}
                    <strong>
                      Your main gap ({pct}% of errors): {dominant}
                    </strong>{" "}
                    —{tips[dominant]}
                  </div>
                );
              })()}
              {qs.length === 0 && (
                <div
                  style={{
                    ...C(D),
                    padding: 32,
                    textAlign: "center",
                    color: mu(D),
                    fontSize: 14,
                  }}
                >
                  No questions yet.{admin ? " Add one above." : ""}
                </div>
              )}
              {q &&
                (() => {
                  const qAOkey = detectAOLabel(q);
                  const qAOdef = AO_COLORS[qAOkey] || AO_COLORS.AO1;
                  const qCW = detectCW(q.text || "");
                  const hints3 = autoHints(q);
                  const wrongExpls = q.wrongAnswerExplanations || {};
                  return (
                    <>
                      {}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 8,
                          flexWrap: "wrap",
                          gap: 6,
                        }}
                      >
                        <span style={{ fontSize: 13, color: mu(D) }}>
                          Question {qIdx + 1} of {qs.length}
                        </span>
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            className="ao-badge"
                            style={{
                              background: D ? qAOdef.bgD : qAOdef.bg,
                              color: D ? qAOdef.txtD : qAOdef.txt,
                            }}
                          >
                            {qAOkey}
                          </span>
                          {qCW && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: 10,
                                background: D
                                  ? "rgba(99,102,241,.15)"
                                  : "#f5f3ff",
                                color: "#7c3aed",
                              }}
                            >
                              {qCW.word.toUpperCase()}
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              padding: "3px 10px",
                              borderRadius: 20,
                              background: subj.mid,
                              color: subj.dk,
                            }}
                          >
                            {q.marks} mark{q.marks !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      {}
                      {qCW && !qRes && (
                        <div
                          style={{
                            padding: "8px 12px",
                            borderRadius: 8,
                            marginBottom: 10,
                            background: D ? "rgba(99,102,241,.08)" : "#f5f3ff",
                            border: "1px solid #7c3aed44",

                            fontSize: 11,
                            color: D ? "#ddd6fe" : "#4c1d95",
                            lineHeight: 1.55,
                          }}
                        >
                          <strong>{qCW.word.toUpperCase()}:</strong> {qCW.tip}
                        </div>
                      )}
                      {admin && isAdminItem("questions", q) && (
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            justifyContent: "flex-end",
                            marginBottom: 8,
                          }}
                        >
                          <button
                            onClick={() =>
                              setModal({
                                mode: "question",
                                sectionId: section.id,
                                initialItem: q,
                              })
                            }
                            style={{
                              ...B("#7c3aed", true, {
                                fontSize: 12,
                                padding: "5px 12px",
                              }),
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteQ(q.id)}
                            style={{
                              ...B("#ef4444", true, {
                                fontSize: 12,
                                padding: "5px 12px",
                              }),
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}

                      <div style={{ ...C(D), padding: 24, marginBottom: 12 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 10,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              letterSpacing: "0.06em",
                              color: mu(D),
                              textTransform: "uppercase",
                            }}
                          >
                            {q.type === "mcq"
                              ? "Multiple Choice"
                              : q.type === "short"
                                ? "Short Answer"
                                : "ExtendedResponse"}
                          </span>
                          {q.year && (
                            <span style={{ fontSize: 11, color: mu(D) }}>
                              {q.year}
                            </span>
                          )}
                        </div>
                        {(q.images || []).map((img, ii) => (
                          <AnnotatedImage key={ii} img={img} D={D} />
                        ))}
                        {q.figure && (
                          <QuestionFigure
                            figure={q.figure}
                            D={D}
                            figureNumber={1}
                            DiagramRendererComp={DiagramRenderer}
                          />
                        )}
                        <ContentBlock
                          content={q.text}
                          D={D}
                          fontSize={15}
                          style={{ marginBottom: 18 }}
                        />
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            marginBottom: 12,
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            onClick={() => {
                              setTransferQuestion(generateTransferQuestion(q));
                              setQRes(null);
                              setSelOpt(null);
                              setTA("");
                            }}
                            style={{
                              fontSize: 12,
                              padding: "6px 12px",
                              borderRadius: 8,
                              border: "1px solid #7c3aed",
                              background: "transparent",
                              color: "#7c3aed",
                              cursor: "pointer",
                            }}
                          >
                            Apply It
                          </button>
                          {q &&
                            /how does .* relate to|relate[s]? to/i.test(
                              (q.text || "").toLowerCase(),
                            ) && (
                              <details>
                                <summary
                                  style={{ cursor: "pointer", fontSize: 12 }}
                                >
                                  Concept Map
                                </summary>
                                <ConceptMap
                                  x={(q.text || "X").split(" ")[2]}
                                  y={(q.text || "Y").split(" ").slice(-1)[0]}
                                  relation="relates to"
                                  D={D}
                                />
                              </details>
                            )}
                        </div>
                        {}
                        {q.type === "mcq" && (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 8,
                            }}
                          >
                            {q.options.map((opt, oi) => {
                              const sel = selOpt === oi,
                                correct = oi === q.answer,
                                rev = qRes != null;
                              let bg2 = D ? "#1c1d30" : "#f9fafb",
                                br2 = bd2,
                                co2 = tx(D);
                              if (rev && correct) {
                                bg2 = "#dcfce7";
                                br2 = "#22c55e";
                                co2 = "#15803d";
                              } else if (rev && sel && !correct) {
                                bg2 = "#fee2e2";
                                br2 = "#ef4444";
                                co2 = "#b91c1c";
                              } else if (rev && !correct && !sel) {
                                bg2 = D ? "#1c1d30" : "#f9fafb";
                                br2 = bd2;
                                co2 = mu(D);
                              }
                              return (
                                <div key={oi}>
                                  <button
                                    onClick={() => {
                                      if (!qRes) {
                                        const ok = oi === q.answer;
                                        setSelOpt(oi);
                                        setQRes(ok ? "correct" : "wrong");
                                        markTodayActive();
                                        updateAdaptiveLevel(user, subj.id, ok);
                                        updateLadderLevel(
                                          user,
                                          ladderTopicId,
                                          ok,
                                        );
                                        setLadderTick((v) => v + 1);
                                        logEvent("question_answered", { subjectId: subj.id, sectionId: section.id, correct: ok });
                                        setStats((s) => {
                                          const wq = { ...s.weakQ };
                                          wq[section.id] = {
                                            wrong:
                                              (wq[section.id]?.wrong || 0) +
                                              (ok ? 0 : 1),
                                            total:
                                              (wq[section.id]?.total || 0) + 1,
                                          };
                                          const ss = { ...s.subjStats };
                                          ss[subj.id] = {
                                            ...ss[subj.id],
                                            qS:
                                              (ss[subj.id]?.qS || 0) +
                                              (ok ? 1 : 0),
                                            qM: (ss[subj.id]?.qM || 0) + 1,
                                            fcC: ss[subj.id]?.fcC || 0,
                                            fcT: ss[subj.id]?.fcT || 0,
                                          };
                                          return {
                                            ...s,
                                            qS: s.qS + (ok ? 1 : 0),
                                            qM: s.qM + 1,
                                            weakQ: wq,
                                            subjStats: ss,
                                          };
                                        });
                                      }
                                    }}
                                    style={{
                                      width: "100%",
                                      textAlign: "left",
                                      padding: "11px 16px",
                                      borderRadius: 10,
                                      border: `1.5px solid ${br2}`,
                                      background: bg2,
                                      cursor: qRes ? "default" : "pointer",
                                      color: co2,
                                      fontSize: 13,
                                      transition: "all .15s",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 10,
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontFamily: "monospace",
                                        fontSize: 11,
                                        opacity: 0.7,
                                        flexShrink: 0,
                                      }}
                                    >
                                      {"ABCD"[oi]}.
                                    </span>
                                    <span style={{ flex: 1 }}>{opt}</span>
                                    {rev && correct && (
                                      <span
                                        style={{ fontSize: 14, flexShrink: 0 }}
                                      ></span>
                                    )}
                                    {rev && sel && !correct && (
                                      <span
                                        style={{ fontSize: 14, flexShrink: 0 }}
                                      ></span>
                                    )}
                                  </button>
                                  {}
                                  {rev && (correct || sel) && (
                                    <div
                                      className="hint-slide"
                                      style={{
                                        marginTop: 4,
                                        padding: "8px 12px",
                                        borderRadius: 8,
                                        fontSize: 11,
                                        lineHeight: 1.6,
                                        background: correct
                                          ? D
                                            ? "rgba(16,185,129,.1)"
                                            : "#f0fdf4"
                                          : D
                                            ? "rgba(239,68,68,.1)"
                                            : "#fef2f2",
                                        color: correct
                                          ? D
                                            ? "#6ee7b7"
                                            : "#15803d"
                                          : D
                                            ? "#fca5a5"
                                            : "#b91c1c",
                                      }}
                                    >
                                      {correct ? (
                                        <>
                                          <strong> Correct.</strong>{" "}
                                          {q.explanation ||
                                            "This is the right answer."}
                                        </>
                                      ) : (
                                        <>
                                          <strong> Incorrect.</strong>{" "}
                                          {wrongExpls[String(oi)] ||
                                            `The correct
answer is ${q.options[q.answer]}${q.explanation ? " — " + q.explanation : "."}`}
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {}
                        {(q.type === "short" || q.type === "extended") && (
                          <div>
                            {}
                            {!qRes && (
                              <div style={{ marginBottom: 10 }}>
                                {qConf === null ? (
                                  <div
                                    style={{
                                      padding: "10px 14px",
                                      borderRadius: 10,
                                      background: D ? "#191a2b" : "#fafafa",
                                      border: `1px solid ${D ? "#374151" : "#e5e7eb"}`,
                                    }}
                                  >
                                    <p
                                      style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: mu(D),
                                        marginBottom: 8,
                                      }}
                                    >
                                      How confident are you in your answer?
                                    </p>
                                    <div style={{ display: "flex", gap: 6 }}>
                                      {[
                                        {
                                          v: 1,
                                          l: "Not sure",
                                          c: "#ef4444",
                                          i: " ",
                                        },
                                        {
                                          v: 2,
                                          l: "Fairlysure",
                                          c: "#f59e0b",
                                          i: " ",
                                        },
                                        {
                                          v: 3,
                                          l: "Confident",
                                          c: "#10b981",
                                          i: " ",
                                        },
                                      ].map((opt) => (
                                        <button
                                          key={opt.v}
                                          onClick={() => setQConf(opt.v)}
                                          style={{
                                            flex: 1,
                                            padding: "7px 4px",
                                            borderRadius: 9,
                                            border: `1.5px solid ${opt.c}22`,
                                            background: D ? "#13131f" : "#fff",
                                            cursor: "pointer",
                                            textAlign: "center",
                                            transition: "border-color .15s",
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor =
                                              opt.c;
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor =
                                              opt.c + "22";
                                          }}
                                        >
                                          <div style={{ fontSize: 16 }}>
                                            {opt.i}
                                          </div>
                                          <div
                                            style={{
                                              fontSize: 10,
                                              fontWeight: 700,
                                              color: opt.c,
                                              marginTop: 2,
                                            }}
                                          >
                                            {opt.l}
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    style={{
                                      fontSize: 10,
                                      color: mu(D),
                                      marginBottom: 4,
                                      textAlign: "right",
                                    }}
                                  >
                                    Confidence:{" "}
                                    {
                                      ["Not sure", "Fairly sure", "Confident"][
                                        qConf - 1
                                      ]
                                    }
                                  </div>
                                )}
                              </div>
                            )}
                            {}
                            {!qRes && (
                              <div style={{ marginBottom: 10 }}>
                                {qHintLvl === 0 ? (
                                  <button
                                    onClick={() => setQHintLvl(1)}
                                    style={{
                                      fontSize: 11,
                                      color: mu(D),
                                      background: "none",
                                      border: `1px solid ${D ? "#374151" : "#d1d5db"}`,
                                      borderRadius: 8,
                                      padding: "5px 12px",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Strategy hint
                                  </button>
                                ) : qHintLvl === 1 ? (
                                  <div
                                    className="hint-slide"
                                    style={{
                                      padding: "9px 13px",
                                      borderRadius: 10,
                                      background: D
                                        ? "rgba(245,158,11,.1)"
                                        : "#fffbeb",
                                      border: "1px solid #f59e0b33",
                                      fontSize: 12,
                                      color: D ? "#fcd34d" : "#92400e",
                                      lineHeight: 1.6,
                                    }}
                                  >
                                    <strong>Strategy:</strong> {hints3[0]}
                                    <button
                                      onClick={() => setQHintLvl(2)}
                                      style={{
                                        display: "block",
                                        marginTop: 5,
                                        fontSize: 11,
                                        color: mu(D),
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        textDecoration: "underline",
                                      }}
                                    >
                                      Need more help?
                                    </button>
                                  </div>
                                ) : qHintLvl === 2 ? (
                                  <div
                                    className="hint-slide"
                                    style={{
                                      padding: "9px 13px",
                                      borderRadius: 10,
                                      background: D
                                        ? "rgba(245,158,11,.1)"
                                        : "#fffbeb",
                                      border: "1px solid #f59e0b44",
                                      fontSize: 12,
                                      color: D ? "#fcd34d" : "#92400e",
                                      lineHeight: 1.6,
                                    }}
                                  >
                                    <strong>Strategy:</strong> {hints3[0]}
                                    <br />
                                    <strong>Subject clue:</strong> {hints3[1]}
                                    <button
                                      onClick={() => setQHintLvl(3)}
                                      style={{
                                        display: "block",
                                        marginTop: 5,
                                        fontSize: 11,
                                        color: mu(D),
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        textDecoration: "underline",
                                      }}
                                    >
                                      Show first mark
                                    </button>
                                  </div>
                                ) : (
                                  <div
                                    className="hint-slide"
                                    style={{
                                      padding: "9px 13px",
                                      borderRadius: 10,
                                      background: D
                                        ? "rgba(245,158,11,.12)"
                                        : "#fffbeb",
                                      border: "1px solid #f59e0b55",
                                      fontSize: 12,
                                      color: D ? "#fcd34d" : "#92400e",
                                      lineHeight: 1.6,
                                    }}
                                  >
                                    <strong>Strategy:</strong> {hints3[0]}
                                    <br />
                                    <strong>Subject clue:</strong> {hints3[1]}
                                    <br />
                                    <strong>First mark:</strong> {hints3[2]}
                                  </div>
                                )}
                              </div>
                            )}

                            <textarea
                              value={textAns}
                              onChange={(e) => setTA(e.target.value)}
                              disabled={!!qRes}
                              rows={q.type === "extended" ? 7 : 3}
                              placeholder={`Write your answer here… [${q.marks}
mark${q.marks !== 1 ? "s" : ""}]`}
                              style={{
                                ...I(D, {
                                  resize: "vertical",
                                  lineHeight: 1.65,
                                }),
                              }}
                            />
                            {!qRes && (
                              <button
                                onClick={async () => {
                                  if (!textAns.trim()) return;
                                  setMark(true);
                                  markTodayActive();
                                  trackEvent("question_submitted", {
                                    sectionId: section?.id,
                                    subjectId: subjDef?.id,
                                    tab: "questions",
                                  });
                                  try {
                                    const r = await markAnswer(q, textAns);
                                    const errType =
                                      typeof classifyError === "function"
                                        ? await Promise.resolve(
                                            classifyError(
                                              q,
                                              textAns,
                                              q.markScheme,
                                            ),
                                          ).catch(() => null)
                                        : detectErrorType(
                                            q.text,
                                            textAns,
                                            q.markScheme,
                                            r?.missedPoints,
                                          );
                                    if (errType) {
                                      incrementErrorPattern(
                                        user,
                                        subj.id,
                                        errType,
                                      );
                                      r.errorType = errType;
                                    }
                                    const pct =
                                      q.marks > 0 ? r.score / q.marks : 0;
                                    updateAdaptiveLevel(
                                      user,
                                      subj.id,
                                      pct >= 0.5,
                                    );
                                    updateLadderLevel(
                                      user,
                                      ladderTopicId,
                                      pct >= 0.5,
                                    );
                                    setLadderTick((v) => v + 1);
                                    setQRes(r);
                                    setStats((s) => {
                                      const wq = { ...s.weakQ };
                                      wq[section.id] = {
                                        wrong:
                                          (wq[section.id]?.wrong || 0) +
                                          (pct < 0.5 ? 1 : 0),
                                        total: (wq[section.id]?.total || 0) + 1,
                                      };
                                      const ss = { ...s.subjStats };
                                      ss[subj.id] = {
                                        ...ss[subj.id],
                                        qS:
                                          (ss[subj.id]?.qS || 0) +
                                          (r.score || 0),
                                        qM: (ss[subj.id]?.qM || 0) + q.marks,
                                        fcC: ss[subj.id]?.fcC || 0,
                                        fcT: ss[subj.id]?.fcT || 0,
                                      };
                                      return {
                                        ...s,
                                        qS: s.qS + (r.score || 0),
                                        qM: s.qM + q.marks,
                                        weakQ: wq,
                                        subjStats: ss,
                                      };
                                    });
                                  } catch (e) {
                                    setQRes({
                                      score: "?",
                                      feedback:
                                        "ReviseIQ AI unavailable — self-mark using the mark scheme below.",
                                      missedPoints: [],
                                      modelAnswer: q.sampleAnswer || "",
                                      examTip: "",
                                    });
                                  }
                                  setMark(false);
                                }}
                                disabled={!textAns.trim() || marking}
                                style={{
                                  marginTop: 10,
                                  width: "100%",
                                  background:
                                    textAns.trim() && !marking
                                      ? "#7c3aed"
                                      : "#9ca3af",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: 12,
                                  padding: "12px 0",
                                  fontSize: 14,
                                  fontWeight: 600,
                                  cursor:
                                    textAns.trim() && !marking
                                      ? "pointer"
                                      : "not-allowed",
                                }}
                              >
                                {marking
                                  ? "Marking with ReviseIQ AI…"
                                  : "Submit for ReviseIQ AI Marking→"}
                              </button>
                            )}

                            {qRes &&
                              typeof qRes === "object" &&
                              qRes.feedback && (
                                <div
                                  style={{
                                    marginTop: 14,
                                    ...C(D),
                                    padding: 20,
                                    background: D ? "#1a1a2e" : "#f8f7ff",
                                    borderColor: "#7c3aed",
                                  }}
                                  className="fade-in"
                                >
                                  {}
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "flex-start",
                                      marginBottom: 10,
                                      flexWrap: "wrap",
                                      gap: 8,
                                    }}
                                  >
                                    <span
                                      style={{ fontWeight: 700, fontSize: 15 }}
                                    >
                                      ReviseIQ AI Marking
                                    </span>
                                    <div style={{ textAlign: "right" }}>
                                      <div
                                        style={{
                                          fontSize: 24,
                                          fontWeight: 900,
                                          lineHeight: 1,
                                          color:
                                            Number(qRes.score) >= q.marks * 0.7
                                              ? "#16a34a"
                                              : Number(qRes.score) >=
                                                  q.marks * 0.4
                                                ? "#d97706"
                                                : "#dc2626",
                                        }}
                                      >
                                        {qRes.score}/{q.marks}
                                      </div>
                                      {qConf && (
                                        <div
                                          style={{
                                            fontSize: 10,
                                            color: mu(D),
                                            marginTop: 2,
                                          }}
                                        >
                                          {(() => {
                                            const ap =
                                              q.marks > 0
                                                ? (Number(qRes.score) || 0) /
                                                  q.marks
                                                : 0;
                                            if (qConf === 3 && ap >= 0.7)
                                              return "Well-calibrated!";
                                            if (qConf === 1 && ap >= 0.7)
                                              return "Better than you thought!";
                                            if (qConf === 3 && ap < 0.5)
                                              return "Overconfident — review this";
                                            return "Keep practising";
                                          })()}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <p
                                    style={{
                                      fontSize: 13,
                                      lineHeight: 1.7,
                                      color: D ? "#d1d5db" : "#374151",
                                      marginBottom: 10,
                                    }}
                                  >
                                    {qRes.feedback}
                                  </p>
                                  {}
                                  {qRes.missedPoints?.length > 0 && (
                                    <div
                                      style={{
                                        marginBottom: 12,
                                        padding: "10px 14px",
                                        borderRadius: 10,
                                        background: D
                                          ? "rgba(239,68,68,.08)"
                                          : "#fef2f2",
                                        border: "1px solid #ef444422",
                                      }}
                                    >
                                      <p
                                        style={{
                                          fontSize: 11,
                                          fontWeight: 700,
                                          color: "#dc2626",
                                          marginBottom: 6,
                                          textTransform: "uppercase",
                                          letterSpacing: "0.05em",
                                        }}
                                      >
                                        Points missed:
                                      </p>
                                      {qRes.missedPoints.map((pt, i) => (
                                        <div
                                          key={i}
                                          style={{
                                            fontSize: 12,
                                            color: "#dc2626",
                                            display: "flex",
                                            gap: 8,
                                            marginBottom: 3,
                                            lineHeight: 1.5,
                                          }}
                                        >
                                          <span style={{ flexShrink: 0 }}>
                                            •
                                          </span>
                                          <span>{pt}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {qRes.examTip && (
                                    <div
                                      style={{
                                        padding: "9px 12px",
                                        borderRadius: 10,
                                        background: D ? "#1e2f4a" : "#eff6ff",
                                        border: "1px solid #bfdbfe",
                                        marginBottom: 12,
                                      }}
                                    >
                                      <p
                                        style={{
                                          fontSize: 12,
                                          color: "#1d4ed8",
                                        }}
                                      >
                                        <strong>Exam tip:</strong>
                                        {qRes.examTip}
                                      </p>
                                    </div>
                                  )}
                                  {qRes.errorType && (
                                    <div
                                      style={{
                                        padding: "8px 12px",
                                        borderRadius: 10,
                                        background: D
                                          ? "rgba(245,158,11,.1)"
                                          : "#fffbeb",
                                        border: "1px solid #f59e0b55",
                                        marginBottom: 10,
                                        fontSize: 12,
                                        color: D ? "#fcd34d" : "#92400e",
                                      }}
                                    >
                                      Main error type:{" "}
                                      <strong>{qRes.errorType}</strong>
                                    </div>
                                  )}
                                  <details style={{ marginBottom: 8 }}>
                                    <summary
                                      style={{
                                        cursor: "pointer",
                                        fontWeight: 700,
                                        fontSize: 12,
                                      }}
                                    >
                                      Structure Diagram
                                    </summary>
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        flexWrap: "wrap",
                                        marginTop: 8,
                                      }}
                                    >
                                      {(
                                        qRes.structureDiagram || [
                                          "Point",
                                          "Evidence",
                                          "Explanation",
                                          "Application",
                                        ]
                                      ).map((s, idx) => (
                                        <React.Fragment key={idx}>
                                          <span
                                            style={{
                                              padding: "6px 10px",
                                              borderRadius: 8,
                                              background: D
                                                ? "#191a2b"
                                                : "#f5f3ff",
                                              fontSize: 11,
                                              fontWeight: 600,
                                            }}
                                          >
                                            {s}
                                          </span>
                                          {idx <
                                            (qRes.structureDiagram || [])
                                              .length -
                                              1 && (
                                            <span
                                              style={{ color: mu(D) }}
                                            ></span>
                                          )}
                                        </React.Fragment>
                                      ))}
                                    </div>
                                  </details>
                                  <details style={{ marginBottom: 8 }}>
                                    <summary
                                      style={{
                                        cursor: "pointer",
                                        fontWeight: 700,
                                        fontSize: 12,
                                      }}
                                    >
                                      Progressive Reveal
                                    </summary>
                                    <div style={{ marginTop: 8 }}>
                                      <ProgressiveDiagram
                                        D={D}
                                        steps={(
                                          qRes.structureDiagram || []
                                        ).map(function (s) {
                                          return { text: s, svg: null };
                                        })}
                                      />
                                    </div>
                                  </details>
                                  <details style={{ marginBottom: 8 }}>
                                    <summary
                                      style={{
                                        cursor: "pointer",
                                        fontWeight: 700,
                                        fontSize: 12,
                                      }}
                                    >
                                      Annotated Model Answer
                                    </summary>
                                    <div
                                      style={{
                                        marginTop: 8,
                                        lineHeight: 1.8,
                                        fontSize: 13,
                                      }}
                                    >
                                      {(Array.isArray(qRes.annotatedAnswer)
                                        ? qRes.annotatedAnswer
                                        : []
                                      ).map((seg, idx) => {
                                        const bg =
                                          seg.type === "point"
                                            ? "#dcfce7"
                                            : seg.type === "evidence"
                                              ? "#dbeafe"
                                              : "#fef3c7";
                                        return (
                                          <span
                                            key={idx}
                                            style={{
                                              background: bg,
                                              padding: "1px 4px",
                                              borderRadius: 4,
                                              marginRight: 4,
                                            }}
                                          >
                                            {seg.text}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  </details>
                                  <details style={{ marginBottom: 8 }}>
                                    <summary
                                      style={{
                                        cursor: "pointer",
                                        fontWeight: 700,
                                        fontSize: 12,
                                      }}
                                    >
                                      Comparison Table
                                    </summary>
                                    <table
                                      style={{
                                        width: "100%",
                                        borderCollapse: "collapse",
                                        marginTop: 8,
                                        fontSize: 12,
                                      }}
                                    >
                                      <thead>
                                        <tr>
                                          <th
                                            style={{
                                              border: "1px solid #cbd5e1",
                                              padding: 6,
                                              textAlign: "left",
                                            }}
                                          >
                                            Student Answer
                                          </th>
                                          <th
                                            style={{
                                              border: "1px solid #cbd5e1",
                                              padding: 6,
                                              textAlign: "left",
                                            }}
                                          >
                                            Mark Scheme Expectation
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(qRes.comparisonTable || []).map(
                                          (row, ri) => (
                                            <tr key={ri}>
                                              <td
                                                style={{
                                                  border: "1px solid #cbd5e1",
                                                  padding: 6,
                                                }}
                                              >
                                                {row.student}
                                              </td>
                                              <td
                                                style={{
                                                  border: "1px solid #cbd5e1",
                                                  padding: 6,
                                                }}
                                              >
                                                {row.expectation}
                                              </td>
                                            </tr>
                                          ),
                                        )}
                                      </tbody>
                                    </table>
                                  </details>
                                  <details style={{ marginBottom: 12 }}>
                                    <summary
                                      style={{
                                        cursor: "pointer",
                                        fontWeight: 700,
                                        fontSize: 12,
                                      }}
                                    >
                                      Worked Solution
                                    </summary>
                                    <pre
                                      style={{
                                        marginTop: 8,
                                        whiteSpace: "pre-wrap",
                                        fontSize: 12,
                                        fontFamily: "IBMPlex Mono, monospace",
                                        background: D ? "#0a0a14" : "#f8fafc",
                                        padding: 10,
                                        borderRadius: 8,
                                      }}
                                    >
                                      {qRes.workedSolution ||
                                        qRes.modelAnswer ||
                                        q.sampleAnswer ||
                                        ""}
                                    </pre>
                                  </details>
                                  {}

                                  {!qSelfDone ? (
                                    <div style={{ marginBottom: 12 }}>
                                      <p
                                        style={{
                                          fontSize: 12,
                                          fontWeight: 600,
                                          color: D ? "#ddd6fe" : "#5b21b6",
                                          marginBottom: 6,
                                        }}
                                      >
                                        Before the model answer — write one
                                        thing you missed or would do
                                        differently:
                                      </p>
                                      <textarea
                                        value={qSelfExp}
                                        onChange={(e) =>
                                          setQSelfExp(e.target.value)
                                        }
                                        rows={2}
                                        placeholder="e.g. 'I forgot to link cause to effect' or 'I missed units'"
                                        style={{
                                          ...I(D, {
                                            resize: "none",
                                            fontSize: 12,
                                            marginBottom: 6,
                                          }),
                                        }}
                                      />
                                      <button
                                        onClick={() => setQSelfDone(true)}
                                        style={{
                                          fontSize: 12,
                                          fontWeight: 600,
                                          padding: "7px 16px",
                                          borderRadius: 8,
                                          border: "none",
                                          background: "#7c3aed",
                                          color: "#fff",
                                          cursor: "pointer",
                                        }}
                                      >
                                        Save &amp; see model answer
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      {qSelfExp && (
                                        <div
                                          style={{
                                            padding: "8px 12px",
                                            borderRadius: 8,
                                            marginBottom: 10,
                                            background: D
                                              ? "rgba(99,102,241,.1)"
                                              : "#f5f3ff",
                                            border: "1px solid #7c3aed22",
                                            fontSize: 11,
                                            color: D ? "#c4b5fd" : "#5b21b6",
                                          }}
                                        >
                                          <strong>Your reflection:</strong>{" "}
                                          {qSelfExp}
                                        </div>
                                      )}
                                      <button
                                        onClick={() => setSmMdl(!showMdl)}
                                        style={{
                                          fontSize: 12,
                                          color: mu(D),
                                          background: "none",
                                          border: "none",
                                          cursor: "pointer",
                                          textDecoration: "underline",
                                          marginBottom: 8,
                                          display: "block",
                                        }}
                                      >
                                        {showMdl ? "Hide" : "Show"} model answer
                                      </button>
                                      {showMdl && (
                                        <div
                                          style={{
                                            padding: "12px 14px",
                                            borderRadius: 10,
                                            background: D
                                              ? "#13131f"
                                              : "#f9fafb",
                                            border: `1px solid ${bd2}`,
                                            marginBottom: 6,
                                          }}
                                        >
                                          <p
                                            style={{
                                              fontSize: 10,
                                              fontWeight: 700,
                                              color: mu(D),
                                              marginBottom: 6,
                                              textTransform: "uppercase",
                                              letterSpacing: "0.05em",
                                            }}
                                          >
                                            Model Answer
                                          </p>
                                          <ContentBlock
                                            content={
                                              qRes.modelAnswer ||
                                              q.sampleAnswer ||
                                              ""
                                            }
                                            D={D}
                                            fontSize={13}
                                          />
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                      {qRes && (
                        <button
                          onClick={() => {
                            setQIdx((i) => (i < qs.length - 1 ? i + 1 : 0));
                            setQRes(null);
                            setSelOpt(null);
                            setTA("");
                            setSmMdl(false);
                            setQHintLvl(0);
                            setQConf(null);
                            setQSelfExp("");
                            setQSelfDone(false);
                            setTransferQuestion(null);
                          }}
                          style={{
                            width: "100%",
                            ...B(subj.accent, false, {
                              padding: "12px 0",
                              borderRadius: 12,
                              fontSize: 14,
                            }),
                          }}
                        >
                          {qIdx < qs.length - 1
                            ? "Next Question →"
                            : "↺ Restart"}
                        </button>
                      )}
                    </>
                  );
                })()}
            </div>
          )}
        </div>
        {modal?.mode === "note" && (
          <CreateModal
            mode="note"
            D={D}
            subjects={subjects}
            initialItem={modal.initialItem}
            onClose={() => setModal(null)}
            onSave={(item) =>
              modal.initialItem
                ? editInSection(modal.sectionId, "notes", item)
                : addToSection(modal.sectionId, "notes", item)
            }
          />
        )}
        {modal?.mode === "flashcard" && (
          <CreateModal
            mode="flashcard"
            D={D}
            subjects={subjects}
            initialItem={modal.initialItem}
            onClose={() => setModal(null)}
            onSave={(item) =>
              modal.initialItem
                ? editInSection(modal.sectionId, "flashcards", item)
                : addToSection(modal.sectionId, "flashcards", item)
            }
          />
        )}
        {modal?.mode === "question" && (
          <CreateModal
            mode="question"
            D={D}
            subjects={subjects}
            initialItem={modal.initialItem}
            onClose={() => setModal(null)}
            onSave={(item) =>
              modal.initialItem
                ? editInSection(modal.sectionId, "questions", item)
                : addToSection(modal.sectionId, "questions", item)
            }
          />
        )}
      </div>
    );
  }
  if (screen === "dashboard") {
    const planRow = { display: "flex", gap: 10, flexWrap: "wrap", margin: "4px 0 18px" };
    const planBtn = { display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 12, border: "1px solid " + (D ? "rgba(255,255,255,.1)" : "rgba(16,24,40,.1)"), background: D ? "rgba(255,255,255,.05)" : "#fff", color: D ? "#eef1fb" : "#0f1729", fontSize: 13.5, fontWeight: 700, cursor: "pointer" };
    const fcPct = stats.fcT > 0 ? Math.round((stats.fcC / stats.fcT) * 100) : 0;
    const qPct = stats.qM > 0 ? Math.round((stats.qS / stats.qM) * 100) : 0;
    const totalCustom = Object.values(boardData).reduce(
      (a, b) => a + (b.custom?.length || 0),
      0,
    );
    const totalPapers = Object.values(boardData).reduce(
      (a, b) => a + (b.papers?.length || 0),
      0,
    );

    const longestStreak = calcLongestStreak(activityDates);

    const hmWeeks = [];
    const hmToday = new Date();
    hmToday.setHours(0, 0, 0, 0);
    const hmDow = hmToday.getDay() === 0 ? 6 : hmToday.getDay() - 1;
    const hmStart = new Date(hmToday);
    hmStart.setDate(hmStart.getDate() - hmDow - 15 * 7);
    for (var hw = 0; hw < 16; hw++) {
      const wk = [];
      for (var hd = 0; hd < 7; hd++) {
        const dt = new Date(hmStart);
        dt.setDate(dt.getDate() + hw * 7 + hd);
        const k = dt.toISOString().slice(0, 10);
        const cnt = activityCounts[k] || 0;
        wk.push({ k, cnt, isToday: k === todayStr() });
      }
      hmWeeks.push(wk);
    }
    function hmColor(cnt, D) {
      if (cnt === 0) return D ? "#191a2b" : "#f3f4f6";
      if (cnt === 1) return D ? "#7c3aed" : "#c4b5fd";
      if (cnt === 2) return D ? "#6d28d9" : "#a78bfa";
      if (cnt >= 3) return D ? "#4c1d95" : "#7c3aed";
      return D ? "#191a2b" : "#f3f4f6";
    }

    const hmMonthLabels = [];
    hmWeeks.forEach(function (wk, wi) {
      const mo = new Date(wk[0].k + "T12:00:00").toLocaleDateString("en-GB", {
        month: "short",
      });
      if (wi === 0 || mo !== hmMonthLabels[hmMonthLabels.length - 1].label) {
        hmMonthLabels.push({ wi, label: mo });
      }
    });

    const estSecsFc = stats.fcT * 30;
    const estSecsQ = stats.qM * 180;
    const estTotalMins = Math.round((estSecsFc + estSecsQ) / 60);
    const estHrs = Math.floor(estTotalMins / 60);
    const estMin = estTotalMins % 60;
    const estLabel =
      estHrs > 0
        ? estHrs + "h " + (estMin > 0 ? estMin + "m" : "")
        : estMin + "m";

    const subjsWithData = ALL_SUBJECTS.filter(function (s) {
      return gradeSnapshots.some(function (snap) {
        return snap.grades && snap.grades[s.id] != null;
      });
    });

    const trajSubjs = subjsWithData.slice(0, 6);
    const trajData = gradeSnapshots.map(function (snap) {
      const pt = { date: snap.date.slice(5) };
      trajSubjs.forEach(function (s) {
        if (snap.grades && snap.grades[s.id] != null) {
          var g = pctToGrade(snap.grades[s.id]);
          var gNum = g === "U" ? 0 : isNaN(parseInt(g)) ? 0 : parseInt(g);
          pt[s.id] = gNum;
        }
      });
      return pt;
    });

    const radarData = ALL_SUBJECTS.map(function (s) {
      const ss = stats.subjStats && stats.subjStats[s.id];
      const pct = ss && ss.qM > 0 ? Math.round((ss.qS / ss.qM) * 100) : 0;
      return {
        subject: s.icon + " " + s.name.split(" ")[0],
        pct: pct,
        fullName: s.name,
      };
    });
    const hasRadarData = radarData.some(function (r) {
      return r.pct > 0;
    });
    const dominantErrorSummary = (function () {
      if (typeof window === "undefined" || !user) return null;
      var all = {
        "Knowledge Gap": 0,
        "Application Error": 0,
        "Command Word Error": 0,
        CommunicationError: 0,
      };
      ALL_SUBJECTS.forEach(function (s) {
        try {
          var obj = JSON.parse(
            localStorage.getItem(SK_ERROR_PATTERNS(user, s.id)) || "{}",
          );
          Object.keys(all).forEach(function (k) {
            all[k] += Number(obj[k] || 0);
          });
        } catch (_) {}
      });
      var total = Object.values(all).reduce((a, b) => a + b, 0);
      if (total < 10) return null;
      var top = Object.entries(all).sort((a, b) => b[1] - a[1])[0];
      return { type: top[0], pct: Math.round((top[1] / total) * 100) };
    })();
    return (
      <div
        style={{ minHeight: "100vh", background: bg, color: tx(D) }}
        className="fade-in"
      >
        <Header {...hProps} />
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
          <button
            onClick={() => setScreen("home")}
            style={{
              fontSize: 13,
              color: mu(D),
              background: "none",
              border: "none",
              cursor: "pointer",
              marginBottom: 24,
            }}
          >
            {" "}
            Home
          </button>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 22 }}>
            Progress Dashboard
          </h2>
          {(function () {
            const _preds = Object.values(calibrationData || {}).flat();
            const _brier = _preds.length >= 3 ? calcBrierScore(_preds) : null;
            const _calVal = _brier != null ? Math.max(0, Math.min(1, 1 - _brier / 0.35)) : 0.5;
            const _mp = _preds.length ? _preds.reduce(function (a, d) { return a + Number((d && d.pred) || 0); }, 0) / _preds.length : 0;
            const _mo = _preds.length ? _preds.reduce(function (a, d) { return a + Number((d && d.outcome) || 0); }, 0) / _preds.length : 0;
            const _bias = _mp - _mo;
            const _rd = subjects.map(function (s) { try { return calculateExamReadiness(s.id, allSections, fcHist, stats, calibrationData[s.id], timetableExams)?.score ?? 0; } catch (e) { return 0; } });
            const _readiness = _rd.length ? Math.round(_rd.reduce(function (a, b) { return a + b; }, 0) / _rd.length) : 0;
            const _topics = subjects.map(function (s) { let sc = 50, tt = 0; try { sc = calculateExamReadiness(s.id, allSections, fcHist, stats, calibrationData[s.id], timetableExams)?.score ?? 50; } catch (e) {} try { tt = (calculateMastery(s.id, allSections, fcHist, stats) || {}).totalTopics || 0; } catch (e) {} return { id: s.id, name: (s.name || "").split(" ")[0], retention: sc / 100, size: Math.min(1, tt / 12) }; });
            const wrapSt = { margin: "24px 0 8px" };
            const kicker = { fontSize: 12.5, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: D ? "#98a2bd" : "#5b6478", marginBottom: 12 };
            const tileGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 };
            const panelGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginTop: 14 };
            const panelCard = { padding: 20, borderRadius: 22, background: D ? "rgba(255,255,255,.04)" : "#fff", border: "1px solid " + (D ? "rgba(255,255,255,.07)" : "rgba(16,24,40,.06)"), display: "flex", flexDirection: "column", gap: 10, alignItems: "center" };
            const panelTitle = { alignSelf: "flex-start", fontSize: 13, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: D ? "#98a2bd" : "#5b6478" };
            const emptyP = { fontSize: 13, color: D ? "#98a2bd" : "#5b6478", lineHeight: 1.5, textAlign: "center", margin: "20px 0" };
            return (
              <section style={wrapSt}>
                <div style={planRow}>
                  <button style={planBtn} onClick={() => setScreen("timetable")}>📅 Exam timetable</button>
                  <button style={planBtn} onClick={() => setScreen("target")}>🎯 Target grades</button>
                </div>
                <div style={kicker}>Your signal</div>
                <div style={tileGrid}>
                  <StatTile icon="🔥" figure={streak} caption="Day streak" accent="#f59e0b" D={D} />
                  <StatTile icon="🎯" figure={qPct + "%"} caption="Question accuracy" accent="#5b54f0" D={D} />
                  <StatTile icon="🃏" figure={fcPct + "%"} caption="Flashcard recall" accent="#8b5cf6" D={D} />
                  <StatTile icon="🚀" figure={_readiness + "%"} caption="Exam readiness" accent="#d946ef" D={D} />
                </div>
                <div style={panelGrid}>
                  <div style={panelCard}>
                    <div style={panelTitle}>Calibration</div>
                    {_preds.length >= 3 ? (
                      <CalibrationDial value={_calVal} bias={_bias} size={220} D={D} />
                    ) : (
                      <p style={emptyP}>Rate your confidence on a few flashcards to see how well it predicts your actual performance.</p>
                    )}
                  </div>
                  <div style={panelCard}>
                    <div style={panelTitle}>Mastery constellation</div>
                    {_topics.length ? (
                      <MasteryConstellation topics={_topics} width={520} height={300} D={D} onSelect={function (n) { const idx = subjects.findIndex(function (s) { return s.id === n.id; }); if (idx >= 0) { setSubIdx(idx); setScreen("subject"); } }} />
                    ) : (
                      <p style={emptyP}>Add subjects to map your topic mastery as a living constellation.</p>
                    )}
                  </div>
                </div>
              </section>
            );
          })()}
          <LearningTimeline
            D={D}
            sessions={Object.keys(activityCounts || {})
              .map(function (k) {
                return {
                  date: k,
                  subject: "Mixed",
                  duration: (activityCounts[k] || 0) * 25,
                  topics: ["Revision"],
                };
              })
              .sort((a, b) => a.date.localeCompare(b.date))
              .slice(-80)}
            exams={timetableExams || []}
            subjects={subjects}
            onSelect={setTimelineSelected}
          />
          {timelineSelected && (
            <div
              style={{
                ...C(D),
                padding: 10,
                marginTop: 8,
                marginBottom: 12,
                fontSize: 12,
              }}
            >
              Session:
              {timelineSelected.date} · {timelineSelected.duration} min ·{" "}
              {timelineSelected.subject}
            </div>
          )}
          {dominantErrorSummary && (
            <div
              style={{
                ...C(D),
                padding: 14,
                marginBottom: 14,
                background: D ? "rgba(245,158,11,.08)" : "#fffbeb",
                borderColor: "#f59e0b",
              }}
            >
              <p style={{ fontSize: 13, color: D ? "#fcd34d" : "#92400e" }}>
                Your main error type is{" "}
                <strong>{dominantErrorSummary.type}</strong>(
                {dominantErrorSummary.pct}%) — focus on improving this.
              </p>
            </div>
          )}

          {}
          <div
            style={{
              ...C(D),
              padding: 22,
              marginBottom: 18,
              background:
                streak > 0 ? (D ? "rgba(249,115,22,0.05)" : "") : undefined,
              borderColor: streak >= 7 ? "#f97316" : undefined,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 16,
              }}
            >
              <div>
                <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>
                  Study Streak
                </h3>
                <p style={{ fontSize: 12, color: mu(D) }}>
                  Study every day to build your streak!
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 40,
                    fontWeight: 900,
                    color:
                      streak >= 7 ? "#f97316" : streak > 0 ? "#f59e0b" : mu(D),
                    lineHeight: 1,
                  }}
                >
                  {streak}
                </div>
                <div style={{ fontSize: 11, color: mu(D) }}>day streak</div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 20,
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              {[
                { icon: "🏆", val: longestStreak, label: "Longest streak" },
                { icon: "📅", val: activityDates.size, label: "Days studied" },
                { icon: "🔥", val: streak, label: "Current streak" },
                { icon: "📚", val: estLabel || "0m", label: "Study time est." },
              ].map(function (s) {
                return (
                  <div key={s.label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 20, marginBottom: 2 }}>
                      {s.icon}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800 }}>{s.val}</div>
                    <div style={{ fontSize: 11, color: mu(D) }}>{s.label}</div>
                  </div>
                );
              })}
            </div>

            {}
            <div>
              <p
                style={{
                  fontSize: 11,
                  color: mu(D),
                  marginBottom: 5,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontWeight: 600,
                }}
              >
                Activity heatmap — 16 weeks
              </p>
              <div style={{ overflowX: "auto", paddingBottom: 4 }}>
                {}
                <div
                  style={{
                    display: "inline-flex",
                    gap: 3,
                    minWidth: "max-content",
                    marginBottom: 3,
                    paddingLeft: 0,
                  }}
                >
                  {hmWeeks.map(function (wk, wi) {
                    const mo = new Date(
                      wk[0].k + "T12:00:00",
                    ).toLocaleDateString("en-GB", { month: "short" });
                    const showLabel =
                      wi === 0 ||
                      (wi > 0 &&
                        new Date(
                          hmWeeks[wi - 1][0].k + "T12:00:00",
                        ).toLocaleDateString("en-GB", { month: "short" }) !==
                          mo);
                    return (
                      <div
                        key={wi}
                        style={{
                          width: 16,
                          fontSize: 8,
                          color: mu(D),
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {showLabel ? mo : ""}
                      </div>
                    );
                  })}
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    gap: 3,
                    minWidth: "max-content",
                  }}
                >
                  {hmWeeks.map(function (wk, wi) {
                    return (
                      <div
                        key={wi}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 3,
                        }}
                      >
                        {wk.map(function (cell) {
                          return (
                            <div
                              key={cell.k}
                              title={
                                cell.k +
                                (cell.cnt > 0
                                  ? " · " +
                                    cell.cnt +
                                    " session" +
                                    (cell.cnt !== 1 ? "s" : "")
                                  : "")
                              }
                              style={{
                                width: 13,
                                height: 13,
                                borderRadius: 2,
                                background: hmColor(cell.cnt, D),
                                border: cell.isToday
                                  ? "2px solid #7c3aed"
                                  : "2px solid transparent",
                                transition: "background .2s",
                                cursor: "default",
                              }}
                            />
                          );
                        })}
                      </div>
                    );
                  })}
                  <div
                    style={{
                      marginLeft: 6,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      paddingTop: 1,
                      paddingBottom: 1,
                    }}
                  >
                    {["M", "W", "F", "S"].map(function (d) {
                      return (
                        <span
                          key={d}
                          style={{
                            fontSize: 8,
                            color: mu(D),
                            lineHeight: "13px",
                          }}
                        >
                          {d}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
              {}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  marginTop: 6,
                }}
              >
                <span style={{ fontSize: 10, color: mu(D) }}>Less</span>
                {[0, 1, 2, 3].map(function (n) {
                  return (
                    <div
                      key={n}
                      style={{
                        width: 11,
                        height: 11,
                        borderRadius: 2,
                        background: hmColor(n, D),
                      }}
                    />
                  );
                })}
                <span style={{ fontSize: 10, color: mu(D) }}>More</span>
              </div>
            </div>
          </div>
          {}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
              gap: 12,
              marginBottom: 18,
            }}
          >
            {[
              { icon: "📚", val: ALL_SUBJECTS.length, label: "Subjects" },
              { icon: "🗂️", val: stats.fcT, label: "Cards reviewed" },
              { icon: "➕", val: totalCustom, label: "Topics added" },
              { icon: "➕", val: totalPapers, label: "Past papers" },
            ].map(function (s, i) {
              return (
                <div
                  key={i}
                  style={{ ...C(D), padding: 18, textAlign: "center" }}
                >
                  <div style={{ fontSize: 22, marginBottom: 5 }}>{s.icon}</div>
                  <div
                    style={{ fontSize: 26, fontWeight: 800, marginBottom: 2 }}
                  >
                    {s.val}
                  </div>
                  <div style={{ fontSize: 11, color: mu(D) }}>{s.label}</div>
                </div>
              );
            })}
          </div>

          {}
          {trajData.length >= 2 && trajSubjs.length > 0 && (
            <div style={{ ...C(D), padding: 22, marginBottom: 18 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 4 }}>
                Grade Trajectory
              </h3>
              <p style={{ fontSize: 12, color: mu(D), marginBottom: 14 }}>
                Predicted grade per subject over time (1=low, 9=high).
              </p>

              <ResponsiveContainer width="100%" height={200}>
                <LineChart
                  data={trajData}
                  margin={{ top: 4, right: 12, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: mu(D) }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[0, 9]}
                    ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9]}
                    tick={{ fontSize: 10, fill: mu(D) }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: D ? "#191a2b" : "#fff",
                      border: "1px solid" + (D ? "#374151" : "#e5e7eb"),
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                    formatter={function (val, name) {
                      var s = ALL_SUBJECTS.find(function (s) {
                        return s.id === name;
                      });
                      return [val ? "Grade " + val : "—", s ? s.name : name];
                    }}
                  />
                  {trajSubjs.map(function (s) {
                    return (
                      <Line
                        key={s.id}
                        type="monotone"
                        dataKey={s.id}
                        stroke={s.accent}
                        strokeWidth={2}
                        dot={{ r: 3, fill: s.accent }}
                        connectNulls
                        activeDot={{ r: 5 }}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                  marginTop: 8,
                }}
              >
                {trajSubjs.map(function (s) {
                  return (
                    <span
                      key={s.id}
                      style={{
                        fontSize: 11,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: s.accent,
                          display: "inline-block",
                        }}
                      />
                      {s.name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          {trajData.length < 2 && (
            <div
              style={{
                ...C(D),
                padding: 22,
                marginBottom: 18,
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: 13, color: mu(D) }}>
                <strong>Grade Trajectory</strong> — answer questions across
                multiple sessions to see your progress over time.
              </p>
            </div>
          )}

          {}
          <div style={{ ...C(D), padding: 22, marginBottom: 18 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 4 }}>
              Subject Strength Radar
            </h3>
            <p style={{ fontSize: 12, color: mu(D), marginBottom: 14 }}>
              Relative strength across all subjects (question score %).
            </p>
            {hasRadarData ? (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart
                  data={radarData}
                  margin={{ top: 10, right: 30, left: 30, bottom: 10 }}
                >
                  <PolarGrid stroke={D ? "#374151" : "#e5e7eb"} />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fontSize: 10, fill: tx(D) }}
                  />
                  <Radar
                    name="Score"
                    dataKey="pct"
                    stroke="#7c3aed"
                    fill="#7c3aed"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{
                      background: D ? "#191a2b" : "#fff",
                      border: "1px solid" + (D ? "#374151" : "#e5e7eb"),
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                    formatter={function (val, _, props) {
                      return [
                        val + "%",
                        (props && props.payload && props.payload.fullName) ||
                          "Score",
                      ];
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <p
                style={{
                  fontSize: 13,
                  color: mu(D),
                  textAlign: "center",
                  padding: "32px 0",
                }}
              >
                Answer some questions to see your radar chart.
              </p>
            )}
          </div>
          {}
          <div style={{ ...C(D), padding: 24, marginBottom: 14 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 4 }}>
              Grades by Subject
            </h3>
            <p style={{ fontSize: 13, color: mu(D), marginBottom: 16 }}>
              Based on your question scores. Set target grades below.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
                gap: 10,
              }}
            >
              {ALL_SUBJECTS.map(function (s, si) {
                const ss = stats.subjStats && stats.subjStats[s.id];
                const qPct2 =
                  ss && ss.qM > 0 ? Math.round((ss.qS / ss.qM) * 100) : null;
                const predicted = qPct2 != null ? pctToGrade(qPct2) : null;
                const target = targetGrades[s.id] || null;
                const atOrAbove =
                  predicted &&
                  target &&
                  (parseInt(predicted) >= parseInt(target) ||
                    predicted === target);
                const gradeOpts = [
                  "9",
                  "8",
                  "7",
                  "6",
                  "5",
                  "4",
                  "3",
                  "2",
                  "1",
                  "U",
                ];
                return (
                  <div key={s.id} style={{ ...C(D), padding: 14 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 8,
                        cursor: "pointer",
                      }}
                      onClick={async function () {
                        setSubIdx(si);
                        setSubjTab("sections");
                        const b = boardSels[s.id] || DEFAULT_BOARD;
                        await ensureBoardLoaded(s.id, b);
                        setScreen("subject");
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: 7,
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontSize: 18 }}>{s.icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>
                          {s.name}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 5,
                          alignItems: "center",
                        }}
                      >
                        {target && (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              color: "#fff",
                              background: gradeColor(target),
                              padding: "2px 7px",
                              borderRadius: 7,
                            }}
                          >
                            {" "}
                            {target}
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: 16,
                            fontWeight: 800,
                            color: predicted ? gradeColor(predicted) : mu(D),
                            background: predicted
                              ? gradeColor(predicted) + "22"
                              : "transparent",
                            padding: "2px 8px",
                            borderRadius: 6,
                          }}
                        >
                          {predicted || "—"}
                        </span>
                      </div>
                    </div>
                    {qPct2 != null ? (
                      <div>
                        <div
                          style={{
                            height: 5,
                            borderRadius: 5,
                            background: D ? "#262844" : "#e5e7eb",
                            marginBottom: 4,
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              borderRadius: 5,
                              background: gradeColor(predicted || "U"),
                              width: qPct2 + "%",
                              transition: "width .6s",
                            }}
                          />
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 8,
                          }}
                        >
                          <span style={{ fontSize: 11, color: mu(D) }}>
                            {qPct2}% · {ss.qM} marks
                          </span>
                          {target && (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: atOrAbove ? "#16a34a" : "#d97706",
                              }}
                            >
                              {atOrAbove ? "✓On track" : "Keep going"}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p
                        style={{ fontSize: 11, color: mu(D), marginBottom: 8 }}
                      >
                        No questions answered yet
                      </p>
                    )}
                    <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                      {gradeOpts.map(function (g) {
                        const sel = target === g;
                        const gc = gradeColor(g);
                        return (
                          <button
                            key={g}
                            onClick={function () {
                              setTargetGrades(function (p) {
                                return Object.assign({}, p, {
                                  [s.id]: sel ? undefined : g,
                                });
                              });
                            }}
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 6,
                              border: "2px solid" + (sel ? gc : "transparent"),
                              background: sel ? gc : D ? "#191a2b" : "#f3f4f6",
                              color: sel ? "#fff" : D ? "#9ca3af" : "#6b7280",
                              fontWeight: sel ? 800 : 500,
                              fontSize: 11,
                              cursor: "pointer",
                              transition: "all .15s",
                            }}
                          >
                            {g}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {}
          {(Object.keys(stats.weakQ || {}).length > 0 ||
            Object.keys(stats.weakFC || {}).length > 0) &&
            (function () {
              const sIds = [
                ...new Set([
                  ...Object.keys(stats.weakQ || {}),
                  ...Object.keys(stats.weakFC || {}),
                ]),
              ];
              const scored = sIds
                .map(function (sid) {
                  const wq = (stats.weakQ && stats.weakQ[sid]) || {
                    wrong: 0,
                    total: 0,
                  };
                  const wf = (stats.weakFC && stats.weakFC[sid]) || {
                    wrong: 0,
                    total: 0,
                  };
                  const score =
                    (wq.wrong * 2 + wf.wrong) /
                    Math.max(wq.total + wf.total, 1);
                  return { sid, score, wq, wf };
                })
                .filter(function (x) {
                  return x.wq.total + x.wf.total > 0;
                })
                .sort(function (a, b) {
                  return b.score - a.score;
                })
                .slice(0, 5);
              if (!scored.length) return null;
              return (
                <div style={{ ...C(D), padding: 22 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 14,
                    }}
                  >
                    <h3 style={{ fontWeight: 700 }}>Weakest Areas</h3>
                    <button
                      onClick={function () {
                        setTTSubj(null);
                        setScreen("target");
                      }}
                      style={{
                        ...B("#ef4444", false, {
                          fontSize: 12,
                          padding: "7px 14px",
                        }),
                      }}
                    >
                      Start Target Test
                    </button>
                  </div>
                  {scored.map(function (x) {
                    return (
                      <div
                        key={x.sid}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "7px 12px",
                          borderRadius: 10,
                          background: D ? "#191a2b" : "#fef2f2",
                          marginBottom: 5,
                        }}
                      >
                        <span style={{ fontSize: 13 }}>{x.sid}</span>
                        <div style={{ display: "flex", gap: 12 }}>
                          {x.wq.total > 0 && (
                            <span style={{ fontSize: 11, color: "#dc2626" }}>
                              Q:
                              {x.wq.wrong}/{x.wq.total}
                            </span>
                          )}
                          {x.wf.total > 0 && (
                            <span style={{ fontSize: 11, color: "#d97706" }}>
                              FC:
                              {x.wf.wrong}/{x.wf.total}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

          {}
          {(() => {
            const allPreds = Object.values(calibrationData).flat();
            if (!allPreds.length) return null;

            return (
              <CalibrationGauge
                D={D}
                calibData={allPreds}
                subjectName="All Subjects"
              />
            );
          })()}
          {}
          {pedCtx?.crossSubjectInsight && (
            <div
              style={{
                ...C(D),
                padding: 18,
                marginBottom: 16,
                borderColor: "#7c3aed",
                borderWidth: 1.5,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: "#7c3aed22",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                ></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#7c3aed",
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                      marginBottom: 3,
                    }}
                  >
                    Cross-Subject Pattern Detected
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: tx(D),
                      lineHeight: 1.6,
                      marginBottom: 6,
                    }}
                  >
                    {pedCtx.crossSubjectInsight.insight}
                  </p>
                  <div
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: D ? "rgba(99,102,241,.08)" : "#f5f3ff",
                      fontSize: 12,
                      color: D ? "#ddd6fe" : "#4c1d95",
                      lineHeight: 1.5,
                    }}
                  >
                    <strong>What to do:</strong>{" "}
                    {pedCtx.crossSubjectInsight.recommendation}
                  </div>
                  {pedCtx.crossSubjectInsight.affectedSubjects?.length > 0 && (
                    <div style={{ marginTop: 6, fontSize: 11, color: mu(D) }}>
                      Affects:{" "}
                      {pedCtx.crossSubjectInsight.affectedSubjects.join(", ")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {}
          {totalDaysStudied > 0 && (
            <div
              style={{
                ...C(D),
                padding: 18,
                display: "flex",
                alignItems: "center",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div style={{ fontSize: 32 }}> </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>
                  {totalDaysStudied} total days studied
                </div>

                <div style={{ fontSize: 12, color: mu(D) }}>
                  This never resets. Every study session counts.
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: mu(D) }}>Achievements</div>
                <div
                  style={{ fontWeight: 700, fontSize: 20, color: "#7c3aed" }}
                >
                  {achievements.length}/{ACHIEVEMENTS.length}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  if (screen === "target") {
    const allSecs = subjects.flatMap((s, si) => {
      const b = boardSels[s.id] || DEFAULT_BOARD;
      const bdata = getBD(s.id, b);
      const merged = mergeTopics(s.topics || [], bdata.custom, bdata.extras);
      return merged.flatMap((t, ti) =>
        t.sections.map((sec) => ({ sec, si, ti, subj: s })),
      );
    });
    const scoredSecs = allSecs
      .map(function (item) {
        const sec = item.sec,
          si = item.si,
          ti = item.ti,
          subj = item.subj;
        const wq = stats.weakQ?.[sec.id] || { wrong: 0, total: 0 };
        const wf = stats.weakFC?.[sec.id] || { wrong: 0, total: 0 };
        const attempts = wq.total + wf.total;
        const score = attempts > 0 ? (wq.wrong * 2 + wf.wrong) / attempts : 0;
        return { sec, si, ti, subj, score, attempts, wq, wf };
      })
      .filter((x) => x.sec.questions?.length > 0);
    const filtered =
      ttSubj != null ? scoredSecs.filter((x) => x.si === ttSubj) : scoredSecs;
    const sorted = [...filtered].sort(
      (a, b) => b.score - a.score || b.attempts - a.attempts,
    );
    const buildQueue = () => {
      const items = [];
      for (var _si = 0; _si < sorted.length; _si++) {
        const _it = sorted[_si];
        const sec = _it.sec,
          subj = _it.subj;
        const qs = (sec.questions || []).slice(0, 2);
        qs.forEach(function (q) {
          items.push({ q, secId: sec.id, secTitle: sec.title, subj });
        });
      }
      return items.slice(0, 15);
    };
    if (ttItems.length > 0) {
      const item = ttItems[ttIdx];

      const q = item?.q;
      const isLast = ttIdx >= ttItems.length - 1;
      if (!item) return null;
      const finishTT = () => {
        setTTI([]);
        setTTIdx(0);
        setTTRes(null);
        setTTSO(null);
        setTTTA("");
      };
      const nextTT = () => {
        setTTIdx((i) => i + 1);
        setTTRes(null);
        setTTSO(null);
        setTTTA("");
      };
      return (
        <div
          style={{ minHeight: "100vh", background: bg, color: tx(D) }}
          className="fade-in"
        >
          <Header {...hProps} />
          <div
            style={{ maxWidth: 760, margin: "0 auto", padding: "28px 24px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>
                  Target Test
                </h2>
                <p style={{ fontSize: 12, color: mu(D) }}>
                  Question {ttIdx + 1} of {ttItems.length} ·{item.secTitle}
                </p>
              </div>
              <button
                onClick={finishTT}
                style={{
                  fontSize: 12,
                  color: mu(D),
                  background: "none",
                  border: `1px solid ${bd2}`,
                  borderRadius: 8,
                  padding: "6px 12px",
                  cursor: "pointer",
                }}
              >
                End Test
              </button>
            </div>
            <div
              style={{
                height: 4,
                borderRadius: 4,
                background: D ? "#262844" : "#e5e7eb",
                marginBottom: 22,
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: 4,
                  background: "#ef4444",
                  width: `${(ttIdx / ttItems.length) * 100}
%`,
                  transition: "width .4s",
                }}
              />
            </div>
            <div style={{ ...C(D), padding: 24, marginBottom: 12 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: mu(D),
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {q.type === "mcq"
                    ? "MCQ"
                    : q.type === "short"
                      ? "Short Answer"
                      : "Extended"}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "3px 10px",
                    borderRadius: 20,
                    background: item.subj.mid,
                    color: item.subj.dk,
                  }}
                >
                  {q.marks}
                  mark{q.marks !== 1 ? "s" : ""}
                </span>
              </div>
              {(q.images || []).map((img, ii) => (
                <AnnotatedImage key={ii} img={img} D={D} />
              ))}
              <ContentBlock
                content={q.text}
                D={D}
                fontSize={15}
                style={{ marginBottom: 16 }}
              />
              {q.type === "mcq" && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {q.options.map((opt, oi) => {
                    const sel = ttSelOpt === oi,
                      correct = oi === q.answer,
                      rev = ttRes != null;
                    let bg2 = D ? "#1c1d30" : "#f9fafb",
                      br2 = bd2,
                      co2 = tx(D);
                    if (rev && correct) {
                      bg2 = "#dcfce7";
                      br2 = "#22c55e";
                      co2 = "#15803d";
                    } else if (rev && sel && !correct) {
                      bg2 = "#fee2e2";
                      br2 = "#ef4444";
                      co2 = "#b91c1c";
                    }

                    return (
                      <button
                        key={oi}
                        onClick={() => {
                          if (!ttRes) {
                            const isCorrect = oi === q.answer;
                            setTTSO(oi);
                            setTTRes(isCorrect ? "correct" : "wrong");
                            markTodayActive();
                            setStats((s) => {
                              const wq = { ...s.weakQ };
                              wq[item.secId] = {
                                wrong:
                                  (wq[item.secId]?.wrong || 0) +
                                  (isCorrect ? 0 : 1),
                                total: (wq[item.secId]?.total || 0) + 1,
                              };
                              return {
                                ...s,
                                qS: s.qS + (isCorrect ? 1 : 0),
                                qM: s.qM + 1,
                                weakQ: wq,
                              };
                            });
                          }
                        }}
                        style={{
                          textAlign: "left",
                          padding: "11px 16px",
                          borderRadius: 10,
                          border: `1.5px solid ${br2}`,
                          background: bg2,
                          cursor: ttRes ? "default" : "pointer",
                          color: co2,
                          fontSize: 13,
                          transition: "all .15s",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "monospace",
                            marginRight: 10,
                            fontSize: 11,
                          }}
                        >
                          {"ABCD"[oi]}.
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                  {ttRes && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: 14,
                        borderRadius: 12,
                        background: ttRes === "correct" ? "#dcfce7" : "#fee2e2",
                        border: `1px solid ${ttRes === "correct" ? "#22c55e" : "#ef4444"}`,
                        color: ttRes === "correct" ? "#15803d" : "#b91c1c",
                        fontSize: 13,
                      }}
                    >
                      <p style={{ fontWeight: 700, marginBottom: 4 }}>
                        {ttRes === "correct" ? "✓ Correct!" : "✗Incorrect"}
                      </p>
                      <p>{q.explanation}</p>
                    </div>
                  )}
                </div>
              )}
              {(q.type === "short" || q.type === "extended") && (
                <div>
                  <textarea
                    value={ttTextAns}
                    onChange={(e) => setTTTA(e.target.value)}
                    disabled={!!ttRes}
                    rows={q.type === "extended" ? 6 : 3}
                    placeholder={`Write your answer… [${q.marks} mark${q.marks !== 1 ? "s" : ""}]`}
                    style={{
                      ...I(D, { resize: "vertical", lineHeight: 1.65 }),
                    }}
                  />
                  {!ttRes && (
                    <button
                      onClick={async () => {
                        if (!ttTextAns.trim()) return;
                        setTTMk(true);
                        markTodayActive();
                        try {
                          const r = await markAnswer(q, ttTextAns);
                          setTTRes(r);
                          const pct = q.marks > 0 ? r.score / q.marks : 0;
                          setStats((s) => {
                            const wq = { ...s.weakQ };
                            wq[item.secId] = {
                              wrong:
                                (wq[item.secId]?.wrong || 0) +
                                (pct < 0.5 ? 1 : 0),
                              total: (wq[item.secId]?.total || 0) + 1,
                            };
                            return {
                              ...s,
                              qS: s.qS + (r.score || 0),
                              qM: s.qM + q.marks,
                              weakQ: wq,
                            };
                          });
                        } catch (e) {
                          setTTRes({
                            score: "?",
                            feedback:
                              "ReviseIQ AI unavailable — please try again.",
                            missedPoints: [],
                            modelAnswer: q.sampleAnswer || "",
                            examTip: "",
                          });
                        }
                        setTTMk(false);
                      }}
                      disabled={!ttTextAns.trim() || ttMarking}
                      style={{
                        marginTop: 10,
                        width: "100%",
                        background:
                          ttTextAns.trim() && !ttMarking
                            ? "#7c3aed"
                            : "#9ca3af",
                        color: "#fff",
                        border: "none",
                        borderRadius: 12,
                        padding: "11px 0",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor:
                          ttTextAns.trim() && !ttMarking
                            ? "pointer"
                            : "not-allowed",
                      }}
                    >
                      {ttMarking ? "Marking…" : "Submit →"}
                    </button>
                  )}
                  {ttRes && typeof ttRes === "object" && ttRes.feedback && (
                    <div
                      style={{
                        marginTop: 12,
                        ...C(D),
                        padding: 18,
                        background: D ? "#1a1a2e" : "#f8f7ff",
                        borderColor: "#7c3aed",
                      }}
                      className="fade-in"
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 8,
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: 14 }}>
                          ReviseIQ AI Marking
                        </span>
                        <span
                          style={{
                            fontSize: 20,
                            fontWeight: 800,
                            color:
                              ttRes.score >= q.marks * 0.7
                                ? "#16a34a"
                                : ttRes.score >= q.marks * 0.4
                                  ? "#d97706"
                                  : "#dc2626",
                          }}
                        >
                          {ttRes.score}/{q.marks}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: 13,
                          lineHeight: 1.65,
                          marginBottom: 8,
                        }}
                      >
                        {ttRes.feedback}
                      </p>
                      {ttRes.missedPoints?.map((pt, i) => (
                        <div
                          key={i}
                          style={{
                            fontSize: 12,
                            color: "#dc2626",
                            display: "flex",
                            gap: 6,
                            marginBottom: 2,
                          }}
                        >
                          <span>•</span>
                          <span>{pt}</span>
                        </div>
                      ))}
                      {ttRes.examTip && (
                        <div
                          style={{
                            marginTop: 8,
                            padding: "8px 12px",
                            borderRadius: 8,
                            background: D ? "#1e2f4a" : "#eff6ff",
                            border: "1px solid #bfdbfe",
                            fontSize: 12,
                            color: "#1d4ed8",
                          }}
                        >
                          {ttRes.examTip}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            {ttRes && (
              <button
                onClick={isLast ? finishTT : nextTT}
                style={{
                  width: "100%",
                  ...B(isLast ? "#10b981" : "#ef4444", false, {
                    padding: "12px 0",
                    borderRadius: 12,
                    fontSize: 14,
                  }),
                }}
              >
                {isLast ? "✓ Complete Test" : "Next Question →"}
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div
        style={{ minHeight: "100vh", background: bg, color: tx(D) }}
        className="fade-in"
      >
        <Header {...hProps} />
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px" }}>
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

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 24,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
                Target Test
              </h2>
              <p style={{ fontSize: 14, color: mu(D) }}>
                Targets your weakest areas — adapts as you improve
              </p>
            </div>
            <button
              onClick={() => {
                const q = buildQueue();
                setTTI(q);
                setTTIdx(0);
                setTTRes(null);
                setTTSO(null);
                setTTTA("");
              }}
              disabled={sorted.length === 0}
              style={{
                ...B("#ef4444", false, {
                  fontSize: 14,
                  padding: "11px 22px",
                  opacity: sorted.length === 0 ? 0.4 : 1,
                }),
              }}
            >
              Start Test{ttSubj != null ? ` · ${subjects[ttSubj]?.name}` : ""}
            </button>
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 22,
            }}
          >
            <button
              onClick={() => setTTSubj(null)}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                border: `1.5px solid ${ttSubj === null ? "#ef4444" : bd2}`,
                background: ttSubj === null ? "#ef4444" : "transparent",
                color: ttSubj === null ? "#fff" : mu(D),
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              All subjects
            </button>
            {subjects.map((s, si) => (
              <button
                key={s.id}
                onClick={() => setTTSubj(si === ttSubj ? null : si)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  border: `1.5px solid ${ttSubj === si ? s.accent : bd2}`,
                  background: ttSubj === si ? s.accent : "transparent",
                  color: ttSubj === si ? "#fff" : mu(D),
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {s.icon} {s.name}
              </button>
            ))}
          </div>
          {sorted.length === 0 ? (
            <div style={{ ...C(D), padding: 48, textAlign: "center" }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}> </p>
              <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
                No data yet
              </p>
              <p style={{ fontSize: 13, color: mu(D) }}>
                Answer questions first — Target Test will identify your weak
                spots.
              </p>
            </div>
          ) : (
            <div style={{ ...C(D), padding: 24 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 4 }}>
                Weakness Analysis
              </h3>
              <p style={{ fontSize: 13, color: mu(D), marginBottom: 16 }}>
                Ranked by weakness · Questions weight 2×, flashcards 1×
              </p>
              {sorted.slice(0, 12).map(function (itm, i) {
                const sec = itm.sec,
                  subj = itm.subj,
                  score = itm.score,
                  wq = itm.wq,
                  wf = itm.wf;
                const pct = Math.round(score * 100);
                const col =
                  pct > 60 ? "#dc2626" : pct > 30 ? "#d97706" : "#16a34a";
                return (
                  <div
                    key={sec.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 0",
                      borderBottom: `1px solid ${bd2}`,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: col,
                        width: 28,
                        flexShrink: 0,
                      }}
                    >
                      #{i + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          marginBottom: 2,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {sec.title}
                      </div>
                      <div style={{ fontSize: 11, color: mu(D) }}>
                        {subj.icon} {subj.name}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 14, flexShrink: 0 }}>
                      {wq.total > 0 && (
                        <div style={{ textAlign: "center" }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#dc2626",
                            }}
                          >
                            {wq.wrong}/{wq.total}
                          </div>
                          <div style={{ fontSize: 10, color: mu(D) }}>
                            Q wrong
                          </div>
                        </div>
                      )}
                      {wf.total > 0 && (
                        <div style={{ textAlign: "center" }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#d97706",
                            }}
                          >
                            {wf.wrong}/{wf.total}
                          </div>
                          <div style={{ fontSize: 10, color: mu(D) }}>
                            FC wrong
                          </div>
                        </div>
                      )}
                      <div style={{ textAlign: "center" }}>
                        <div
                          style={{ fontSize: 13, fontWeight: 700, color: col }}
                        >
                          {pct}%
                        </div>
                        <div style={{ fontSize: 10, color: mu(D) }}>weak</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }
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
                  ...B("#7c3aed", false, { padding: "8px 12px", fontSize: 12 }),
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
      {focusMode && screen === "section" && section && (
        <FocusMode
          D={D}
          cards={section.flashcards || []}
          questions={section.questions || []}
          section={section}
          subj={subjDef}
          fcHist={fcHist}
          onExit={() => setFocusMode(false)}
        />
      )}
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
                        color: "#7c3aed",
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
