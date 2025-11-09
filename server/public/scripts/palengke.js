// Make map and route globally accessible
window.map = null;
window.currentRoute = null;
window.userLocation = null;

// ====== Helper Functions ======

// Helper function for client-side distance calculation
function calculateDistanceClient(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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

// ====== Show Directions Function ======
function showDirections(destLat, destLng, marketName) {
  if (!window.userLocation) {
    alert("📍 Please allow location access to get directions!");
    return;
  }

  const { lat, lng } = window.userLocation;

  // Remove previous route if exists
  if (window.currentRoute) {
    window.map.removeControl(window.currentRoute);
  }

  // Create routing control with public OSRM router
  window.currentRoute = L.Routing.control({
    waypoints: [
      L.latLng(lat, lng),
      L.latLng(destLat, destLng)
    ],
    router: L.Routing.osrmv1({
      serviceUrl: 'https://router.project-osrm.org/route/v1'
    }),
    routeWhileDragging: false,
    showAlternatives: false,
    lineOptions: {
      styles: [
        { color: '#02472e', opacity: 0.8, weight: 6 }
      ]
    },
    createMarker: function() { return null; }, // Don't create extra markers
    addWaypoints: false,
    draggableWaypoints: false,
    fitSelectedRoutes: true
  }).addTo(window.map);

  // Show route summary
  window.currentRoute.on('routesfound', function(e) {
    const routes = e.routes;
    const summary = routes[0].summary;
    const distance = (summary.totalDistance / 1000).toFixed(2);
    const time = Math.round(summary.totalTime / 60);
    
    alert(`🗺️ Route to ${marketName}:\n\n📏 Distance: ${distance} km\n⏱️ Time: ~${time} minutes`);
  });

  // Handle routing errors
  window.currentRoute.on('routingerror', function(e) {
    console.error('❌ Routing error:', e);
    alert('❌ Unable to calculate route. Please try again or check your internet connection.');
  });

  console.log(`🗺️ Showing directions to ${marketName}`);
}

// ====== Main Initialization ======
document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ palengke.js loaded");

  const mapElement = document.getElementById("leaflet-map");
  if (!mapElement) {
    console.error("❌ Map container not found!");
    return;
  }

  // Initialize AI-Powered Search
  initializeAISearch();

  // Initialize Filters
  initializeFilters();

  // Initialize Leaflet Map
  const map = L.map("leaflet-map").setView([14.6760, 121.0437], 14);
  window.map = map; // Make map globally accessible
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

      // Store user location for AI assistant (make it globally accessible)
      window.userLocation = { lat, lng };

      console.log(`📍 User location: ${lat}, ${lng}`);
      map.setView([lat, lng], 15);

      const userMarker = L.marker([lat, lng]).addTo(map)
        .bindPopup("📍 You are here")
        .openPopup();

      // Fetch vendors near user location
      await fetchNearbyVendors(lat, lng);
    }, (err) => {
      console.warn("⚠️ Location access denied:", err);
      alert("Please allow location access to view nearby markets.");
    });
  } else {
    alert("Geolocation not supported by this browser.");
  }
});

