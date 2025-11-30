// backend/server.js

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend static files so a single server can host frontend + API
app.use(express.static(path.join(__dirname, "../frontend")));

// ---------- Helper Functions for Strength Calculation ----------

// 1. Length score flen(L)
function lengthScore(L) {
  if (L < 8) return 0;
  if (L >= 12) return 1;
  return (L - 8) / 4; // linear between 8 and 12
}

// 2. Character class score fclasses(s')
function classScore(password) {
  let hasLower = false;
  let hasUpper = false;
  let hasDigit = false;
  let hasSpecial = false;

  for (const ch of password) {
    if (/[a-z]/.test(ch)) hasLower = true;
    else if (/[A-Z]/.test(ch)) hasUpper = true;
    else if (/[0-9]/.test(ch)) hasDigit = true;
    else hasSpecial = true;
  }

  const count = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;
  return count / 4;
}

// 3. Entropy(s')
function calculateEntropy(password) {
  if (!password || password.length === 0) return 0;

  const freq = {};
  for (const ch of password) {
    freq[ch] = (freq[ch] || 0) + 1;
  }

  const len = password.length;
  let entropyPerChar = 0;

  for (const ch in freq) {
    const p = freq[ch] / len;
    entropyPerChar += -p * Math.log2(p);
  }

  // Total bits of entropy = per-character entropy * length
  return entropyPerChar * len;
}

// 4. Penalty for common substrings fpenalty(s')
function penalty(password) {
  const lower = password.toLowerCase();

  const commonWords = ["password", "1234", "qwerty", "admin", "user", "apple"];
  for (const word of commonWords) {
    if (lower.includes(word)) {
      return 1;
    }
  }
  return 0;
}

// 5. Compute overall strength Str(s')
function computeStrength(password) {
  const L = password.length;

  const fL = lengthScore(L);
  const fC = classScore(password);
  const ent = calculateEntropy(password);
  const fP = penalty(password);

  // Weights from your slides
  const wL = 20;
  const wC = 25;
  const wE = 2;
  const wP = 30;

  let score = fL * wL + fC * wC + ent * wE - fP * wP;

  // Clamp score between 0 and 100
  if (score < 0) score = 0;
  if (score > 100) score = 100;

  let label;
  if (score < 40) label = "Weak";
  else if (score < 70) label = "Medium";
  else label = "Strong";

  return {
    score: Number(score.toFixed(2)),
    label,
    details: {
      length: L,
      flen: Number(fL.toFixed(2)),
      fclasses: Number(fC.toFixed(2)),
      entropy: Number(ent.toFixed(2)),
      penalty: fP,
    },
  };
}

// ---------- Greedy Rule-Based Optimizer (No ML) ----------

// Random character generator for entropy improvement
function randomChar() {
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const special = "!@#$%^&*";
  const all = lower + upper + digits + special;

  const idx = Math.floor(Math.random() * all.length);
  return all[idx];
}

function strengthenPassword(originalPassword, target = 70) {
  let pwd = originalPassword || "";
  if (pwd.length === 0) {
    // If empty, generate a random strong password directly
    pwd = "Ap31X9qZ!";
  }

  // Step 1: Ensure minimum length >= 8 (append pattern characters)
  const minLen = 8;
  const lengthPattern = "Xy9!";
  while (pwd.length < minLen) {
    pwd += lengthPattern[pwd.length % lengthPattern.length];
  }

  // Step 2: Ensure character classes (append missing ones)
  let hasLower = /[a-z]/.test(pwd);
  let hasUpper = /[A-Z]/.test(pwd);
  let hasDigit = /[0-9]/.test(pwd);
  let hasSpecial = /[^a-zA-Z0-9]/.test(pwd);

  if (!hasLower) pwd += "a";
  if (!hasUpper) pwd += "A";
  if (!hasDigit) pwd += "7";
  if (!hasSpecial) pwd += "!";

  // Step 3: Fix common/dictionary substrings using simple substitutions
  let temp = pwd;

  temp = temp.replace(/password/gi, "P@ssw0rd");
  temp = temp.replace(/qwerty/gi, "Qw3rTy");
  temp = temp.replace(/1234/g, "1#3$");
  temp = temp.replace(/admin/gi, "Adm1n");
  temp = temp.replace(/apple/gi, "App1e");

  pwd = temp;

  // Step 4: Improve entropy by replacing repeated characters
  // We will iteratively modify until score >= target or max iterations reached
  let attempt = 0;
  const maxAttempts = 15;

  while (attempt < maxAttempts) {
    const { score } = computeStrength(pwd);
    if (score >= target) break;

    // Find the most frequent character
    const freq = {};
    for (const ch of pwd) {
      freq[ch] = (freq[ch] || 0) + 1;
    }

    let maxChar = null;
    let maxCount = 0;

    for (const ch in freq) {
      if (freq[ch] > maxCount) {
        maxCount = freq[ch];
        maxChar = ch;
      }
    }

    // Replace one occurrence of the most frequent char with a random different char
    if (maxChar !== null && maxCount > 1) {
      const idx = pwd.indexOf(maxChar);
      let newChar = randomChar();
      // Ensure different char
      while (newChar === maxChar) {
        newChar = randomChar();
      }
      pwd = pwd.slice(0, idx) + newChar + pwd.slice(idx + 1);
    } else {
      // No repetition to fix, just add a random char to increase entropy
      pwd += randomChar();
    }

    attempt++;
  }

  const finalStrength = computeStrength(pwd);
  return { suggestion: pwd, strength: finalStrength };
}

// Generate up to 3 alternative strong passwords based on one base suggestion
function generateSuggestions(originalPassword, target = 70) {
  const { suggestion: base } = strengthenPassword(originalPassword, target);
  const suggestions = new Set();
  suggestions.add(base);

  // Small variants based on base
  const variant1 = base.endsWith("!") ? base : base + "!";
  const variant2 = base.length > 2 ? base[0] + "*" + base.slice(1) : "*" + base;
  const variant3 = "Xy" + base;

  [variant1, variant2, variant3].forEach((cand) => {
    const { score } = computeStrength(cand);
    if (score >= target) {
      suggestions.add(cand);
    }
  });

  return Array.from(suggestions).slice(0, 3);
}

// ---------- API Routes ----------

// Health check (API)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Password Strength Optimizer API is running." });
});

// For any other requests that are not API routes, serve the SPA
// Serve any non-/api routes with the frontend app (use a regex to avoid express path parsing issues)
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// Main endpoint: check strength + suggestions
app.post("/api/checkPassword", (req, res) => {
  const { password } = req.body;

  if (typeof password !== "string") {
    return res.status(400).json({ error: "Password must be a string." });
  }

  const strength = computeStrength(password);
  const suggestions = generateSuggestions(password);

  res.json({
    originalPassword: password,
    strength,
    suggestions,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
