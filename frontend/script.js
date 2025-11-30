// frontend/script.js

// Use a relative API URL so the frontend works whether served directly
// or when the backend hosts the frontend (same-origin).
const API_URL = "/api/checkPassword";

const passwordInput = document.getElementById("passwordInput");
const checkBtn = document.getElementById("checkBtn");

const resultSection = document.getElementById("resultSection");
const suggestionSection = document.getElementById("suggestionSection");

const scoreValue = document.getElementById("scoreValue");
const labelValue = document.getElementById("labelValue");
const progressFill = document.getElementById("progressFill");
const detailsList = document.getElementById("detailsList");
const suggestionsList = document.getElementById("suggestionsList");

checkBtn.addEventListener("click", async () => {
  const password = passwordInput.value;

  if (!password) {
    alert("Please enter a password first.");
    return;
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Something went wrong");
    }

    const data = await response.json();
    renderResult(data);
  } catch (err) {
    console.error(err);
    alert("Error: " + err.message);
  }
});

function renderResult(data) {
  const { strength, suggestions } = data;
  const { score, label, details } = strength;

  // Show result section
  resultSection.classList.remove("hidden");

  scoreValue.textContent = score;
  labelValue.textContent = label;

  // Progress bar color + width based on score
  progressFill.style.width = `${score}%`;

  if (score < 40) {
    progressFill.style.background = "#ef4444"; // red
  } else if (score < 70) {
    progressFill.style.background = "#f97316"; // orange
  } else {
    progressFill.style.background = "#22c55e"; // green
  }

  // Details list
  detailsList.innerHTML = "";
  const items = [
    `Length: ${details.length}`,
    `Length score (flen): ${details.flen}`,
    `Character class score (fclasses): ${details.fclasses}`,
    `Entropy (approx bits): ${details.entropy}`,
    `Common-word penalty: ${details.penalty}`,
  ];

  items.forEach((txt) => {
    const li = document.createElement("li");
    li.textContent = txt;
    detailsList.appendChild(li);
  });

  // Suggestions
  suggestionsList.innerHTML = "";
  if (suggestions && suggestions.length > 0) {
    suggestionSection.classList.remove("hidden");
    suggestions.forEach((sugg) => {
      const li = document.createElement("li");
      li.textContent = sugg;
      li.classList.add("suggestion-item");

      li.addEventListener("click", () => {
        copyToClipboard(sugg);
      });

      suggestionsList.appendChild(li);
    });
  } else {
    suggestionSection.classList.add("hidden");
  }
}

function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      alert("Copied to clipboard: " + text);
    })
    .catch((err) => {
      console.error(err);
      alert("Could not copy to clipboard");
    });
}
