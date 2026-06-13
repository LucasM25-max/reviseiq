

export function buildProgressSummary(userData) {
  if (
    typeof window !== "undefined" &&
    typeof window.generateSummary === "function"
  ) {
    try {
      return window.generateSummary(userData);
    } catch (_) {}
  }
  var weak =
    (userData.weakestTopics || []).slice(0, 3).join(", ") || "None identified";
  return (
    "You are on a " +
    (userData.streak || 0) +
    " day streak, studied" +
    (userData.totalDaysStudied || 0) +
    " days, attempted " +
    (userData.questionsAttempted || 0) +
    "questions, and your readiness score is " +
    (userData.readinessScore || 0) +
    "%. Focus next on:" +
    weak +
    "."
  );
}

export function generateProgressReport(userData) {
  var summary = buildProgressSummary(userData);
  var w = window.open("", "_blank", "width=900,height=700");
  if (!w) return false;
  var html =
    '<!doctype html><html><head><title>ReviseIQ Progress Report</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{margin-bottom:0}table{border-collapse:collapse;width:100%;margin-top:14px}td,th{border:1px solid#ddd;padding:8px;text-align:left}.muted{color:#666}</style></head><body><h1>ReviseIQ Progress Report</h1><p class=\"muted\">Generated ' +
    new Date().toLocaleString() +
    "</p><table><tr><th>Metric</th><th>Value</th></tr><tr><td>Current streak</td><td>" +
    (userData.streak || 0) +
    "</td></tr><tr><td>Total days studied</td><td>" +
    (userData.totalDaysStudied || 0) +
    "</td></tr><tr><td>Questions attempted</td><td>" +
    (userData.questionsAttempted || 0) +
    "</td></tr><tr><td>Weakest topics</td><td>" +
    ((userData.weakestTopics || []).join(", ") || "None") +
    "</td></tr><tr><td>Readiness score</td><td>" +
    (userData.readinessScore || 0) +
    "%</td></tr></table><h3>Summary</h3><p>" +
    String(summary).replace(/</g, "&lt;") + "</p></body></html>";
  w.document.open();
  w.document.write(html);
  w.document.close();
  setTimeout(function () {
    try {
      w.print();
    } catch (_) {}
  }, 120);
  return true;
}
