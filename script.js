document.addEventListener("DOMContentLoaded", () => {
  const loadingEl = document.getElementById("loading");
  const errorEl = document.getElementById("error");
  const contentEl = document.getElementById("content");
  const dateDisplay = document.getElementById("date-display");
  const eventsList = document.getElementById("events-list");
  const suggestionsList = document.getElementById("suggestions-list");

  const datePicker = document.getElementById("date-picker");
  const prevBtn = document.getElementById("prev-day");
  const nextBtn = document.getElementById("next-day");
  const todayBtn = document.getElementById("today-btn");

  // Current displayed date (month/day only — year is ignored for content)
  let currentDate = new Date();

  // Check for ?date=MM-DD URL parameter
  const params = new URLSearchParams(window.location.search);
  const dateParam = params.get("date");
  if (dateParam && /^\d{2}-\d{2}$/.test(dateParam)) {
    const [mm, dd] = dateParam.split("-").map(Number);
    if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) {
      currentDate = new Date(currentDate.getFullYear(), mm - 1, dd);
    }
  }

  // Set date picker value and load initial content
  syncPicker();
  loadDate(currentDate);

  // Navigation handlers
  prevBtn.addEventListener("click", () => {
    currentDate.setDate(currentDate.getDate() - 1);
    syncPicker();
    loadDate(currentDate);
  });

  nextBtn.addEventListener("click", () => {
    currentDate.setDate(currentDate.getDate() + 1);
    syncPicker();
    loadDate(currentDate);
  });

  todayBtn.addEventListener("click", () => {
    currentDate = new Date();
    syncPicker();
    loadDate(currentDate);
  });

  datePicker.addEventListener("change", () => {
    if (!datePicker.value) return;
    const [y, m, d] = datePicker.value.split("-").map(Number);
    currentDate = new Date(y, m - 1, d);
    loadDate(currentDate);
  });

  function syncPicker() {
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, "0");
    const d = String(currentDate.getDate()).padStart(2, "0");
    datePicker.value = `${y}-${m}-${d}`;
  }

  function loadDate(date) {
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const fileName = `${mm}-${dd}.json`;

    // Update date display
    dateDisplay.textContent = date.toLocaleDateString("he-IL", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Reset UI
    eventsList.innerHTML = "";
    suggestionsList.innerHTML = "";
    contentEl.classList.add("hidden");
    errorEl.classList.add("hidden");
    loadingEl.classList.remove("hidden");

    fetch(`content/${fileName}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status);
        return res.json();
      })
      .then((data) => {
        renderContent(data);
        loadingEl.classList.add("hidden");
        contentEl.classList.remove("hidden");
      })
      .catch(() => {
        loadingEl.classList.add("hidden");
        errorEl.classList.remove("hidden");
      });
  }

  function renderContent(data) {
    if (data.hebrew_date) {
      dateDisplay.textContent += ` — ${data.hebrew_date}`;
    }

    if (data.literary_events && data.literary_events.length > 0) {
      data.literary_events.forEach((event) => {
        const card = document.createElement("div");
        card.className = `event-card ${event.type === "israeli" ? "israeli" : ""}`;

        let headerHTML = `<span class="event-title">${escapeHTML(event.title)}</span>`;
        if (event.year) {
          headerHTML += `<span class="event-year">(${event.year})</span>`;
        }
        if (event.type === "israeli") {
          headerHTML += `<span class="badge-israeli">ישראלי</span>`;
        }

        card.innerHTML = `
          <div class="event-header">${headerHTML}</div>
          <p class="event-description">${escapeHTML(event.description)}</p>
        `;
        eventsList.appendChild(card);
      });
    }

    if (data.post_suggestions && data.post_suggestions.length > 0) {
      data.post_suggestions.forEach((suggestion) => {
        const card = document.createElement("div");
        card.className = "suggestion-card";

        let hashtagsHTML = "";
        if (suggestion.hashtags && suggestion.hashtags.length > 0) {
          hashtagsHTML = `<div class="hashtags">${suggestion.hashtags
            .map((tag) => `<span class="hashtag">${escapeHTML(tag)}</span>`)
            .join("")}</div>`;
        }

        card.innerHTML = `
          <div class="suggestion-title">${escapeHTML(suggestion.title)}</div>
          <p class="suggestion-description">${escapeHTML(suggestion.description)}</p>
          ${hashtagsHTML}
        `;
        suggestionsList.appendChild(card);
      });
    }
  }

  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
});
