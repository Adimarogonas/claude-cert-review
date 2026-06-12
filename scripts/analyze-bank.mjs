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
console.log("");
console.log("--- Per-scenario letter distribution ---");
for (const sc of SCENARIOS) {
  const d = [0,0,0,0];
  sc.questions.forEach(q => d[q.correct]++);
  console.log(`  S${sc.id} (${sc.questions.length}q): A=${d[0]} B=${d[1]} C=${d[2]} D=${d[3]}  "${sc.title}"`);
}
console.log("");
console.log("Questions where correct IS the sole longest:", longestOffenders.join(", "));
