// Statistical audit of the question bank.
// Usage: node scripts/analyze-bank.mjs
import { SCENARIOS, getAllQuestions } from "../models/scenarios.js";

const qs = getAllQuestions();
const N = qs.length;

// 1. Answer distribution by letter
const letters = ["A", "B", "C", "D"];
const dist = [0, 0, 0, 0];
for (const q of qs) dist[q.correct]++;

// 2. Longest-answer bias — is the correct option the longest?
let correctIsLongest = 0;
let correctIsShortest = 0;
const longestOffenders = [];
for (const q of qs) {
  const lens = q.options.map(o => o.length);
  const max = Math.max(...lens);
  const min = Math.min(...lens);
  const correctLen = lens[q.correct];
  // strict longest (sole max)
  const numAtMax = lens.filter(l => l === max).length;
  const numAtMin = lens.filter(l => l === min).length;
  if (correctLen === max && numAtMax === 1) {
    correctIsLongest++;
    longestOffenders.push(q.id);
  }
  if (correctLen === min && numAtMin === 1) correctIsShortest++;
}

// 3. Per-option average length: correct vs distractors
let sumCorrect = 0, sumDistractor = 0, cntDistractor = 0;
for (const q of qs) {
  q.options.forEach((o, i) => {
    if (i === q.correct) sumCorrect += o.length;
    else { sumDistractor += o.length; cntDistractor++; }
  });
}

console.log("=== QUESTION BANK STATISTICAL AUDIT ===");
console.log(`Total questions: ${N}`);
console.log(`Scenarios: ${SCENARIOS.length}`);
console.log("");
console.log("--- Answer distribution (target 25% each) ---");
letters.forEach((L, i) => {
  const pct = ((dist[i] / N) * 100).toFixed(1);
  console.log(`  ${L}: ${dist[i].toString().padStart(3)}  (${pct}%)`);
});
// chi-square against uniform
const expected = N / 4;
const chi = dist.reduce((s, o) => s + Math.pow(o - expected, 2) / expected, 0);
console.log(`  chi-square vs uniform (df=3, crit .05=7.81): ${chi.toFixed(2)} -> ${chi > 7.81 ? "SKEWED" : "OK"}`);
console.log("");
console.log("--- Longest-answer bias ---");
console.log(`  Correct == sole longest option: ${correctIsLongest}/${N} (${((correctIsLongest/N)*100).toFixed(1)}%)  [chance ~25%]`);
console.log(`  Correct == sole shortest option: ${correctIsShortest}/${N} (${((correctIsShortest/N)*100).toFixed(1)}%)`);
console.log(`  Avg correct-option length:    ${(sumCorrect / N).toFixed(1)} chars`);
console.log(`  Avg distractor-option length: ${(sumDistractor / cntDistractor).toFixed(1)} chars`);
console.log(`  Ratio (correct/distractor): ${(sumCorrect/N / (sumDistractor/cntDistractor)).toFixed(2)}`);
// 4. Length RANK of the correct option.
// NOTE: "correct is never the longest" is just as exploitable as "always the
// longest" — a bank optimised to 0% here hands test-takers the inverse rule.
// The target is a uniform rank distribution, not a minimised one.
const rankNames = ["shortest", "2nd", "3rd", "longest"];
const rank = [0, 0, 0, 0];
for (const q of qs) {
  const lens = q.options.map(o => o.length);
  const sorted = [...lens].sort((a, b) => a - b);
  rank[sorted.indexOf(lens[q.correct])]++;
}
console.log("");
console.log("--- Correct-option length rank (target 25% each) ---");
rankNames.forEach((n, i) => {
  console.log(`  ${n.padEnd(9)} ${String(rank[i]).padStart(3)}  (${((rank[i]/N)*100).toFixed(1)}%)`);
});
const chiRank = rank.reduce((s, o) => s + Math.pow(o - N/4, 2) / (N/4), 0);
console.log(`  chi-square vs uniform (df=3, crit .05=7.81): ${chiRank.toFixed(2)} -> ${chiRank > 7.81 ? "SKEWED" : "OK"}`);

console.log("");
console.log("--- Per-scenario letter distribution ---");
let skewedScenarios = 0;
for (const sc of SCENARIOS) {
  const d = [0,0,0,0];
  sc.questions.forEach(q => d[q.correct]++);
  const n = sc.questions.length;
  const chiS = d.reduce((s, o) => s + Math.pow(o - n/4, 2) / (n/4), 0);
  // Longest run of the same answer letter in a row — a visible pattern to learners.
  let run = 1, longestRun = 1;
  for (let i = 1; i < n; i++) {
    run = sc.questions[i].correct === sc.questions[i-1].correct ? run + 1 : 1;
    if (run > longestRun) longestRun = run;
  }
  const unused = d.filter(x => x === 0).length;
  if (chiS > 7.81) skewedScenarios++;
  const flags = [
    chiS > 7.81 ? "SKEWED" : "",
    unused ? `${unused} unused letter(s)` : "",
    longestRun >= 3 ? `run of ${longestRun}` : "",
  ].filter(Boolean).join(", ");
  console.log(`  S${sc.id} (${n}q): A=${d[0]} B=${d[1]} C=${d[2]} D=${d[3]}  chi=${chiS.toFixed(1)}${flags ? "  <-- " + flags : ""}  "${sc.title}"`);
}
console.log(`  Scenarios significantly skewed: ${skewedScenarios}/${SCENARIOS.length}`);
console.log("");
console.log("Questions where correct IS the sole longest:", longestOffenders.join(", "));
