import React, { useState, useEffect, useCallback } from "react";
import { SchoolLeaderboard, GlobalLeaderboard } from "./social.jsx";
import { FriendsPanel } from "./friends.jsx";
import { showToast } from "./ui.jsx";

function rid(n) {
  const A = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < (n || 6); i++)
    s += A[Math.floor(Math.random() * A.length)];
  return s;
}

const GKEY = (code) => "gcse:group:" + String(code).toUpperCase();
const UGKEY = (user) => "gcse:usergroups:" + String(user).replace(/\W/g, "-");
const LBKEY = (user) => "gcse:lb:" + String(user).replace(/\W/g, "-");

async function sget(key) {
  try {
    const r = await window.storage.get(key, true);
    if (r && r.value) return JSON.parse(r.value);
  } catch (e) {}
  return null;
}
async function sset(key, val) {
  try {
    await window.storage.set(key, JSON.stringify(val), true);
  } catch (e) {}
}
async function fetchUserScore(username) {
  const lb = await sget(LBKEY(username));
  return lb && typeof lb.score === "number" ? lb.score : 0;
}
function copyCode(code) {
  try {
    if (navigator && navigator.clipboard) navigator.clipboard.writeText(code);
    showToast("Invite code " + code + " copied", "success");
  } catch (e) {}
}