// Function to fetch and display nearby vendors
async function fetchNearbyVendors(lat, lng) {
  if (!lat || !lng) {
    if (window.userLocation) {
      lat = window.userLocation.lat;
      lng = window.userLocation.lng;
    } else {
      console.warn("⚠️ No location available");
      return;
    }
  }

  try {
    const res = await fetch(`/api/vendors?lat=${lat}&lng=${lng}&radius=5000`);
    const vendors = await res.json();

    if (!Array.isArray(vendors) || vendors.length === 0) {
      console.warn("⚠️ No vendors found nearby.");
      document.querySelector(".markets").innerHTML = `
        <div class="text-center p-4">
          <h5>😔 No markets found nearby</h5>
          <p class="text-muted">Try expanding your search radius or check back later</p>
        </div>
      `;
      return;
    }

    console.log(`✅ Found ${vendors.length} nearby vendors`);

    // Clear previous markers except user marker
    if (window.map) {
      window.map.eachLayer((layer) => {
        if (layer instanceof L.Marker && !layer.getPopup()?.getContent().includes("You are here") && !layer.getPopup()?.getContent().includes("Pal-Engke")) {
          window.map.removeLayer(layer);
        }
      });
    }

    // Add markers to map
    vendors.forEach(v => {
      if (v.location?.coordinates) {
        const [vendorLng, vendorLat] = v.location.coordinates;
        const marker = L.marker([vendorLat, vendorLng]).addTo(window.map);

        const infoHTML = `
          <div style="font-family: 'Poppins', sans-serif; min-width:200px;">
            <strong>${v.name}</strong><br>
            📍 ${v.address || "No address available"}<br>
            📦 ${v.category || "General market"}<br>
            ⏰ ${v.hours || "No schedule"}<br>
            ⭐ ${v.rating || "No rating"}<br><br>
            <button class="btn-ai" onclick="getAiSuggestion()">💡 Get AI Meal Suggestion</button>
            <button class="btn-directions" onclick="showDirections(${vendorLat}, ${vendorLng}, '${v.name}')">🗺️ Show Directions</button>
          </div>
        `;

        marker.bindPopup(infoHTML);
      }
    });

    // Update markets section
    const marketsSection = document.querySelector(".markets");
    marketsSection.innerHTML = '<h4 class="fw-bold mb-3">📍 Nearby Markets</h4>';
    
    vendors.slice(0, 5).forEach(v => {
      const distance = calculateDistanceClient(lat, lng, v.location.coordinates[1], v.location.coordinates[0]);
      const card = document.createElement('div');
      card.className = 'market-card shadow-sm p-3 mb-3 rounded';
      card.innerHTML = `
        <h5 class="fw-bold">${v.name}</h5>
        <p class="text-muted">${distance.toFixed(1)} km away</p>
        <p>📦 ${v.category || "General market"}</p>
        <p>🕔 ${v.hours || "Hours not specified"} • 📞 ${v.phone || "No phone listed"}</p>
        ${v.rating ? `<p>⭐ ${v.rating}</p>` : ''}
        ${v.location?.coordinates ? `<button class="btn-directions" onclick="showDirections(${v.location.coordinates[1]}, ${v.location.coordinates[0]}, '${v.name}')">🗺️ Show Directions</button>` : ''}
      `;
      marketsSection.appendChild(card);
    });

  } catch (err) {
    console.error("❌ Error fetching vendors:", err);
  }
}

// ====== Combined AI-Powered Search ======
function initializeAISearch() {
  const searchInput = document.getElementById("search-input");
  const searchBtn = document.getElementById("ai-search-btn");
  const searchIcon = document.getElementById("search-mode-icon");
  const aiResponseBox = document.getElementById("ai-response-box");
  const aiResponse = document.getElementById("ai-response");
  const closeBox = document.querySelector(".ai-close-box");
  const marketsSection = document.querySelector(".markets");
  const suggestionsDiv = document.getElementById("search-suggestions");

  let isAIMode = false;

  if (!searchInput) {
    console.warn("⚠️ Search input not found");
    return;
  }

  // Toggle between Search and AI mode
  searchBtn.onclick = () => {
    isAIMode = !isAIMode;
    if (isAIMode) {
      searchIcon.textContent = "🤖";
      searchInput.placeholder = "Ask AI anything... (e.g., 'seafood markets nearby' or 'best vegetables')";
      searchBtn.style.background = "var(--primary-yellow)";
    } else {
      searchIcon.textContent = "🔍";
      searchInput.placeholder = "Ask AI or search markets... (e.g., 'seafood markets nearby' or 'Barangay Market')";
      searchBtn.style.background = "var(--primary-green)";
    }
  };

  // Close AI response box
  if (closeBox) {
    closeBox.onclick = () => {
      aiResponseBox.style.display = "none";
    };
  }

  // Quick suggestions
  const quickSuggestions = [
    "🐟 Show seafood markets",
    "🥬 Find fresh vegetables",
    "🍖 Where to buy meat",
    "🌾 Organic markets nearby",
    "📍 Nearest markets"
  ];

  searchInput.onfocus = () => {
    if (searchInput.value.trim() === "") {
      suggestionsDiv.innerHTML = quickSuggestions.map(s => 
        `<div class="suggestion-item" onclick="useSuggestion('${s.substring(2)}')">${s}</div>`
      ).join('');
      suggestionsDiv.classList.add('show');
    }
  };

  searchInput.onblur = () => {
    setTimeout(() => suggestionsDiv.classList.remove('show'), 200);
  };

  // Handle Enter key
  searchInput.addEventListener("keypress", async (e) => {
    if (e.key === "Enter") {
      const query = searchInput.value.trim();
      if (query) {
        suggestionsDiv.classList.remove('show');
        await handleSmartSearch(query, marketsSection, aiResponseBox, aiResponse, isAIMode);
      }
    }
  });

  console.log("✅ AI-powered search initialized");
}

