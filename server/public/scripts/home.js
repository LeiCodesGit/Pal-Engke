// public/scripts/home.js
document.addEventListener("DOMContentLoaded", () => {
  // Update body padding based on bottom nav (if exists) to avoid overlap
  function adjustForNav() {
    const nav = document.querySelector(".bottom-nav, .navbar, nav.bottom-nav");
    if (nav) {
      const navHeight = nav.offsetHeight;
      // add a little extra spacing
      const extra = 18;
      document.querySelector(".dashboard-container").style.paddingBottom = `${navHeight + 56}px`;
    }
  }
  adjustForNav();
  window.addEventListener("resize", adjustForNav);

  // Greeting (time aware)
  const greetingHeader = document.querySelector(".greeting-text h1");
  const name = greetingHeader ? greetingHeader.textContent.replace(/Good (Morning|Afternoon|Evening),?\s*/i, "").replace("!", "").trim() : null;
  const hour = new Date().getHours();
  let greet = "Good Evening";
  if (hour < 12) greet = "Good Morning";
  else if (hour < 18) greet = "Good Afternoon";
  if (greetingHeader) greetingHeader.textContent = `${greet}, ${name || (window.user && window.user.firstName) || "Guest"}!`;

  // Modal utilities
  function openModal(modal) {
    modal.style.display = "block";
    modal.setAttribute("aria-hidden", "false");
    // focus first input for accessibility
    const focusable = modal.querySelector("input, button, [tabindex='0']");
    if (focusable) focusable.focus();
  }
  function closeModal(modal) {
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
  }

  // Close buttons (delegated)
  document.addEventListener("click", (e) => {
    if (e.target.matches(".close-btn")) {
      const modal = e.target.closest(".modal");
      if (modal) closeModal(modal);
    }
  });

  // Close when clicking backdrop
  document.addEventListener("click", (e) => {
    if (e.target.classList && e.target.classList.contains("modal")) {
      closeModal(e.target);
    }
  });

  // ===== Budget logic (persist) =====
  const budgetCard = document.getElementById("budgetCard");
  const budgetModal = document.getElementById("budgetModal");
  const budgetForm = document.getElementById("budgetForm");
  const weeklyBudgetInput = document.getElementById("weeklyBudget");
  const savingsGoalInput = document.getElementById("savingsGoal");
  const budgetValueEl = document.getElementById("budgetValue");
  const remainingValueEl = document.getElementById("remainingValue");
  const savedTextEl = document.getElementById("savedText");

  // load saved values (if any)
  const savedBudget = localStorage.getItem("weeklyBudget");
  const savedGoal = localStorage.getItem("savingsGoal");
  if (savedBudget !== null) {
    weeklyBudgetInput.value = savedBudget;
    budgetValueEl.textContent = Number(savedBudget).toLocaleString();
  }
  if (savedGoal !== null) {
    savingsGoalInput.value = savedGoal;
    savedTextEl.textContent = savedGoal ? `₱${Number(savedGoal).toLocaleString()} saved this week` : "";
  }
  if (savedBudget !== null) {
    const remaining = (Number(savedBudget) - (Number(savedGoal) || 0));
    remainingValueEl.textContent = Number(remaining).toLocaleString();
  }

  budgetCard.addEventListener("click", () => openModal(budgetModal));

  budgetForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const weekly = Number(weeklyBudgetInput.value || 0);
    const goal = Number(savingsGoalInput.value || 0);
    localStorage.setItem("weeklyBudget", weekly);
    localStorage.setItem("savingsGoal", goal);
    // update UI
    budgetValueEl.textContent = weekly.toLocaleString();
    savedTextEl.textContent = goal ? `₱${goal.toLocaleString()} saved this week` : "";
    remainingValueEl.textContent = (weekly - goal).toLocaleString();
    closeModal(budgetModal);
  });

  // ===== Meal modals =====
  const mealModal = document.getElementById("mealModal");
  const mealImg = document.getElementById("mealImg");
  const mealTitle = document.getElementById("mealTitle");
  const mealDesc = document.getElementById("mealDesc");
  const mealIngredients = document.getElementById("mealIngredients");
  const mealSteps = document.getElementById("mealSteps");
  const mealCost = document.getElementById("mealCost");

  document.querySelectorAll(".meal-card").forEach(card => {
    card.addEventListener("click", () => {
      const img = card.dataset.img || "";
      const title = card.dataset.meal || "";
      const desc = card.dataset.desc || "";
      const cost = card.dataset.cost || "";
      let ingredients = [];
      let steps = [];
      try {
        ingredients = JSON.parse(card.dataset.ingredients || "[]");
      } catch { ingredients = []; }
      try {
        steps = JSON.parse(card.dataset.steps || "[]");
      } catch { steps = []; }

      mealImg.src = img;
      mealTitle.textContent = title;
      mealDesc.textContent = desc;
      mealCost.textContent = cost;

      // fill ingredients
      mealIngredients.innerHTML = "";
      ingredients.forEach(i => {
        const li = document.createElement("li");
        li.textContent = i;
        mealIngredients.appendChild(li);
      });

      // fill steps
      mealSteps.innerHTML = "";
      steps.forEach(s => {
        const li = document.createElement("li");
        li.textContent = s;
        mealSteps.appendChild(li);
      });

      openModal(mealModal);
    });

    // keyboard accessibility (Enter key)
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); card.click(); }
    });
  });

  // ===== Market modal =====
  const marketCard = document.querySelector(".market-card");
  const marketModal = document.getElementById("marketModal");
  const marketImg = document.getElementById("marketImg");
  const marketTitle = document.getElementById("marketTitle");
  const marketInfo = document.getElementById("marketInfo");
  const marketDesc = document.getElementById("marketDesc");
  const marketLocation = document.getElementById("marketLocation");
  const marketHours = document.getElementById("marketHours");
  const marketWebsite = document.getElementById("marketWebsite");
  const marketDirections = document.getElementById("marketDirections");
  const marketReviews = document.getElementById("marketReviews");
  const marketSave = document.getElementById("marketSave");
  const marketShare = document.getElementById("marketShare");

  if (marketCard) {
    marketCard.addEventListener("click", () => {
      marketImg.src = marketCard.dataset.img || "";
      marketTitle.textContent = marketCard.dataset.market || "";
      marketInfo.textContent = marketCard.dataset.info || "";
      marketDesc.textContent = marketCard.dataset.desc || "";
      marketLocation.textContent = `Address: ${marketCard.dataset.location || ""}`;
      marketHours.textContent = `Hours: ${marketCard.dataset.hours || ""}`;

      // example links (replace with actual)
      const placeName = encodeURIComponent(marketCard.dataset.market || "");
      marketWebsite.href = `https://www.google.com/search?q=${placeName}`;
      marketDirections.href = `https://www.google.com/maps/search/?api=1&query=${placeName}`;
      marketReviews.href = `https://www.google.com/search?q=${placeName}+reviews`;

      openModal(marketModal);
    });
  }

  // Save & Share placeholders
  if (marketSave) {
    marketSave.addEventListener("click", () => {
      alert("Saved to your favorites (placeholder).");
    });
  }
  if (marketShare) {
    marketShare.addEventListener("click", () => {
      const url = window.location.href;
      if (navigator.share) {
        navigator.share({ title: marketTitle.textContent, url }).catch(() => {});
      } else {
        navigator.clipboard.writeText(url).then(()=> alert("Link copied to clipboard"));
      }
    });
  }

  // Ensure modals are keyboard closeable with Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal").forEach(m => closeModal(m));
    }
  });

  // Re-run lucide icons if needed (some SPA setups require this)
  if (window.lucide && lucide.createIcons) lucide.createIcons();
});
