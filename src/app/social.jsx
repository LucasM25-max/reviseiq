import React, { useState, useEffect } from "react";
import { uid } from "./ui.jsx";

export function getGroupKey(groupId) {
  return;
  "gcse:groups:" + String(groupId || "default").replace(/\W/g, "-");
}

export function loadGroup(groupId) {
  try {
    var g = JSON.parse(localStorage.getItem(getGroupKey(groupId)) || "null");
    if (g && Array.isArray(g.members) && Array.isArray(g.leaderboard)) return g;
  } catch (_) {}
  return { members: [], leaderboard: [] };
}

export function saveGroup(groupId, group) {
  try {
    localStorage.setItem(getGroupKey(groupId), JSON.stringify(group));
  } catch (_) {}
}

export function upsertGroupScore(groupId, user, deltaQuestions, streak) {
  var g = loadGroup(groupId);
  if (g.members.indexOf(user) < 0) g.members.push(user);
  var lb = g.leaderboard || [];
  var i = lb.findIndex(function (x) {
    return x.user === user;
  });
  if (i < 0)
    lb.push({
      user: user,
      totalQuestions: Math.max(0, deltaQuestions || 0),
      streak: Math.max(0, streak || 0),
    });
  else {
    lb[i] = {
      ...lb[i],
      totalQuestions: Math.max(
        0,
        (lb[i].totalQuestions || 0) + (deltaQuestions || 0),
      ),
      streak: Math.max(lb[i].streak || 0, streak || 0),
    };
  }
  lb.sort(function (a, b) {
    return b.totalQuestions - a.totalQuestions || b.streak - a.streak;
  });
  g.leaderboard = lb;
  saveGroup(groupId, g);
  return g;
}

export function createPeerQuiz(data) {
  var id = "pq-" + uid();
  var row = {
    id: id,
    creator: data.creator || "",
    recipient: data.recipient || "",
    questions: Array.isArray(data.questions) ? data.questions : [],
    answers: [],
    score: null,
    timeTaken: null,
    createdAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem("gcse:peerQuiz:" + id, JSON.stringify(row));
  } catch (_) {}
  return id;
}

export function submitPeerQuiz(id, answers, score, timeTaken) {
  var key = "gcse:peerQuiz:" + id;
  try {
    var row = JSON.parse(localStorage.getItem(key) || "null");
    if (!row) return false;
    row.answers = Array.isArray(answers) ? answers : [];
    row.score = Number(score || 0);
    row.timeTaken = Number(timeTaken || 0);
    row.completedAt = new Date().toISOString();
    localStorage.setItem(key, JSON.stringify(row));
    return true;
  } catch (_) {
    return false;
  }
}

export function useSchoolLeaderboard(user, school) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!school) return;
    setLoading(true);
    (async () => {
      try {
        const res = await window.storage.list("gcse:lb:", true);
        if (!res?.keys?.length) {
          setLoading(false);
          return;
        }
        const fetched = await Promise.allSettled(
          res.keys.map((k) => window.storage.get(k, true)),
        );
        const all = fetched
          .filter((r) => r.status === "fulfilled" && r.value?.value)
          .map((r) => {
            try {
              return JSON.parse(r.value.value);
            } catch (e) {
              return null;
            }
          })
          .filter((e) => e && e.username && e.school);

        let activeUsernames = new Set();
        try {
          const ar2 = await window.storage.get("gcse:accounts", true);
          if (ar2?.value) {
            const accs2 = JSON.parse(ar2.value);
            Object.keys(accs2).forEach((k) =>
              activeUsernames.add(k.toLowerCase()),
            );
          }
        } catch (_) {}
        const schoolNorm = school.trim().toLowerCase();
        const filtered =
          activeUsernames.size > 0
            ? all.filter(
                (e) =>
                  e.school.trim().toLowerCase() === schoolNorm &&
                  activeUsernames.has(e.username.toLowerCase()),
              )
            : all.filter((e) => e.school.trim().toLowerCase() === schoolNorm);
        setEntries(filtered.sort((a, b) => (b.score || 0) - (a.score || 0)));
      } catch (_) {}
      setLoading(false);
    })();
  }, [school]);
  return { entries, loading };
}

