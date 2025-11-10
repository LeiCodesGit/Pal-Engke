document.getElementById("mealForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const ingredients = document.getElementById("ingredients").value.trim();
  if (!ingredients) return;

  const chatBox = document.getElementById("chatBox");

  const userMsg = document.createElement("div");
  userMsg.classList.add("user-message");
  userMsg.textContent = ingredients;
  chatBox.appendChild(userMsg);
  chatBox.scrollTop = chatBox.scrollHeight;

  const botMsg = document.createElement("div");
  botMsg.classList.add("bot-message");
  botMsg.textContent = "Thinking...";
  chatBox.appendChild(botMsg);
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    let userLocation = null;
    if (navigator.geolocation) {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
      } catch (err) {
        console.log("Location not available:", err);
      }
    }

    const response = await fetch("/api/suggest-meal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients, userLocation }),
    });

    const data = await response.json();

    if (response.ok && data.suggestion) {
      botMsg.innerHTML = data.suggestion.replace(/\n/g, "<br>");
      
      if (data.markets && data.markets.length > 0) {
        const marketsDiv = document.createElement("div");
        marketsDiv.classList.add("bot-message", "markets-list");
        let html = '<div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px;">';
        html += '<strong>🛒 Where to buy these ingredients:</strong><div style="margin-top: 8px;">';
        
        data.markets.forEach(market => {
          html += '<div style="padding: 8px; margin: 5px 0; background: white; border-radius: 5px; border-left: 3px solid #38a34a;">';
          html += '<strong>' + market.name + '</strong><br>';
          html += '<small style="color: #666;">';
          html += '📍 ' + market.address + '<br>';
          if (market.distance) {
            html += '📏 ' + (market.distance / 1000).toFixed(2) + ' km away<br>';
          }
          html += '⏰ ' + market.hours + '<br>';
          html += '📦 ' + (market.specialties ? market.specialties.join(', ') : 'General goods');
          html += '</small><br>';
          html += '<button class="btn-view-map" onclick="viewOnMap(' + market.lat + ', ' + market.lng + ', \'' + market.name.replace(/'/g, "\\'") + '\')">🗺️ View on Map</button>';
          html += '</div>';
        });
        
        html += '</div></div>';
        marketsDiv.innerHTML = html;
        chatBox.appendChild(marketsDiv);
      }
    } else if (data.error || data.suggestion?.includes("❌")) {
      botMsg.textContent = "❌ This doesn't seem like a valid meal or food input.";
    } else {
      botMsg.textContent = "⚠️ Sorry, I couldn't find a meal suggestion.";
    }
  } catch (error) {
    console.error("Error:", error);
    botMsg.textContent = "❌ Something went wrong. Please try again.";
  }

  chatBox.scrollTop = chatBox.scrollHeight;
  document.getElementById("ingredients").value = "";
});

function viewOnMap(lat, lng, marketName) {
  sessionStorage.setItem('targetMarket', JSON.stringify({ lat, lng, name: marketName }));
  window.location.href = '/palengke';
}