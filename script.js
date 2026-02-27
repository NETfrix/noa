document.addEventListener("DOMContentLoaded", () => {
  const loadingEl = document.getElementById("loading");
  const errorEl = document.getElementById("error");
  const contentEl = document.getElementById("content");
  const dateDisplay = document.getElementById("date-display");
  const eventsList = document.getElementById("events-list");
  const suggestionsList = document.getElementById("suggestions-list");

  const today = new Date();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const fileName = `${mm}-${dd}.json`;

  dateDisplay.textContent = today.toLocaleDateString("he-IL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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
