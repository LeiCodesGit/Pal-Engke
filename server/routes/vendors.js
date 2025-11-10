// server/routes/vendors.js
import express from "express";
import Vendor from "../models/Vendor.js";

const router = express.Router();

// Real Davao City public markets (same as in airoutes.js)
const realPublicMarkets = [
  { name: "Bankerohan Public Market", lat: 7.0688, lng: 125.6009, address: "Bankerohan, Davao City", category: "Public Market", hours: "5:00 AM - 8:00 PM", phone: "(082) 221-1234", rating: "4.5", specialties: ["Fresh produce", "Seafood", "Meat", "General goods"] },
  { name: "Agdao Public Market", lat: 7.0821, lng: 125.6232, address: "Agdao, Davao City", category: "Public Market", hours: "6:00 AM - 7:00 PM", phone: "(082) 234-5678", rating: "4.3", specialties: ["Vegetables", "Fruits", "Poultry", "Dry goods"] },
  { name: "Toril Public Market", lat: 7.0183, lng: 125.4959, address: "Toril, Davao City", category: "Public Market", hours: "5:30 AM - 7:30 PM", phone: "(082) 291-2345", rating: "4.2", specialties: ["Fresh fish", "Vegetables", "Local products"] },
  { name: "Matina Crossing Public Market", lat: 7.0584, lng: 125.5698, address: "Matina, Davao City", category: "Public Market", hours: "6:00 AM - 9:00 PM", phone: "(082) 297-3456", rating: "4.4", specialties: ["Groceries", "Fresh produce", "Cooked food"] },
  { name: "Puan Night Market", lat: 7.0512, lng: 125.5397, address: "Puan, Davao City", category: "Night Market", hours: "5:00 AM - 7:00 PM", phone: "(082) 296-4567", rating: "4.1", specialties: ["Vegetables", "Fruits", "Meat products"] },
  { name: "Panacan Public Market", lat: 7.1526, lng: 125.6591, address: "Panacan, Davao City", category: "Public Market", hours: "6:00 AM - 8:00 PM", phone: "(082) 233-5678", rating: "4.0", specialties: ["Fresh produce", "Seafood", "General goods"] },
  { name: "Buhangin Public Market", lat: 7.1102, lng: 125.6114, address: "Buhangin, Davao City", category: "Public Market", hours: "5:30 AM - 7:30 PM", phone: "(082) 241-6789", rating: "4.2", specialties: ["Vegetables", "Fish", "Poultry"] },
  { name: "Sasa Public Market", lat: 7.1348, lng: 125.6617, address: "Sasa, Davao City", category: "Public Market", hours: "6:00 AM - 7:00 PM", phone: "(082) 285-7890", rating: "4.0", specialties: ["Fresh produce", "Meat", "Dry goods"] },
  { name: "Roxas Night Market", lat: 7.0720, lng: 125.6123, address: "Roxas Avenue, Davao City", category: "Night Market", hours: "6:00 PM - 2:00 AM", phone: "(082) 222-8901", rating: "4.6", specialties: ["Street food", "Grilled items", "Local delicacies", "Durian"] }
];

// Helper function to calculate distance
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// GET /api/vendors/search?query=...&lat=...&lng=...
router.get("/search", async (req, res) => {
  try {
    const { query, lat, lng } = req.query;

    if (!query || query.trim() === "") {
      return res.status(400).json({ error: "Search query is required" });
    }

    console.log("🔍 Search query:", query);

    // Search in real markets
    const searchLower = query.toLowerCase();
    let results = realPublicMarkets.filter(market => 
      market.name.toLowerCase().includes(searchLower) ||
      market.address.toLowerCase().includes(searchLower) ||
      market.category.toLowerCase().includes(searchLower) ||
      market.specialties.some(s => s.toLowerCase().includes(searchLower))
    );

    // If location provided, add distance and sort
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      
      results = results.map(market => ({
        ...market,
        distance: calculateDistance(userLat, userLng, market.lat, market.lng),
        location: {
          coordinates: [market.lng, market.lat]
        }
      }));
      
      results.sort((a, b) => a.distance - b.distance);
    } else {
      // No location - just add location field for map compatibility
      results = results.map(market => ({
        ...market,
        location: {
          coordinates: [market.lng, market.lat]
        }
      }));
    }

    console.log(`✅ Found ${results.length} markets matching "${query}"`);
    res.json(results);
  } catch (err) {
    console.error("❌ Search error:", err);
    res.status(500).json({ error: "Search failed", message: err.message });
  }
});

// GET /api/vendors?lat=...&lng=...&radius=meters
router.get("/", async (req, res) => {
  try {
    const { lat, lng, radius = 3000 } = req.query;

    if (!lat || !lng) {
      // Return all real markets
      const marketsWithLocation = realPublicMarkets.map(market => ({
        ...market,
        location: {
          coordinates: [market.lng, market.lat]
        }
      }));
      return res.json(marketsWithLocation);
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const maxDistance = parseInt(radius);

    // Filter markets within radius and add distance
    let nearbyMarkets = realPublicMarkets
      .map(market => ({
        ...market,
        distance: calculateDistance(userLat, userLng, market.lat, market.lng),
        location: {
          coordinates: [market.lng, market.lat]
        }
      }))
      .filter(market => market.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);

    res.json(nearbyMarkets);
  } catch (err) {
    console.error("vendors route error:", err);
    res.status(500).json({ error: "Failed to fetch vendors" });
  }
});

// GET /api/vendors/:id
router.get("/:id", async (req, res) => {
  try {
    // For real markets, we'll try to find by name match
    const market = realPublicMarkets.find(m => 
      m.name.toLowerCase().replace(/\s+/g, '-') === req.params.id.toLowerCase()
    );
    
    if (!market) {
      return res.status(404).json({ error: "Market not found" });
    }
    
    res.json({
      ...market,
      location: {
        coordinates: [market.lng, market.lat]
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch market" });
  }
});

export default router;