// Use suggestion from quick menu
window.useSuggestion = async function(suggestion) {
  const searchInput = document.getElementById("search-input");
  const marketsSection = document.querySelector(".markets");
  const aiResponseBox = document.getElementById("ai-response-box");
  const aiResponse = document.getElementById("ai-response");
  
  searchInput.value = suggestion;
  document.getElementById("search-suggestions").classList.remove('show');
  await handleSmartSearch(suggestion, marketsSection, aiResponseBox, aiResponse, true);
};

// Smart search that decides whether to use AI or direct search
async function handleSmartSearch(query, marketsSection, aiResponseBox, aiResponse, forceAI = false) {
  const queryLower = query.toLowerCase();
  
  // AI trigger words
  const aiKeywords = ['where', 'best', 'recommend', 'suggest', 'find', 'show', 'seafood', 'fish', 
                      'vegetable', 'meat', 'fruit', 'organic', 'fresh', 'nearby', 'closest', 
                      'isda', 'gulay', 'karne', 'prutas', 'malapit'];
  
  const shouldUseAI = forceAI || aiKeywords.some(keyword => queryLower.includes(keyword));

  if (shouldUseAI) {
    // Use AI Assistant
    console.log("🤖 Using AI mode for query:", query);
    aiResponse.innerHTML = `
      <div class="d-flex justify-content-center align-items-center" style="padding: 2rem;">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <span class="ms-3">🤖 AI is analyzing nearby markets...</span>
      </div>
    `;
    aiResponseBox.style.display = "block";

    try {
      const response = await fetch("/api/map-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query,
          userLocation: window.userLocation
        })
      });

      const data = await response.json();

      if (data.success) {
        // Display AI response
        aiResponse.innerHTML = `
          <div style="font-size: 1rem; line-height: 1.8;">
            ${data.response.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
          </div>
        `;

        // Display recommended markets
        if (data.markets && data.markets.length > 0) {
          displayRecommendedMarkets(data.markets, marketsSection);
          
          // Add markers to map
          data.markets.forEach(m => {
            if (m.lat && m.lng && window.map) {
              const marker = L.marker([m.lat, m.lng]).addTo(window.map);
              marker.bindPopup(`
                <div style="font-family: 'Poppins', sans-serif; min-width:200px;">
                  <strong>${m.name}</strong><br>
                  📍 ${m.distance}<br>
                  ⏰ ${m.hours}<br>
                  📦 ${m.specialties}<br><br>
                  <button class="btn-directions" onclick="showDirections(${m.lat}, ${m.lng}, '${m.name}')">🗺️ Show Directions</button>
                </div>
              `);
            }
          });
        }
      } else {
        aiResponse.innerHTML = `<p style="color: var(--accent-red);">❌ ${data.error || 'AI request failed'}</p>`;
      }
    } catch (error) {
      console.error("❌ AI request failed:", error);
      aiResponse.innerHTML = `<p style="color: var(--accent-red);">❌ Connection error. Please try again.</p>`;
    }
  } else {
    // Use regular search
    console.log("🔍 Using search mode for query:", query);
    aiResponseBox.style.display = "none";
    await performSearch(query, marketsSection);
  }
}

// Function to display recommended markets as cards
function displayRecommendedMarkets(markets, marketsSection) {
  // Clear existing market cards and add header
  marketsSection.innerHTML = '<h4 class="fw-bold mb-3">🤖 AI Recommended Markets</h4>';

  markets.forEach(market => {
    const marketCard = document.createElement('div');
    marketCard.className = 'market-card shadow-sm p-3 mb-3 rounded';
    marketCard.innerHTML = `
      <h5 class="fw-bold">${market.name}</h5>
      <p class="text-muted">${market.distance || 'Distance unknown'} • ${market.travelTime || 'Travel time unknown'}</p>
      <p>🕔 ${market.hours || 'Hours not specified'} • 📞 ${market.phone || 'No phone listed'}</p>
      ${market.specialties ? `<p><strong>Specialties:</strong> ${market.specialties}</p>` : ''}
      ${market.rating ? `<p>⭐ ${market.rating}</p>` : ''}
      ${market.description ? `<p class="text-muted small">${market.description}</p>` : ''}
      ${market.lat && market.lng ? `<button class="btn-directions" onclick="showDirections(${market.lat}, ${market.lng}, '${market.name}')">🗺️ Show Directions</button>` : ''}
    `;
    marketsSection.appendChild(marketCard);
  });
}