function GroupCard({ group, user, D, onLeave, open, onToggle, busy }) {
  const [rows, setRows] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const bd = D ? "#2a2c4a" : "#ece9f7";
  const txc = D ? "#eef1fb" : "#0a0a14";
  const muc = D ? "#9aa3c2" : "#5b6478";

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoaded(false);
    (async () => {
      const members = group.members || {};
      const out = [];
      for (const uname of Object.keys(members)) {
        const score = await fetchUserScore(uname);
        out.push({
          username: uname,
          displayName: members[uname].displayName || uname,
          school: members[uname].school || "",
          score: score,
        });
      }
      out.sort((a, b) => (b.score || 0) - (a.score || 0));
      if (!cancelled) {
        setRows(out);
        setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, group]);

  const members = group.members || {};
  const memberCount = Object.keys(members).length;
  const cardStyle = {
    border: "1.5px solid " + bd,
    borderRadius: 16,
    padding: "14px 16px",
    background: D ? "rgba(255,255,255,.02)" : "#ffffff",
    marginBottom: 12,
  };
  const headRow = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  };
  const nameStyle = { fontWeight: 800, fontSize: 15, color: txc };
  const metaStyle = { fontSize: 12, color: muc, marginTop: 2 };
  const btnRow = { display: "flex", gap: 6, flexWrap: "wrap" };
  const ghostBtn = {
    fontSize: 12,
    fontWeight: 700,
    padding: "6px 11px",
    borderRadius: 9,
    border: "1.5px solid " + bd,
    background: "transparent",
    color: muc,
    cursor: "pointer",
  };
  const leaveBtn = {
    fontSize: 12,
    fontWeight: 700,
    padding: "6px 11px",
    borderRadius: 9,
    border: "1.5px solid " + (D ? "#7f1d1d" : "#fecaca"),
    background: "transparent",
    color: "#ef4444",
    cursor: busy ? "wait" : "pointer",
  };
  const lbWrap = { display: "flex", flexDirection: "column", gap: 6, marginTop: 12 };
  const mutedStyle = { color: muc, fontSize: 13, padding: "6px 0" };

  return (
    <div style={cardStyle}>
      <div style={headRow}>
        <div>
          <div style={nameStyle}>{group.name || "Study group"}</div>
          <div style={metaStyle}>
            Code {group.code} · {memberCount} member{memberCount === 1 ? "" : "s"}
          </div>
        </div>
        <div style={btnRow}>
          <button style={ghostBtn} onClick={() => copyCode(group.code)}>
            Copy code
          </button>
          <button style={ghostBtn} onClick={onToggle}>
            {open ? "Hide" : "Leaderboard"}
          </button>
          <button style={leaveBtn} onClick={() => onLeave(group.code)}>
            Leave
          </button>
        </div>
      </div>
      {open ? (
        <div style={lbWrap}>
          {!loaded ? (
            <div style={mutedStyle}>Loading leaderboard…</div>
          ) : rows.length === 0 ? (
            <div style={mutedStyle}>No members yet.</div>
          ) : (
            rows.map((r, i) => {
              const isMe = r.username === user;
              const medal =
                i === 0 ? "\uD83E\uDD47" : i === 1 ? "\uD83E\uDD48" : i === 2 ? "\uD83E\uDD49" : null;
              const rowS = {
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "7px 12px",
                borderRadius: 8,
                background: isMe
                  ? D
                    ? "rgba(99,102,241,.2)"
                    : "#f5f3ff"
                  : D
                    ? "#1c1d30"
                    : "#f9fafb",
                border: isMe ? "1.5px solid var(--riq-accent)" : "1.5px solid transparent",
              };
              const rankS = { width: 30, textAlign: "center", fontWeight: 800, fontSize: 13, color: muc, flexShrink: 0 };
              const nmS = {
                flex: 1,
                fontWeight: isMe ? 800 : 600,
                fontSize: 14,
                color: txc,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              };
              const ptsS = { fontWeight: 800, fontSize: 13, color: "var(--riq-accent)", flexShrink: 0 };
              return (
                <div key={r.username} style={rowS}>
                  <span style={rankS}>{medal || "#" + (i + 1)}</span>
                  <span style={nmS}>
                    {r.displayName}
                    {isMe ? " (you)" : ""}
                  </span>
                  <span style={ptsS}>{r.score || 0} pts</span>
                </div>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}

export function StudyGroupsPanel({ user, userDisplayName, userSchool, D }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createName, setCreateName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [openCode, setOpenCode] = useState("");

  const bd = D ? "#2a2c4a" : "#ece9f7";
  const txc = D ? "#eef1fb" : "#0a0a14";
  const muc = D ? "#9aa3c2" : "#5b6478";
  const inputStyle = {
    flex: 1,
    minWidth: 120,
    padding: "9px 12px",
    borderRadius: 10,
    border: "1.5px solid " + bd,
    background: D ? "#0f0f1a" : "#ffffff",
    color: txc,
    fontSize: 13.5,
    outline: "none",
  };
  const primaryBtn = {
    padding: "9px 16px",
    borderRadius: 10,
    border: "none",
    background: "var(--riq-accent)",
    color: "#fff",
    fontWeight: 700,
    fontSize: 13.5,
    cursor: busy ? "wait" : "pointer",
    whiteSpace: "nowrap",
  };
  const formRow = { display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" };
  const sectionLabel = {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: ".05em",
    textTransform: "uppercase",
    color: muc,
    margin: "4px 0 8px",
  };
  const msgStyle = { fontSize: 12.5, color: "var(--riq-accent)", margin: "2px 0 12px", fontWeight: 600 };
  const dividerStyle = { height: 1, background: bd, margin: "16px 0", border: "none" };
  const emptyStyle = { color: muc, fontSize: 13.5, lineHeight: 1.5 };

  const reload = useCallback(async () => {
    setLoading(true);
    const codes = (await sget(UGKEY(user))) || [];
    const gs = [];
    for (const c of codes) {
      const g = await sget(GKEY(c));
      if (g) gs.push(g);
    }
    setGroups(gs);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  const create = async () => {
    const name = createName.trim();
    if (!name) {
      setMsg("Enter a group name first.");
      return;
    }
    setBusy(true);
    let code = rid(6);
    for (let i = 0; i < 4; i++) {
      const exists = await sget(GKEY(code));
      if (!exists) break;
      code = rid(6);
    }
    const now = new Date().toISOString();
    const g = {
      code: code,
      name: name,
      createdBy: user,
      createdAt: now,
      members: {},
    };
    g.members[user] = {
      displayName: userDisplayName || user,
      school: userSchool || "",
      joinedAt: now,
    };
    await sset(GKEY(code), g);
    const codes = (await sget(UGKEY(user))) || [];
    if (codes.indexOf(code) < 0) codes.push(code);
    await sset(UGKEY(user), codes);
    setCreateName("");
    setMsg('Created "' + name + '" — share code ' + code + " with friends.");
    setOpenCode(code);
    setBusy(false);
    reload();
  };

  const join = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      setMsg("Enter a group code to join.");
      return;
    }
    setBusy(true);
    const g = await sget(GKEY(code));
    if (!g) {
      setMsg("No group found with code " + code + ".");
      setBusy(false);
      return;
    }
    const now = new Date().toISOString();
    g.members = g.members || {};
    g.members[user] = {
      displayName: userDisplayName || user,
      school: userSchool || "",
      joinedAt: now,
    };
    await sset(GKEY(code), g);
    const codes = (await sget(UGKEY(user))) || [];
    if (codes.indexOf(code) < 0) codes.push(code);
    await sset(UGKEY(user), codes);
    setJoinCode("");
    setMsg("Joined " + (g.name || code) + "!");
    setOpenCode(code);
    setBusy(false);
    reload();
  };

  const leave = async (code) => {
    setBusy(true);
    const g = await sget(GKEY(code));
    if (g && g.members) {
      delete g.members[user];
      await sset(GKEY(code), g);
    }
    let codes = (await sget(UGKEY(user))) || [];
    codes = codes.filter((c) => c !== code);
    await sset(UGKEY(user), codes);
    if (openCode === code) setOpenCode("");
    setMsg("Left the group.");
    setBusy(false);
    reload();
  };

  return (
    <div>
      <div style={sectionLabel}>Create a group</div>
      <div style={formRow}>
        <input
          style={inputStyle}
          value={createName}
          maxLength={40}
          placeholder="Group name (e.g. Bio Squad)"
          onChange={(e) => setCreateName(e.target.value)}
        />
        <button style={primaryBtn} disabled={busy} onClick={create}>
          Create
        </button>
      </div>
      <div style={sectionLabel}>Join with a code</div>
      <div style={formRow}>
        <input
          style={inputStyle}
          value={joinCode}
          maxLength={8}
          placeholder="Enter invite code"
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
        />
        <button style={primaryBtn} disabled={busy} onClick={join}>
          Join
        </button>
      </div>
      {msg ? <div style={msgStyle}>{msg}</div> : null}
      <hr style={dividerStyle} />
      {loading ? (
        <div style={emptyStyle}>Loading your groups…</div>
      ) : groups.length === 0 ? (
        <div style={emptyStyle}>
          You're not in any study groups yet. Create one and share the code, or
          join a friend's group to compete on a private leaderboard.
        </div>
      ) : (
        groups.map((g) => (
          <GroupCard
            key={g.code}
            group={g}
            user={user}
            D={D}
            busy={busy}
            open={openCode === g.code}
            onToggle={() => setOpenCode(openCode === g.code ? "" : g.code)}
            onLeave={leave}
          />
        ))
      )}
    </div>
  );
}

export function LeaderboardHub({ user, userDisplayName, userSchool, D, onHome }) {
  const [tab, setTab] = useState("global");
  const card = D ? "#13131f" : "#ffffff";
  const bd = D ? "#262844" : "#e9e7f3";
  const muc = D ? "#9aa3c2" : "#5b6478";
  const wrap = { maxWidth: 760, margin: "0 auto", padding: "8px 16px 80px" };
  const backBtn = {
    background: "none",
    border: "none",
    color: muc,
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    padding: "6px 0",
    marginBottom: 6,
  };
  const heroCard = {
    borderRadius: 22,
    padding: "26px 26px",
    marginBottom: 18,
    color: "#fff",
    background:
      "linear-gradient(135deg, var(--riq-primary), var(--riq-primary-2) 55%, var(--riq-primary-3))",
    boxShadow: "0 18px 44px -20px rgba(76,29,149,.55)",
  };
  const heroTitle = { margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-.02em" };
  const heroSub = { margin: "6px 0 0", fontSize: 14, opacity: 0.92, lineHeight: 1.5, maxWidth: 520 };
  const tabBar = { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" };
  const tabBtn = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "9px 16px",
    borderRadius: 999,
    border: "1.5px solid " + bd,
    background: card,
    color: muc,
    fontWeight: 700,
    fontSize: 13.5,
    cursor: "pointer",
    transition: "all .15s",
  };
  const tabBtnActive = {
    background: "var(--riq-accent)",
    borderColor: "var(--riq-accent)",
    color: "#fff",
    boxShadow: "0 8px 20px -10px var(--riq-accent)",
  };
  const panelCard = {
    background: card,
    border: "1.5px solid " + bd,
    borderRadius: 20,
    padding: "20px 20px",
    boxShadow: D
      ? "0 14px 36px -22px rgba(0,0,0,.7)"
      : "0 14px 36px -22px rgba(16,24,40,.18)",
  };
  const hint = { color: muc, fontSize: 12.5, marginTop: 12 };
  const TABS = [
    { id: "global", label: "Global", icon: "\uD83C\uDF0D" },
    { id: "school", label: "School", icon: "\uD83C\uDFEB" },
    { id: "friends", label: "Friends", icon: "\uD83D\uDC65" },
    { id: "groups", label: "Groups", icon: "\uD83E\uDD1D" },
  ];
  return (
    <div style={wrap}>
      <button style={backBtn} onClick={onHome}>
        ← Home
      </button>
      <div style={heroCard}>
        <h1 style={heroTitle}>Leaderboards</h1>
        <p style={heroSub}>
          See how you stack up — across everyone, at your school, with
          friends, and inside your private study groups.
        </p>
      </div>
      <div style={tabBar}>
        {TABS.map((t) => {
          const active = tab === t.id;
          const tStyle = active ? { ...tabBtn, ...tabBtnActive } : tabBtn;
          return (
            <button key={t.id} style={tStyle} onClick={() => setTab(t.id)}>
              <span>{t.icon}</span> {t.label}
            </button>
          );
        })}
      </div>
      <div style={panelCard}>
        {tab === "global" ? <GlobalLeaderboard user={user} D={D} /> : null}
        {tab === "school" ? (
          <div>
            <SchoolLeaderboard user={user} school={userSchool} D={D} />
            {!userSchool ? (
              <p style={hint}>
                Add your school in Account Settings to rank against classmates.
              </p>
            ) : null}
          </div>
        ) : null}
        {tab === "friends" ? <FriendsPanel user={user} D={D} /> : null}
        {tab === "groups" ? (
          <StudyGroupsPanel
            user={user}
            userDisplayName={userDisplayName}
            userSchool={userSchool}
            D={D}
          />
        ) : null}
      </div>
    </div>
  );
}
