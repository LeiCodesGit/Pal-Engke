document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.querySelector(".search-bar input");
  const searchButton = document.querySelector(".search-bar button");
  const recipeCards = document.querySelectorAll(".recipe-card");

  // Handle search
  searchButton.addEventListener("click", () => {
    const query = searchInput.value.toLowerCase().trim();

    recipeCards.forEach((card) => {
      const title = card.querySelector("h3").textContent.toLowerCase();
      card.style.display = title.includes(query) ? "flex" : "none";
    });
  });

  // Category tabs
  const tabs = document.querySelectorAll(".tabs button");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
    });
  });
});