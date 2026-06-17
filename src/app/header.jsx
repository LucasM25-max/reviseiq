import React, { useState, useEffect } from "react";
import { getDisplayName, isAdmin } from "./coreHelpers.js";
import { ACHIEVEMENTS, TrophyGrid } from "./mastery.jsx";
import { generateProgressReport } from "./progress.js";
import { loadGroup, upsertGroupScore } from "./social.jsx";
import { ALL_SUBJECTS } from "./subjects.js";
import { C, I, mu, tx } from "./ui.jsx";

export function Header({
  user,
  userDisplayName,
  D,
  onDark,
  onHome,
  onStudy,
  onDash,
  onTutor,
  onCoach,
  onLeaderboards,
  onAccount,
  onContact,
  onFocus,
  streak,
  onSearch,
  globalOverlays,
  screen,
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const allNavItems = [
    { id: "home", icon: "◎", label: "Today", fn: onHome },
    { id: "study", icon: "▤", label: "Study", fn: onStudy },
    { id: "coach", icon: "✦", label: "Coach", fn: onCoach },
    { id: "dashboard", icon: "▣", label: "Progress", fn: onDash },
    { id: "friends", icon: "◆", label: "Social", fn: onLeaderboards },
    { id: "account", icon: "○", label: "Account", fn: onAccount },
  ].filter((n) => typeof n.fn === "function");
  const displayName = userDisplayName || getDisplayName(user);
  const curItem = allNavItems.find(function (n) {
    return n.id === screen;
  });
  React.useEffect(
    function () {
      if (!menuOpen) return;
      function handler(e) {
        if (!e.target.closest("[data-riq-hdr]")) setMenuOpen(false);
      }
      document.addEventListener("click", handler);
      return function () {
        document.removeEventListener("click", handler);
      };
    },
    [menuOpen],
  );
  var line = D ? "rgba(255,255,255,.08)" : "rgba(16,24,40,.08)";
  var GRAD = "linear-gradient(120deg,#5b54f0,#8b5cf6,#d946ef)";
  var softBg = D ? "rgba(255,255,255,.05)" : "rgba(16,24,40,.04)";
  var barStyle = {
    background: D ? "rgba(10,10,20,.72)" : "rgba(255,255,255,.72)",
    borderBottom: "1px solid " + line,
    backdropFilter: "saturate(180%) blur(18px)",
    WebkitBackdropFilter: "saturate(180%) blur(18px)",
    position: "sticky",
    top: 0,
    zIndex: 50,
  };
  var innerStyle = {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "0 16px",
    height: 56,
    display: "flex",
    alignItems: "center",
    gap: 10,
  };
  var logoStyle = {
    fontFamily: "var(--riq-display, inherit)",
    fontWeight: 800,
    fontSize: 19,
    letterSpacing: "-0.02em",
    background: "none",
    border: "none",
    cursor: "pointer",
    flexShrink: 0,
    padding: 0,
    paddingRight: 2,
  };
  var crumbStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
    color: D ? "#c4b5fd" : "#7c3aed",
    background: D ? "rgba(124,58,237,.18)" : "rgba(124,58,237,.08)",
    borderRadius: 999,
    padding: "4px 11px",
    flexShrink: 0,
  };
  var crumbIcon = { fontSize: 12, opacity: 0.9 };
  var spacerStyle = { flex: 1 };
  var searchStyle = {
    display: "flex",
    alignItems: "center",
    gap: 7,
    background: softBg,
    border: "1px solid " + line,
    borderRadius: 999,
    padding: "6px 14px 6px 11px",
    fontSize: 12.5,
    color: D ? "#9aa3c2" : "#5b6478",
    cursor: "pointer",
    flexShrink: 0,
  };
  var searchIcon = { fontSize: 12, opacity: 0.8 };
  var streakHot = streak >= 7;
  var streakStyle = {
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "5px 11px",
    borderRadius: 999,
    background: streakHot ? (D ? "rgba(249,115,22,.16)" : "#fff7ed") : softBg,
    border: "1px solid " + (streakHot ? "rgba(249,115,22,.5)" : line),
    flexShrink: 0,
  };
  var streakIcon = { fontSize: 13 };
  var streakNum = {
    fontSize: 12,
    fontWeight: 700,
    color: streakHot ? "#f97316" : (D ? "#9aa3c2" : "#5b6478"),
  };
  var iconBtn = {
    width: 34,
    height: 34,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 15,
    background: softBg,
    border: "1px solid " + line,
    borderRadius: 999,
    cursor: "pointer",
    color: D ? "#eef1fb" : "#0a0a14",
    flexShrink: 0,
    lineHeight: 1,
    padding: 0,
  };
  var focusBtn = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 13px",
    borderRadius: 999,
    background: GRAD,
    color: "#fff",
    border: "none",
    fontSize: 12.5,
    fontWeight: 700,
    cursor: "pointer",
    flexShrink: 0,
    boxShadow: "0 6px 16px -6px rgba(124,58,237,.7)",
  };
  var focusBtnIcon = { fontSize: 13, lineHeight: 1 };
  var userChip = {
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "3px 11px 3px 3px",
    borderRadius: 999,
    background: softBg,
    border: "1px solid " + line,
    flexShrink: 0,
  };
  var avatarStyle = {
    width: 27,
    height: 27,
    borderRadius: "50%",
    background: GRAD,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  };
  var nameStyle = {
    fontSize: 12.5,
    fontWeight: 600,
    color: D ? "#eef1fb" : "#0a0a14",
    maxWidth: 120,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };
  var adminBadge = {
    fontSize: 9,
    fontWeight: 800,
    background: GRAD,
    color: "#fff",
    padding: "1px 6px",
    borderRadius: 999,
    flexShrink: 0,
    letterSpacing: "0.03em",
  };
  var menuStyle = {
    position: "absolute",
    top: 62,
    right: 12,
    minWidth: 234,
    background: D ? "rgba(17,18,32,.97)" : "rgba(255,255,255,.98)",
    border: "1px solid " + line,
    borderRadius: 18,
    zIndex: 60,
    padding: 8,
    boxShadow: D
      ? "0 20px 60px rgba(0,0,0,.5)"
      : "0 24px 60px rgba(16,24,40,.16)",
    backdropFilter: "saturate(180%) blur(20px)",
    WebkitBackdropFilter: "saturate(180%) blur(20px)",
  };
  var avatarInitial = ((displayName || "?").trim().charAt(0) || "?").toUpperCase();
  function hdrItemStyle(active) {
    return {
      display: "flex",
      alignItems: "center",
      gap: 12,
      width: "100%",
      padding: "9px 11px",
      background: active ? GRAD : "transparent",
      border: "none",
      borderRadius: 12,
      cursor: "pointer",
      color: active ? "#fff" : D ? "#eef1fb" : "#0a0a14",
      fontWeight: active ? 700 : 500,
      fontSize: 13.5,
      textAlign: "left",
      marginBottom: 2,
    };
  }
  function hdrItemIcon(active) {
    return {
      width: 28,
      height: 28,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 14,
      borderRadius: 9,
      flexShrink: 0,
      background: active
        ? "rgba(255,255,255,.22)"
        : D
          ? "rgba(255,255,255,.06)"
          : "rgba(16,24,40,.05)",
      color: active ? "#fff" : D ? "#c4b5fd" : "#7c3aed",
    };
  }
  return (
    <header data-riq-hdr="1" style={barStyle}>
      <div style={innerStyle}>
        <button onClick={onHome} style={logoStyle} aria-label="ReviseIQ home">
          <span className="riq-gradient-text">ReviseIQ</span>
        </button>
        {curItem && curItem.id !== "home" && (
          <span style={crumbStyle}>
            <span style={crumbIcon}>{curItem.icon}</span>
            {curItem.label}
          </span>
        )}
        <div style={spacerStyle} />
        <button onClick={onSearch} style={searchStyle} aria-label="Search">
          <span style={searchIcon}>🔍</span>
          <span>Search</span>
        </button>
        {streak > 0 && (
          <div style={streakStyle} title={streak + "-day streak"}>
            <span style={streakIcon}>🔥</span>
            <span style={streakNum}>{streak}d</span>
          </div>
        )}
        {typeof onFocus === "function" && (
          <button onClick={onFocus} style={focusBtn} aria-label="Focus Mode" title="Focus Mode">
            <span style={focusBtnIcon}>⏱</span>
            <span>Focus</span>
          </button>
        )}
        <button onClick={onDark} style={iconBtn} aria-label="Toggle theme">
          {D ? "☀️" : "🌙"}
        </button>
        <div style={userChip}>
          <span style={avatarStyle}>{avatarInitial}</span>
          <span style={nameStyle}>{displayName}</span>
          {isAdmin(user) && <span style={adminBadge}>ADMIN</span>}
        </div>
        <button
          onClick={function (e) {
            e.stopPropagation();
            setMenuOpen(function (o) {
              return !o;
            });
          }}
          style={iconBtn}
          aria-label="Open menu"
        >
          ☰
        </button>
      </div>
      {menuOpen && (
        <div style={menuStyle}>
          {allNavItems.map(function (item) {
            var active = screen === item.id;
            return (
              <button
                key={item.id}
                onClick={function () {
                  item.fn();
                  setMenuOpen(false);
                }}
                style={hdrItemStyle(active)}
              >
                <span style={hdrItemIcon(active)}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </div>
      )}
      {globalOverlays}
    </header>
  );
}

export function AccountScreen({
  D,
  user,
  userDisplayName,
  userSchool,
  accounts,
  selectedSubjectIds,
  boardSels,
  achievements,
  reportData,
  onBack,
  onSave,
  onEditSubjects,
}) {
  var [dnIn, setDNIn] = React.useState(userDisplayName || "");
  var [schIn, setSchIn] = React.useState(userSchool || "");
  var [pwIn, setPwIn] = React.useState("");
  var [saved, setSaved] = React.useState(false);
  var [pwErr, setPwErr] = React.useState("");
  var [groupId, setGroupId] = React.useState("default");
  var [groupData, setGroupData] = React.useState(loadGroup("default"));
  var isAdmin = false; // Admin role removed from ReviseIQ.
  var isEmail = user && user.indexOf("@") !== -1;
  var bd2 = D ? "#262844" : "#e5e7eb";
  var handleSave = function () {
    if (pwIn && (pwIn.length < 4 || pwIn.length > 30)) {
      setPwErr("Password must be 4-30characters.");
      return;
    }
    setPwErr("");
    var changes = {};
    if (dnIn.trim()) changes.displayName = dnIn.trim();
    changes.school = schIn.trim();
    if (pwIn) changes.newPassword = pwIn;

    onSave(changes);
    setSaved(true);
    setTimeout(function () {
      setSaved(false);
    }, 1800);
  };

  var selSubjList = ALL_SUBJECTS.filter(function (s) {
    return (
      !s._politics && selectedSubjectIds && selectedSubjectIds.includes(s.id)
    );
  });
  var politicsSub = ALL_SUBJECTS.find(function (s) {
    return s._politics;
  });
  React.useEffect(
    function () {
      setGroupData(loadGroup(groupId));
    },
    [groupId],
  );
  return (
    <div
      style={{
        minHeight: "100vh",
        background: D ? "radial-gradient(1200px 820px at 12% -12%, rgba(124,58,237,.20), transparent 60%), radial-gradient(1000px 720px at 102% 4%, rgba(217,70,239,.14), transparent 55%), radial-gradient(900px 700px at 50% 120%, rgba(59,130,246,.10), transparent 55%), #0a0a14" : "radial-gradient(1100px 780px at 10% -10%, rgba(124,58,237,.10), transparent 60%), radial-gradient(940px 660px at 104% 2%, rgba(217,70,239,.08), transparent 55%), radial-gradient(820px 640px at 50% 116%, rgba(59,130,246,.06), transparent 55%), #f6f6fc",
        padding: 24,
        overflowY: "auto",
      }}
    >
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <button
          onClick={onBack}
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
          Back
        </button>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            marginBottom: 4,
            color: tx(D),
          }}
        >
          Account Settings
        </h2>
        <p style={{ fontSize: 12, color: mu(D), marginBottom: 24 }}>
          Update your profile and leaderboard details
        </p>

        {}
        <div style={{ ...C(D), padding: 22, marginBottom: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 18,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#7c3aed,#8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 700,
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              {(userDisplayName || user || "?")[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: tx(D) }}>
                {userDisplayName || user}
              </div>
              <div style={{ fontSize: 11, color: mu(D) }}>
                {isEmail ? "Email account" : "Usernameaccount"}
                {userSchool ? " · " + userSchool : ""}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: mu(D),
                  display: "block",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Display Name
              </label>

              <input
                style={I(D)}
                value={dnIn}
                onChange={function (e) {
                  setDNIn(e.target.value);
                  setSaved(false);
                }}
                placeholder="Name shown on leaderboard"
                maxLength={40}
              />
              <p style={{ fontSize: 11, color: mu(D), marginTop: 4 }}>
                Shown on leaderboards instead of your username/email
              </p>
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: mu(D),
                  display: "block",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                School
              </label>
              <input
                style={I(D)}
                value={schIn}
                onChange={function (e) {
                  setSchIn(e.target.value);
                  setSaved(false);
                }}
                placeholder="Your school name (for leaderboard)"
                maxLength={60}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: mu(D),
                  display: "block",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                New Password{" "}
                <span
                  style={{
                    fontWeight: 400,
                    color: mu(D),
                    textTransform: "none",
                  }}
                >
                  (leave blank to keep current)
                </span>
              </label>
              <input
                type="password"
                style={I(D)}
                value={pwIn}
                onChange={function (e) {
                  setPwIn(e.target.value);
                  setSaved(false);
                  setPwErr("");
                }}
                placeholder="Enter new password"
                maxLength={30}
              />
              {pwErr && (
                <p style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>
                  {pwErr}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleSave}
            style={{
              width: "100%",
              background: saved ? "#16a34a" : "#7c3aed",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "12px 0",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all .2s",
              marginTop: 20,
            }}
          >
            {saved ? "✓ Saved!" : "Save Changes"}
          </button>
        </div>
        {}
        <div style={{ ...C(D), padding: 22, marginBottom: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: tx(D),
                  marginBottom: 2,
                }}
              >
                My Subjects
              </h3>

              <p style={{ fontSize: 12, color: mu(D) }}>
                {selSubjList.length}
                subject{selSubjList.length !== 1 ? "s" : ""} selected + Politics
              </p>
            </div>
            <button
              onClick={onEditSubjects}
              style={{
                padding: "8px 18px",
                borderRadius: 10,
                border: "1.5px solid #7c3aed",
                background: "transparent",
                color: "#7c3aed",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Edit Subjects
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {selSubjList.map(function (s) {
              var b = boardSels[s.id] || "AQA";
              return (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 12px",
                    borderRadius: 9,
                    background: D ? "#191a2b" : "#f9fafb",
                    border: "1px solid " + bd2,
                  }}
                >
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{s.icon}</span>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13,
                      fontWeight: 500,
                      color: tx(D),
                    }}
                  >
                    {s.name}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 9px",
                      borderRadius: 8,
                      background: s.accent + "22",
                      color: s.accent,
                    }}
                  >
                    {b}
                  </span>
                </div>
              );
            })}
            {politicsSub && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 12px",
                  borderRadius: 9,
                  background: D ? "rgba(15,118,110,.08)" : "#f0fdfa",
                  border: "1px solid #0f766e22",
                }}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>
                  {politicsSub.icon}
                </span>
                <span
                  style={{
                    flex: 1,
                    fontSize: 13,
                    fontWeight: 500,
                    color: D ? "#5eead4" : "#0f766e",
                  }}
                >
                  {politicsSub.name}
                </span>
                <span
                  style={{ fontSize: 11, fontWeight: 700, color: "#0f766e" }}
                >
                  Always On
                </span>
              </div>
            )}
          </div>
        </div>

        {}
        {achievements && (
          <div style={{ ...C(D), padding: 22, marginBottom: 18 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 14,
                flexWrap: "wrap",
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: D ? "#e8ecf4" : "#111827",
                    margin: 0,
                  }}
                >
                  Achievements
                </h3>

                <p
                  style={{
                    fontSize: 12,
                    color: D ? "#9ca3af" : "#6b7280",
                    margin: "2px 00",
                  }}
                >
                  {achievements.length} / {ACHIEVEMENTS.length} unlocked
                </p>
              </div>
            </div>
            <TrophyGrid D={D} achievementIds={achievements.map((a) => a.id)} />
          </div>
        )}
        <div style={{ ...C(D), padding: 22, marginBottom: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              marginBottom: 10,
              flexWrap: "wrap",
            }}
          >
            <h3
              style={{ fontSize: 15, fontWeight: 700, color: tx(D), margin: 0 }}
            >
              Study Groups
            </h3>
            <input
              value={groupId}
              onChange={function (e) {
                setGroupId(e.target.value || "default");
              }}
              style={{
                ...I(D, { maxWidth: 170, fontSize: 12, padding: "6px 10px" }),
              }}
              placeholder="Group ID"
            />
          </div>
          <button
            onClick={function () {
              var g = upsertGroupScore(groupId, user, 0, 0);
              setGroupData(g);
            }}
            style={{
              padding: "7px 12px",
              borderRadius: 9,
              border: "1px solid #7c3aed",
              background: "transparent",
              color: "#7c3aed",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Join / Refresh Group
          </button>
          <div style={{ marginTop: 10, fontSize: 12, color: mu(D) }}>
            Members:
            {(groupData.members || []).length}
          </div>
          <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
            {(groupData.leaderboard || []).slice(0, 5).map(function (r, idx) {
              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "6px 8px",
                    borderRadius: 8,
                    background: D ? "#191a2b" : "#f9fafb",
                    border: "1px solid " + bd2,
                  }}
                >
                  <span style={{ fontSize: 12, color: tx(D) }}>
                    {idx + 1}. {r.user}
                  </span>
                  <span style={{ fontSize: 11, color: mu(D) }}>
                    {r.totalQuestions || 0}Q ·{r.streak || 0}
                  </span>
                </div>
              );
            })}
          </div>
          <button
            onClick={function () {
              generateProgressReport(reportData || {});
            }}
            style={{
              marginTop: 12,
              width: "100%",
              padding: "10px 0",
              borderRadius: 10,
              border: "none",
              background: "#0ea5e9",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Download Report
          </button>
        </div>

        <button
          onClick={onBack}
          style={{
            width: "100%",
            background: "transparent",
            color: mu(D),
            border: "1.5px solid" + bd2,
            borderRadius: 12,
            padding: "10px 0",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}

export function AdminBar({ D, actions }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 10,
        background: D ? "rgba(99,102,241,.12)" : "#f5f3ff",
        border: "1.5px solid #7c3aed",
        marginBottom: 16,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: "#7c3aed",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginRight: 4,
        }}
      >
        Admin
      </span>
      {actions.map(function (a, i) {
        return (
          <button
            key={i}
            onClick={a.fn}
            style={{
              fontSize: 12,
              padding: "5px 14px",
              borderRadius: 7,
              border: "1.5px solid #7c3aed",
              background: "#7c3aed",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
              whiteSpace: "nowrap",
              transition: "opacity .15s",
            }}
            onMouseEnter={function (e) {
              e.currentTarget.style.opacity = "0.85";
            }}
            onMouseLeave={function (e) {
              e.currentTarget.style.opacity = "1";
            }}
          >
            {a.label}
          </button>
        );
      })}
    </div>
  );
}
