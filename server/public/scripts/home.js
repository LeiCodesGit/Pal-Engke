document.addEventListener("DOMContentLoaded", () => {
  // Dynamic greeting based on time
  const greetingHeader = document.querySelector(".greeting h1");
  const name = "Maria"; // You can replace this dynamically later from session/user data

  const hour = new Date().getHours();
  let greeting = "Good Evening";

  if (hour < 12) greeting = "Good Morning";
  else if (hour < 18) greeting = "Good Afternoon";

  greetingHeader.textContent = `${greeting}, ${name}! 👋🏽`;

  // Click feedback for meal cards
  document.querySelectorAll(".meal-card").forEach((card) => {
    card.addEventListener("click", () => {
      const mealName = card.querySelector("h3").textContent;
      alert(`You selected ${mealName}! 🍽️`);
    });
  });
});