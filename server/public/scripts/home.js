document.addEventListener("DOMContentLoaded", () => {
  const greetingHeader = document.querySelector(".greeting h1");

  const currentText = greetingHeader.textContent;
  const nameMatch = currentText.match(/, (.*)!/);
  const name = nameMatch ? nameMatch[1] : "Guest";

  const hour = new Date().getHours();
  let greeting = "Good Evening";

  if (hour < 12) greeting = "Good Morning";
  else if (hour < 18) greeting = "Good Afternoon";

  greetingHeader.textContent = `${greeting}, ${name}! 👋🏽`;
});
