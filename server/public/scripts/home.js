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
 
  // ===== Budget logic (database-backed with weekly reset) =====
  const budgetCard = document.getElementById("budgetCard");
  const budgetModal = document.getElementById("budgetModal");
  const budgetForm = document.getElementById("budgetForm");
  const weeklyBudgetInput = document.getElementById("weeklyBudget");
  const savingsGoalInput = document.getElementById("savingsGoal");
  const budgetValueEl = document.getElementById("budgetValue");
  const remainingValueEl = document.getElementById("remainingValue");
  const savedTextEl = document.getElementById("savedText");
 
  // Load budget from database
  async function loadBudget() {
    if (!window.currentUser || !window.currentUser.id) {
      console.warn("No user logged in");
      return;
    }
 
    try {
      const response = await fetch(`/api/budget/current/${window.currentUser.id}`);
      if (!response.ok) {
        throw new Error(`Failed to load budget: ${response.statusText}`);
      }
 
      const data = await response.json();
      if (data.success && data.budget) {
        const { weekly, remaining, savingsGoal } = data.budget;
       
        // Update UI
        budgetValueEl.textContent = Number(weekly || 0).toLocaleString();
        remainingValueEl.textContent = Number(remaining || 0).toLocaleString();
       
        // Calculate spent amount (weekly - remaining)
        const spent = (weekly || 0) - (remaining || 0);
        savedTextEl.textContent = spent > 0 ? `₱${Number(spent).toLocaleString()} spent this week` : "";
       
        // Pre-fill form inputs
        weeklyBudgetInput.value = weekly || 0;
        savingsGoalInput.value = savingsGoal || 0;
      }
    } catch (error) {
      console.error("Error loading budget:", error);
    }
  }
 
  // Load budget on page load
  loadBudget();
 
  // Open modal on card click
  budgetCard.addEventListener("click", () => openModal(budgetModal));
 
  // Save budget to database
  budgetForm.addEventListener("submit", async (e) => {
    e.preventDefault();
   
    if (!window.currentUser || !window.currentUser.id) {
      alert("You must be logged in to set a budget");
      return;
    }
 
    const weekly = Number(weeklyBudgetInput.value || 0);
    const savingsGoal = Number(savingsGoalInput.value || 0);
 
    if (weekly <= 0) {
      alert("Please enter a valid weekly budget amount");
      return;
    }
 
    try {
      const response = await fetch("/api/budget/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: window.currentUser.id,
          weeklyBudget: weekly,
          savingsGoal: savingsGoal
        })
      });
 
      const data = await response.json();
     
      if (data.success) {
        // Update UI with new values
        budgetValueEl.textContent = weekly.toLocaleString();
        remainingValueEl.textContent = weekly.toLocaleString(); // Reset remaining to full amount
        savedTextEl.textContent = ""; // Clear spent text on new budget
        closeModal(budgetModal);
       
        // Show success message
        const successMsg = document.createElement("div");
        successMsg.className = "alert alert-success";
        successMsg.textContent = "Budget saved successfully! Resets every Sunday.";
        successMsg.style.cssText = "position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 15px 20px; border-radius: 8px; z-index: 10000; box-shadow: 0 4px 6px rgba(0,0,0,0.1);";
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3000);
      } else {
        alert(data.message || "Failed to save budget");
      }
    } catch (error) {
      console.error("Error saving budget:", error);
      alert("An error occurred while saving your budget");
    }
  });
 
  // ===== DECLARE MODAL VARIABLES FIRST =====
  const mealModal = document.getElementById("mealModal");
  const mealImg = document.getElementById("mealImg");
  const mealTitle = document.getElementById("mealTitle");
  const mealDesc = document.getElementById("mealDesc");
  const mealIngredients = document.getElementById("mealIngredients");
  const mealSteps = document.getElementById("mealSteps");
  const mealCost = document.getElementById("mealCost");
 
  // ===== LOAD AI SUGGESTIONS FROM MEALS PAGE =====
  function loadAiSuggestions() {
    const aiMeals = localStorage.getItem('aiSuggestedMeals');
    const aiMarkets = localStorage.getItem('aiRecommendedMarkets');
 
    console.log('=== LOADING AI SUGGESTIONS ===');
    console.log('Raw aiMeals from localStorage:', aiMeals);
    console.log('Raw aiMarkets from localStorage:', aiMarkets);
 
    // Load AI suggested meals into "Today's Meal Ideas" section
    if (aiMeals) {
      try {
        const meals = JSON.parse(aiMeals);
        const container = document.getElementById('suggestedMealsContainer');
        const aiSection = document.getElementById('aiSuggestedMeals');
        const clearBtn = document.getElementById('clearMealsBtn');
        const noMealsText = document.getElementById('noMealsText');
       
        console.log('Parsed meals:', meals); // Debug
       
        if (meals.length > 0 && container) {
          container.innerHTML = '';
         
          // Show the AI section
          if (aiSection) aiSection.style.display = 'block';
         
          // Show clear button
          if (clearBtn) clearBtn.style.display = 'flex';
          // Hide no meals text
          if (noMealsText) noMealsText.style.display = 'none';
         
          meals.forEach(meal => {
            const mealCard = document.createElement('div');
            mealCard.className = 'ai-meal-card';
            const mealDataEscaped = JSON.stringify(meal).replace(/"/g, '&quot;');
            mealCard.innerHTML = `
              <div class="ai-meal-header">
                <h3>${meal.name}</h3>
                <button class="remove-meal-btn" data-meal-id="${meal.id}" aria-label="Remove meal">
                  <i data-lucide="x"></i>
                </button>
              </div>
              <button class="view-meal-details-btn" data-meal="${mealDataEscaped}">
                <i data-lucide="eye"></i> View Details
              </button>
            `;
            container.appendChild(mealCard);
          });
 
          if (window.lucide && lucide.createIcons) lucide.createIcons();
 
          // Add remove button handlers
          document.querySelectorAll('.remove-meal-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
              e.stopPropagation();
              removeMeal(btn.dataset.mealId);
            });
          });
 
          // Add view details handlers
          document.querySelectorAll('.view-meal-details-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              try {
                const meal = JSON.parse(btn.dataset.meal);
                showMealDetails(meal);
              } catch (e) {
                console.error('Error parsing meal data:', e);
              }
            });
          });
        } else {
          // No AI meals - hide section and show no meals text
          if (aiSection) aiSection.style.display = 'none';
          if (noMealsText) {
            noMealsText.style.display = 'block';
            if (aiSection) aiSection.style.display = 'block'; // Show section to display the message
          }
        }
      } catch (error) {
        console.error('Error loading AI meals:', error);
      }
    } else {
      // No AI meals in localStorage - show no meals text
      const noMealsText = document.getElementById('noMealsText');
      const aiSection = document.getElementById('aiSuggestedMeals');
      if (noMealsText && aiSection) {
        noMealsText.style.display = 'block';
        aiSection.style.display = 'block'; // Show section to display the message
      }
    }
 
    // Load AI recommended markets
    if (aiMarkets) {
      try {
        const markets = JSON.parse(aiMarkets);
        const container = document.getElementById('nearbyMarketsContainer');
       
        console.log('Parsed markets:', markets); // Debug
       
        if (markets.length > 0 && container) {
          container.innerHTML = '';
         
          markets.forEach(market => {
            const marketCard = document.createElement('div');
            marketCard.className = 'market-card';
            marketCard.setAttribute('data-lat', market.lat);
            marketCard.setAttribute('data-lng', market.lng);
            marketCard.setAttribute('data-market', market.name);
            marketCard.innerHTML = `
              <div class="market-card-content">
                <h3>${market.name}</h3>
                <p class="muted">📍 ${market.distance || 'Distance unknown'}</p>
                <p class="muted">🕒 ${market.hours || 'Hours unknown'}</p>
                <p class="muted">🛒 ${market.matchingItems || market.specialties || 'Various items'}</p>
              </div>
              <button class="view-on-map-btn-home">
                <i data-lucide="map"></i> View on Map
              </button>
            `;
            container.appendChild(marketCard);
          });
 
          if (window.lucide && lucide.createIcons) lucide.createIcons();
 
          // Add map button handlers
          document.querySelectorAll('.view-on-map-btn-home').forEach(btn => {
            btn.addEventListener('click', (e) => {
              const card = e.target.closest('.market-card');
              sessionStorage.setItem('targetMarket', JSON.stringify({
                lat: card.dataset.lat,
                lng: card.dataset.lng,
                name: card.dataset.market
              }));
              window.location.href = '/palengke';
            });
          });
        }
      } catch (error) {
        console.error('Error loading AI markets:', error);
      }
    }
  }
 
  function removeMeal(mealId) {
    const aiMeals = localStorage.getItem('aiSuggestedMeals');
    if (aiMeals) {
      try {
        let meals = JSON.parse(aiMeals);
        meals = meals.filter(m => m.id !== mealId);
       
        if (meals.length > 0) {
          localStorage.setItem('aiSuggestedMeals', JSON.stringify(meals));
        } else {
          localStorage.removeItem('aiSuggestedMeals');
          const clearBtn = document.getElementById('clearMealsBtn');
          if (clearBtn) clearBtn.style.display = 'none';
        }
       
        loadAiSuggestions();
      } catch (error) {
        console.error('Error removing meal:', error);
      }
    }
  }
 
  function showMealDetails(meal) {
    mealImg.src = meal.image || '/images/default-meal.jpg';
    mealTitle.textContent = meal.name;
    mealDesc.textContent = meal.description || '';
    mealCost.textContent = meal.cost || '';
 
    mealIngredients.innerHTML = '';
    if (meal.ingredients && meal.ingredients.length > 0) {
      meal.ingredients.forEach(i => {
        const li = document.createElement('li');
        li.textContent = i;
        mealIngredients.appendChild(li);
      });
    }
 
    mealSteps.innerHTML = '';
    if (meal.steps && meal.steps.length > 0) {
      meal.steps.forEach(s => {
        const li = document.createElement('li');
        li.textContent = s;
        mealSteps.appendChild(li);
      });
    }
 
    openModal(mealModal);
  }
 
  const clearMealsBtn = document.getElementById('clearMealsBtn');
  if (clearMealsBtn) {
    clearMealsBtn.addEventListener('click', () => {
      if (confirm('Clear all AI meal suggestions?')) {
        localStorage.removeItem('aiSuggestedMeals');
        clearMealsBtn.style.display = 'none';
        document.getElementById('suggestedMealsContainer').innerHTML = '';
       
        // Show no meals text
        const noMealsText = document.getElementById('noMealsText');
        if (noMealsText) {
          noMealsText.style.display = 'block';
        }
      }
    });
  }
 
  // Load AI suggestions on page load
  loadAiSuggestions();
 
  // ===== Meal modals =====
  // (Variables already declared at top)
 
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