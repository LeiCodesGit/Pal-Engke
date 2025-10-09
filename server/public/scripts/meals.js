document.getElementById("mealForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const ingredients = document.getElementById("ingredients").value.trim();
  if (!ingredients) return;

  const chatBox = document.getElementById("chatBox");

  // Add user message
  const userMsg = document.createElement("div");
  userMsg.classList.add("user-message");
  userMsg.textContent = ingredients;
  chatBox.appendChild(userMsg);
  chatBox.scrollTop = chatBox.scrollHeight;

  // Add bot "typing" message
  const botMsg = document.createElement("div");
  botMsg.classList.add("bot-message");
  botMsg.textContent = "Thinking...";
  chatBox.appendChild(botMsg);
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const response = await fetch("/api/suggest-meal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients }),
    });

    const data = await response.json();

    if (response.ok && data.suggestion) {
      // ✅ Display suggestion directly in chat
      botMsg.innerHTML = data.suggestion.replace(/\n/g, "<br>");
    } else if (data.error || data.suggestion?.includes("❌")) {
      botMsg.textContent = "❌ This doesn’t seem like a valid meal or food input.";
    } else {
      botMsg.textContent = "⚠️ Sorry, I couldn’t find a meal suggestion.";
    }
  } catch (error) {
    console.error("Error:", error);
    botMsg.textContent = "❌ Something went wrong. Please try again.";
  }

  document.getElementById("ingredients").value = "";
});