// ====== Filter Functionality ======
function initializeFilters() {
  const filterButtons = document.querySelectorAll('.btn-filter');
  
  filterButtons.forEach(btn => {
    btn.onclick = async () => {
      // Remove active class from all
      filterButtons.forEach(b => b.classList.remove('active'));
      // Add to clicked
      btn.classList.add('active');
      
      const filter = btn.dataset.filter;
      console.log("🔍 Filter:", filter);
      
      // Implement filter logic
      if (filter === 'nearby') {
        if (window.userLocation) {
          await fetchNearbyVendors(window.userLocation.lat, window.userLocation.lng);
        }
      }
      // Add more filter logic as needed
    };
  });
}

async function performSearch(query, marketsSection) {
  console.log("🔍 Searching for:", query);
  
  try {
    // Clear existing markers except user location
    if (window.map) {
      window.map.eachLayer((layer) => {
        if (layer instanceof L.Marker && !layer.getPopup()?.getContent().includes("You are here")) {
          window.map.removeLayer(layer);
        }
      });
    }

    // Build search URL with user location if available
    let searchUrl = `/api/vendors/search?query=${encodeURIComponent(query)}`;
    if (window.userLocation) {
      searchUrl += `&lat=${window.userLocation.lat}&lng=${window.userLocation.lng}`;
    }

    const response = await fetch(searchUrl);
    const vendors = await response.json();

    console.log(`✅ Found ${vendors.length} results for "${query}"`);

    if (vendors.length === 0) {
      marketsSection.innerHTML = `
        <div class="text-center p-4">
          <h5>😔 No results found for "${query}"</h5>
          <p class="text-muted">Try searching for vendor names, categories, or locations</p>
        </div>
      `;
      return;
    }

    // Display results as cards
    marketsSection.innerHTML = `<h4 class="fw-bold mb-3">🔍 Search Results for "${query}"</h4>`;
    
    vendors.forEach(v => {
      // Add marker to map
      if (v.location?.coordinates && window.map) {
        const [lng, lat] = v.location.coordinates;
        const marker = L.marker([lat, lng]).addTo(window.map);
        
        const popupHTML = `
          <div style="font-family: 'Poppins', sans-serif; min-width:200px;">
            <strong>${v.name}</strong><br>
            📍 ${v.address || "No address available"}<br>
            📦 ${v.category || "General market"}<br>
            ⏰ ${v.hours || "No schedule"}<br>
            ⭐ ${v.rating || "No rating"}<br><br>
            <button class="btn-directions" onclick="showDirections(${lat}, ${lng}, '${v.name}')">🗺️ Show Directions</button>
          </div>
        `;
        marker.bindPopup(popupHTML);
        
        // Focus map on first result
        if (vendors.indexOf(v) === 0) {
          window.map.setView([lat, lng], 15);
          marker.openPopup();
        }
      }

      // Calculate distance if user location available
      let distanceText = "Distance unknown";
      if (window.userLocation && v.location?.coordinates) {
        const distance = calculateDistanceClient(
          window.userLocation.lat, 
          window.userLocation.lng,
          v.location.coordinates[1],
          v.location.coordinates[0]
        );
        distanceText = `${distance.toFixed(1)} km away`;
      } else if (v.distance) {
        distanceText = `${(v.distance / 1000).toFixed(1)} km away`;
      }

      // Create card
      const card = document.createElement('div');
      card.className = 'market-card shadow-sm p-3 mb-3 rounded';
      card.innerHTML = `
        <h5 class="fw-bold">${v.name}</h5>
        <p class="text-muted">${distanceText}</p>
        <p>📦 ${v.category || "General market"}</p>
        <p>🕔 ${v.hours || "Hours not specified"} • 📞 ${v.phone || "No phone listed"}</p>
        ${v.rating ? `<p>⭐ ${v.rating}</p>` : ''}
        <p class="text-muted small">📍 ${v.address || "Address not available"}</p>
        ${v.location?.coordinates ? `<button class="btn-directions" onclick="showDirections(${v.location.coordinates[1]}, ${v.location.coordinates[0]}, '${v.name}')">🗺️ Show Directions</button>` : ''}
      `;
      marketsSection.appendChild(card);
    });

  } catch (error) {
    console.error("❌ Search failed:", error);
    marketsSection.innerHTML = `
      <div class="text-center p-4">
        <h5>❌ Search failed</h5>
        <p class="text-muted">Please try again</p>
      </div>
    `;
  }
}
