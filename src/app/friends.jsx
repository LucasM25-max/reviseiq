import React, { useState, useEffect } from "react";
import { B, I, mu, tx } from "./ui.jsx";

export function FriendsPanel({ user, D }) {
  const [fd, setFD] = useState({ friends: [], incoming: [], sent: [] });
  const [lbMap, setLbMap] = useState({});
  const [tab, setFTab] = useState("lb");
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const FRKEY = (u) => `gcse:fr:${u.replace(/\W/g, "-")}`;
  const FQKEY = (u) => `gcse:frq:${u.replace(/\W/g, "-")}`;
  const bd2 = D ? "#262844" : "#e5e7eb";
  const loadFD = async () => {
    let base = { friends: [], incoming: [], sent: [] };
    try {
      const r = await window.storage.get(FRKEY(user), true);
      if (r?.value) base = JSON.parse(r.value);
    } catch (e) {}
    try {
      const r = await window.storage.get(FQKEY(user), true);
      if (r?.value) {
        const inc = JSON.parse(r.value);
        const merged = [...new Set([...base.incoming, ...inc])].filter(
          (u) => !base.friends.includes(u),
        );
        base = { ...base, incoming: merged };
      }
    } catch (e) {}
    setFD(base);
  };
  const saveFD = async (d) => {
    setFD(d);
    try {
      await window.storage.set(FRKEY(user), JSON.stringify(d), true);
    } catch (e) {}
  };
  useEffect(() => {
    loadFD();
  }, []);
  useEffect(() => {
    const run = async () => {
      const m = {};
      for (const u of [user, ...fd.friends]) {
        try {
          const r = await window.storage.get(
            `gcse:lb:${u.replace(/\W/g, "-")}`,
            true,
          );
          if (r?.value) m[u] = JSON.parse(r.value);
        } catch (e) {}
      }
      setLbMap(m);
    };

    run();
  }, [fd.friends.join(",")]);
  const sendReq = async () => {
    const query = search.trim().toLowerCase();
    if (!query) {
      setMsg("Enter an email, username or display name.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const ar = await window.storage.get("gcse:accounts", true);
      const accs = ar?.value ? JSON.parse(ar.value) : {};

      let targetKey = null;
      for (const k of Object.keys(accs)) {
        const dn = (accs[k]?.displayName || "").toLowerCase();
        if (k.toLowerCase() === query || dn === query) {
          targetKey = k;
          break;
        }
      }

      if (!targetKey) {
        try {
          const lbList = await window.storage.list("gcse:lb:", true);
          if (lbList?.keys?.length) {
            const all = await Promise.allSettled(
              lbList.keys.map((k) => window.storage.get(k, true)),
            );
            for (const r of all) {
              if (r.status === "fulfilled" && r.value?.value) {
                try {
                  const e = JSON.parse(r.value.value);
                  const dn = (e.displayName || "").toLowerCase();
                  const un = (e.username || "").toLowerCase();
                  if (dn === query || un === query) {
                    targetKey = e.username || null;
                    break;
                  }
                } catch (_) {}
              }
            }
          }
        } catch (_) {}
      }
      if (!targetKey) {
        setMsg("No user found with that email, username or displayname.");
        setBusy(false);
        return;
      }
      if (targetKey === user) {
        setMsg("That's you!");
        setBusy(false);
        return;
      }
      if (fd.friends.includes(targetKey)) {
        setMsg("Already friends with" + targetKey + "!");
        setBusy(false);
        return;
      }
      if (fd.sent.includes(targetKey)) {
        setMsg("Request already sent to" + targetKey + ".");
        setBusy(false);
        return;
      }
      let inc = [];

      try {
        const qr = await window.storage.get(FQKEY(targetKey), true);
        if (qr?.value) inc = JSON.parse(qr.value);
      } catch (e) {}
      if (!inc.includes(user)) {
        inc.push(user);
        await window.storage.set(FQKEY(targetKey), JSON.stringify(inc), true);
      }
      await saveFD({ ...fd, sent: [...fd.sent, targetKey] });
      const dispName = accs[targetKey]?.displayName || targetKey;
      setSearch("");
      setMsg("✓ Friend request sent to " + dispName + "!");
    } catch (e) {
      setMsg("Error: " + e.message);
    }
    setBusy(false);
  };
  const acceptReq = async (req) => {
    const nd = {
      ...fd,
      friends: [...fd.friends, req],
      incoming: fd.incoming.filter((u) => u !== req),
    };
    try {
      let rd = { friends: [], incoming: [], sent: [] };
      const rr = await window.storage.get(FRKEY(req), true);
      if (rr?.value) rd = JSON.parse(rr.value);
      await window.storage.set(
        FRKEY(req),
        JSON.stringify({
          ...rd,
          friends: [...rd.friends.filter((u) => u !== user), user],
          sent: rd.sent.filter((u) => u !== user),
        }),
        true,
      );
    } catch (e) {}
    try {
      const sr = await window.storage.get(FQKEY(user), true);
      if (sr?.value)
        await window.storage.set(
          FQKEY(user),
          JSON.stringify(JSON.parse(sr.value).filter((u) => u !== req)),
          true,
        );
    } catch (e) {}
    await saveFD(nd);
  };
  const declineReq = async (req) => {
    try {
      const sr = await window.storage.get(FQKEY(user), true);
      if (sr?.value)
        await window.storage.set(
          FQKEY(user),
          JSON.stringify(JSON.parse(sr.value).filter((u) => u !== req)),
          true,
        );
    } catch (e) {}
    await saveFD({ ...fd, incoming: fd.incoming.filter((u) => u !== req) });
  };
  const removeFriend = async (fr) => {
    const nd = { ...fd, friends: fd.friends.filter((u) => u !== fr) };
    try {
      let rd = { friends: [], incoming: [], sent: [] };
      const rr = await window.storage.get(FRKEY(fr), true);
      if (rr?.value) rd = JSON.parse(rr.value);
      await window.storage.set(
        FRKEY(fr),
        JSON.stringify({
          ...rd,
          friends: rd.friends.filter((u) => u !== user),
        }),
        true,
      );
    } catch (e) {}
    await saveFD(nd);
  };

  const lb = [user, ...fd.friends]
    .map((u) => ({
      u,
      score: lbMap[u]?.score || 0,
      school: lbMap[u]?.school || "",
    }))
    .sort((a, b) => b.score - a.score);
  return (
    <div style={{ marginTop: 14 }}>
      <div
        style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}
      >
        {[
          ["lb", "Friends LB"],
          ["add", "Add"],
          [
            "req",
            `
Requests${
              fd.incoming.length > 0
                ? `
(${fd.incoming.length})`
                : ""
            }`,
          ],
        ].map(([t, lbl]) => (
          <button
            key={t}
            onClick={() => setFTab(t)}
            style={{
              fontSize: 11,
              padding: "4px 10px",
              borderRadius: 20,
              border: `1.5px solid ${t === tab ? "#7c3aed" : bd2}`,
              background: t === tab ? "#7c3aed" : "transparent",
              color: t === tab ? "#fff" : mu(D),
              cursor: "pointer",
              fontWeight: t === tab ? 600 : 400,
            }}
          >
            {lbl}
          </button>
        ))}
      </div>

      {tab === "lb" &&
        (lb.length <= 1 ? (
          <p
            style={{
              fontSize: 12,
              color: mu(D),
              fontStyle: "italic",
              padding: "4px 0",
            }}
          >
            Add friends to see your friends leaderboard!
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              maxHeight: 320,
              overflowY: "auto",
            }}
          >
            {lb.map((e, i) => {
              const isMe = e.u === user;
              const medal =
                i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
              const name = lbMap[e.u]?.displayName || e.u || "";
              return (
                <div
                  key={e.u}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 10px",
                    borderRadius: 8,
                    background: isMe
                      ? D
                        ? "rgba(99,102,241,.2)"
                        : "#f5f3ff"
                      : D
                        ? "#1c1d30"
                        : "#f9fafb",
                    border: isMe
                      ? "1.5px solid #7c3aed"
                      : "1.5px solid transparent",
                  }}
                >
                  <span
                    style={{ fontSize: 12, width: 20, textAlign: "center" }}
                  >
                    {medal || (
                      <span style={{ fontSize: 10, color: mu(D) }}>
                        {i + 1}
                      </span>
                    )}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 12,
                      fontWeight: isMe ? 700 : 400,
                      color: isMe ? "#7c3aed" : tx(D),
                    }}
                  >
                    {name}
                    {isMe ? "(you)" : ""}
                  </span>
                  {e.school && (
                    <span
                      style={{
                        fontSize: 10,
                        color: mu(D),
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: 80,
                      }}
                    >
                      {e.school}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: mu(D),
                      flexShrink: 0,
                    }}
                  >
                    {e.score}
                    pts
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      {tab === "add" && (
        <div>
          <p style={{ fontSize: 12, color: mu(D), marginBottom: 8 }}>
            Search by email, username or display name:
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              style={{ ...I(D, { flex: 1 }) }}
              placeholder="Email, username or display name…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setMsg("");
              }}
              onKeyDown={(e) => e.key === "Enter" && sendReq()}
            />
            <button
              onClick={sendReq}
              disabled={busy || !search.trim()}
              style={{
                ...B("#7c3aed", false, {
                  padding: "8px 14px",
                  fontSize: 12,
                  opacity: busy || !search.trim() ? 0.4 : 1,
                  cursor: busy || !search.trim() ? "not-allowed" : "pointer",
                }),
              }}
            >
              {busy ? "…" : "Add"}
            </button>
          </div>
          {msg && (
            <p
              style={{
                fontSize: 11,
                marginTop: 5,
                color: msg.startsWith("✓") ? "#16a34a" : "#ef4444",
              }}
            >
              {msg}
            </p>
          )}
          {fd.friends.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: mu(D),
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 6,
                }}
              >
                Your friends
              </p>
              {fd.friends.map((fr) => (
                <div
                  key={fr}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "7px 0",
                    borderBottom: `1px solid ${bd2}`,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg,#7c3aed,#8b5cf6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 12,
                      flexShrink: 0,
                    }}
                  >
                    {(lbMap[fr]?.displayName || fr || "?")[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: tx(D),
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {lbMap[fr]?.displayName || fr}
                    </div>
                    {lbMap[fr]?.school && (
                      <div style={{ fontSize: 10, color: mu(D) }}>
                        {lbMap[fr].school}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeFriend(fr)}
                    style={{
                      fontSize: 10,
                      color: "#ef4444",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {tab === "req" && (
        <div>
          {!fd.incoming.length && (
            <p style={{ fontSize: 12, color: mu(D), fontStyle: "italic" }}>
              No pending friend requests.
            </p>
          )}
          {fd.incoming.map((req) => (
            <div
              key={req}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                borderRadius: 8,
                background: D ? "#191a2b" : "#f9fafb",
                marginBottom: 6,
              }}
            >
              <span
                style={{ flex: 1, fontSize: 13, fontWeight: 600, color: tx(D) }}
              >
                {req}
              </span>
              <button
                onClick={() => acceptReq(req)}
                style={{
                  ...B("#16a34a", false, { fontSize: 11, padding: "4px 10px" }),
                }}
              >
                {" "}
                Accept
              </button>
              <button
                onClick={() => declineReq(req)}
                style={{
                  ...B("#ef4444", true, { fontSize: 11, padding: "4px 10px" }),
                }}
              ></button>
            </div>
          ))}
          {fd.sent.length > 0 && (
            <p style={{ fontSize: 11, color: mu(D), marginTop: 8 }}>
              Sent: {fd.sent.join(",")}
            </p>
          )}
          <button
            onClick={loadFD}
            style={{
              marginTop: 8,
              fontSize: 11,
              color: mu(D),
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            {" "}
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}