export function SchoolLeaderboard({ user, school, D }) {
  const { entries, loading } = useSchoolLeaderboard(user, school);
  if (!school)
    return (
      <div
        style={{
          marginTop: 14,
          padding: "10px14px",
          borderRadius: 10,
          background: D ? "#1e2537" : "#f3f4f6",
          fontSize: 12,
          color: D ? "#9ca3af" : "#6b7280",
        }}
      >
        Add your school during sign-up to see how you rank among classmates.
      </div>
    );
  if (loading)
    return (
      <div
        style={{
          marginTop: 14,
          fontSize: 12,
          color: D ? "#8896b3" : "#9ca3af",
        }}
      >
        Loading school leaderboard…
      </div>
    );
  if (!entries.length)
    return (
      <div
        style={{
          marginTop: 14,
          padding: "10px14px",
          borderRadius: 10,
          background: D ? "#1e2537" : "#f3f4f6",
          fontSize: 12,
          color: D ? "#9ca3af" : "#6b7280",
        }}
      >
        No other students from <strong>{school}</strong> yet — invite your
        classmates!
      </div>
    );
  const mu2 = D ? "#8896b3" : "#9ca3af";
  const tx2 = D ? "#e8ecf4" : "#111827";
  return (
    <div style={{ marginTop: 14 }}>
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: mu2,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 8,
        }}
      >
        {school} Leaderboard
      </p>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          maxHeight: 340,
          overflowY: "auto",
          paddingRight: 2,
        }}
      >
        {entries.map((e, i) => {
          const isMe = e.username === user;
          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
          const name = e.displayName || e.username || "";
          return (
            <div
              key={e.username}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "7px12px",
                borderRadius: 8,
                background: isMe
                  ? D
                    ? "rgba(99,102,241,.2)"
                    : "#eef2ff"
                  : D
                    ? "#1f2937"
                    : "#f9fafb",

                border: isMe
                  ? "1.5px solid #6366f1"
                  : "1.5px solid transparent",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 13, width: 22, textAlign: "center" }}>
                {medal || (
                  <span
                    style={{
                      fontSize: 11,
                      color: mu2,
                      fontFamily: "monospace",
                    }}
                  >
                    #{i + 1}
                  </span>
                )}
              </span>
              <span
                style={{
                  flex: 1,
                  fontSize: 13,
                  fontWeight: isMe ? 700 : 400,
                  color: isMe ? "#6366f1" : tx2,
                }}
              >
                {name}
                {isMe ? "(you)" : ""}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: mu2 }}>
                {e.score || 0} pts
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function mergeTopics(baseTopics, boardCustom, boardExtras) {
  function expandAdminTopic(cs) {
    const subs = cs.subtopics || [];
    if (subs.length > 0) {
      return subs.map((st) => ({
        id: st.id,
        title: st.title,
        src: "admin",
        _parentTopicId: cs.id,
        _parentTopicTitle: cs.title,
        _isSubtopic: true,
        notes: [...(st.notes || []), ...(boardExtras[st.id]?.notes || [])],
        flashcards: [
          ...(st.flashcards || []),
          ...(boardExtras[st.id]?.flashcards || []),
        ],
        questions: [
          ...(st.questions || []),
          ...(boardExtras[st.id]?.questions || []),
        ],
      }));
    }
    return [
      {
        ...cs,
        _parentTopicId: cs.id,
        _parentTopicTitle: cs.title,
        _isSubtopic: false,
        notes: [...(cs.notes || []), ...(boardExtras[cs.id]?.notes || [])],
        flashcards: [
          ...(cs.flashcards || []),
          ...(boardExtras[cs.id]?.flashcards || []),
        ],
        questions: [
          ...(cs.questions || []),
          ...(boardExtras[cs.id]?.questions || []),
        ],
      },
    ];
  }
  const topicMap = (baseTopics || []).map((topic) => ({
    ...topic,
    sections: [
      ...topic.sections.map((sec) => ({
        ...sec,
        notes: [...(sec.notes || []), ...(boardExtras[sec.id]?.notes || [])],
        flashcards: [
          ...(sec.flashcards || []),
          ...(boardExtras[sec.id]?.flashcards || []),
        ],
        questions: [
          ...(sec.questions || []),
          ...(boardExtras[sec.id]?.questions || []),
        ],
      })),
      ...(boardCustom || [])
        .filter((cs) => cs.topicId === topic.id)
        .flatMap(expandAdminTopic),
    ],
  }));
  const loose = (boardCustom || []).filter(
    (cs) => !cs.topicId || !(baseTopics || []).find((t) => t.id === cs.topicId),
  );
  if (loose.length > 0) {
    const groups = [];
    for (const cs of loose) {
      const expanded = expandAdminTopic(cs);
      groups.push({
        _adminTopicId: cs.id,
        _adminTopicTitle: cs.title,
        sections: expanded,
      });
    }
    topicMap.push({
      id: "_admin",
      number: "",
      title: "Topics",
      sections: groups.flatMap((g) => g.sections),
      _adminGroups: groups,
    });
  }
  return topicMap;
}
