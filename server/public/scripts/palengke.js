document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ palengke.js loaded");

  const mapElement = document.getElementById("leaflet-map");
  if (!mapElement) {
    console.error("❌ Map container not found!");
    return;
  }

  // Initialize Leaflet Map
  const map = L.map("leaflet-map").setView([14.6760, 121.0437], 14);
  console.log("🗺️ Leaflet initialized");

  // Load OpenStreetMap tiles
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);
  console.log("✅ Tile layer added");

  // Add default center marker (Pal-Engke HQ)
  const defaultMarker = L.marker([14.6760, 121.0437]).addTo(map);
  defaultMarker.bindPopup("<b>Pal-Engke HQ</b><br>Welcome!").openPopup();

  // Request user geolocation
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      console.log(`📍 User location: ${lat}, ${lng}`);
      map.setView([lat, lng], 15);

      const userMarker = L.marker([lat, lng]).addTo(map)
        .bindPopup("📍 You are here")
        .openPopup();

      // Fetch vendors near user location
      try {
        const res = await fetch(`/api/vendors?lat=${lat}&lng=${lng}&radius=3000`);
        const vendors = await res.json();

        if (!Array.isArray(vendors) || vendors.length === 0) {
          console.warn("⚠️ No vendors found nearby.");
          return;
        }

        vendors.forEach(v => {
          if (v.location?.coordinates) {
            const [vendorLng, vendorLat] = v.location.coordinates;
            const marker = L.marker([vendorLat, vendorLng]).addTo(map);

            const infoHTML = `
              <div style="font-family: 'Poppins', sans-serif; min-width:200px;">
                <strong>${v.name}</strong><br>
                📍 ${v.address || "No address available"}<br>
                ⏰ ${v.hours || "No schedule"}<br>
                ⭐ ${v.rating || "No rating"}<br><br>
                <button class="btn-ai" onclick="getAiSuggestion()">💡 Get AI Meal Suggestion</button>
              </div>
            `;

            marker.bindPopup(infoHTML);
          }
        });
      } catch (err) {
        console.error("❌ Error fetching vendors:", err);
      }
    }, (err) => {
      console.warn("⚠️ Location access denied:", err);
      alert("Please allow location access to view nearby markets.");
    });
  } else {
    alert("Geolocation not supported by this browser.");
  }
});

// ====== AI Meal Suggestion Function ======
async function getAiSuggestion() {
  const ingredients = prompt("Enter ingredients you found in this market:");
  if (!ingredients) return;

  try {
    const res = await fetch("/api/suggest-meal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients }),
    });

    const data = await res.json();
    alert(data.suggestion || "No suggestion found.");
  } catch (err) {
    console.error("❌ AI request failed:", err);
    alert("AI suggestion failed. Please try again later.");
  }
}
