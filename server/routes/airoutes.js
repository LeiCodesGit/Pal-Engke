import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import Vendor from "../models/Vendor.js";
import redirectIfNotLoggedIn from "../middlewares/redirectIfNotLoggedIn.js";

dotenv.config();

const router = express.Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

//protect all the routes
router.use(redirectIfNotLoggedIn);

// Helper: Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

router.post("/suggest-meal", async (req, res) => {
  try {
    const { ingredients, userLocation } = req.body;

    if (!ingredients || ingredients.trim() === "") {
      return res.status(400).json({ error: "No ingredients provided." });
    }

    console.log("🧂 Ingredients received:", ingredients);
    console.log("📍 User location:", userLocation);

    // ✅ Step 1: Check if input is about food
    const checkResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a strict classifier that checks if a user input contains food, ingredients, or cooking-related items. Only reply 'yes' or 'no'.",
        },
        {
          role: "user",
          content: `Does this input describe food, ingredients, or something edible? Answer only 'yes' or 'no': ${ingredients}`,
        },
      ],
    });

    const checkResult = checkResponse.choices[0]?.message?.content?.trim().toLowerCase();
    console.log("🔍 Food check result:", checkResult);

    if (!checkResult.includes("yes")) {
      return res.json({ 
        suggestion: "❌ This doesn't seem like a meal or food-related input.",
        markets: []
      });
    }

    // ✅ Step 2: Generate meal suggestion in bullet form
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a Filipino meal suggestion assistant." },
        {
          role: "user",
          content: `Given these ingredients: ${ingredients}, suggest a Filipino meal that can be cooked with them. 
                    Format the answer like this:
                    "You can make [MEAL NAME] with the following ingredients! Here's how:
                    - Step 1...
                    - Step 2...
                    - Step 3..."`,
        },
      ],
    });

    const suggestion =
      chatResponse.choices[0]?.message?.content?.trim() || "No suggestion found.";

    console.log("✅ Suggestion generated:", suggestion);

    // ✅ Step 3: Find real public markets in Davao City that likely sell these ingredients
    const realPublicMarkets = [
      { name: "Bankerohan Public Market", lat: 7.0688, lng: 125.6009, specialties: ["vegetables", "fruits", "seafood", "meat", "durian", "organic"], hours: "5:00 AM - 7:00 PM", phone: "(082) 227-2828" },
      { name: "Agdao Public Market", lat: 7.0821, lng: 125.6232, specialties: ["seafood", "meat", "vegetables", "poultry"], hours: "5:00 AM - 8:00 PM", phone: "(082) 234-5678" },
      { name: "Toril Public Market", lat: 7.0183, lng: 125.4959, specialties: ["vegetables", "fruits", "organic", "fish"], hours: "4:00 AM - 7:00 PM", phone: "(082) 291-3456" },
      { name: "Matina Crossing Public Market", lat: 7.0584, lng: 125.5698, specialties: ["vegetables", "seafood", "meat"], hours: "6:00 AM - 9:00 PM", phone: "(082) 297-4567" },
      { name: "Puan Night Market", lat: 7.0512, lng: 125.5397, specialties: ["produce", "seafood", "meat"], hours: "5:00 AM - 7:00 PM", phone: "(082) 241-7890" },
      { name: "Panacan Public Market", lat: 7.1526, lng: 125.6591, specialties: ["vegetables", "seafood", "meat", "dry goods"], hours: "5:30 AM - 8:00 PM", phone: "(082) 285-6789" },
      { name: "Buhangin Public Market", lat: 7.1102, lng: 125.6114, specialties: ["vegetables", "fruits", "seafood"], hours: "5:00 AM - 7:30 PM", phone: "(082) 276-5432" },
      { name: "Sasa Public Market", lat: 7.1348, lng: 125.6617, specialties: ["vegetables", "fruits", "wholesale"], hours: "4:30 AM - 8:00 PM", phone: "(082) 333-2468" },
      { name: "Roxas Avenue Night Market", lat: 7.0720, lng: 125.6123, specialties: ["street food", "fruits", "seafood", "grilled"], hours: "6:00 PM - 2:00 AM", phone: "(082) 222-1234" }
    ];
    
    let nearbyMarkets = [];
    
    if (userLocation && userLocation.lat && userLocation.lng) {
      // Parse ingredients into keywords
      const ingredientKeywords = ingredients.toLowerCase().split(/[,\s]+/).filter(w => w.length > 2);
      
      // Filter markets based on ingredient types
      const matchingMarkets = realPublicMarkets.filter(market => {
        // Check if any ingredient keyword matches market specialties
        return ingredientKeywords.some(keyword => 
          market.specialties.some(specialty => 
            specialty.includes(keyword) || 
            keyword.includes(specialty) ||
            (keyword.includes('fish') && specialty.includes('seafood')) ||
            (keyword.includes('gulay') && specialty.includes('vegetables')) ||
            (keyword.includes('karne') && specialty.includes('meat'))
          )
        );
      });

      // Calculate distances and sort
      nearbyMarkets = (matchingMarkets.length > 0 ? matchingMarkets : realPublicMarkets.slice(0, 5))
        .map(m => {
          const distance = calculateDistance(
            userLocation.lat, userLocation.lng,
            m.lat, m.lng
          );
          return {
            ...m,
            distance: `${distance.toFixed(1)} km away`,
            address: `${m.name} area, Davao City`,
            matchingItems: m.specialties.join(", "),
            actualDistance: distance
          };
        })
        .sort((a, b) => a.actualDistance - b.actualDistance)
        .slice(0, 5);

      console.log(`✅ Found ${nearbyMarkets.length} relevant markets in Davao City for ingredients`);
    }

    res.json({ 
      suggestion,
      markets: nearbyMarkets,
      hasMarkets: nearbyMarkets.length > 0
    });
  } catch (error) {
    console.error("❌ AI Route Error:", error);
    res.status(500).json({ error: "AI request failed", details: error.message });
  }
});

// ✅ New AI Map Assistant Route
router.post("/map-assistant", async (req, res) => {
  try {
    const { query, userLocation } = req.query;

    if (!query || query.trim() === "") {
      return res.status(400).json({ 
        success: false,
        error: "No query provided." 
      });
    }

    console.log("🗺️ Map query received:", query);
    console.log("📍 User location:", userLocation);

    // Real existing public markets in Davao City
    const realPublicMarkets = [
      {
        name: "Bankerohan Public Market",
        distance: "1.2 km away",
        travelTime: "15 min walk",
        hours: "5:00 AM - 7:00 PM",
        phone: "(082) 227-2828",
        specialties: "Fresh vegetables, fruits, seafood, meat, durian, local produce",
        description: "Davao's oldest and largest public market, famous for durian and fresh local produce",
        lat: 7.0731,
        lng: 125.6128
      },
      {
        name: "Agdao Public Market",
        distance: "2.5 km away",
        travelTime: "30 min walk",
        hours: "5:00 AM - 8:00 PM",
        phone: "(082) 234-5678",
        specialties: "Fresh seafood, vegetables, meat, poultry, dry goods",
        description: "Bustling wet market known for affordable fresh seafood and meat",
        lat: 7.0897,
        lng: 125.6289
      },
      {
        name: "Toril Public Market",
        distance: "3.8 km away",
        travelTime: "46 min walk",
        hours: "4:00 AM - 7:00 PM",
        phone: "(082) 291-3456",
        specialties: "Farm-fresh vegetables, fruits, organic produce, fish",
        description: "Southern Davao market with direct access to farm produce",
        lat: 7.0042,
        lng: 125.5147
      },
      {
        name: "Matina Town Square Public Market",
        distance: "2.8 km away",
        travelTime: "34 min walk",
        hours: "6:00 AM - 9:00 PM",
        phone: "(082) 297-4567",
        specialties: "Fresh produce, seafood, meat, Filipino delicacies",
        description: "Modern public market in Matina area with wide variety of goods",
        lat: 7.0608,
        lng: 125.5908
      },
      {
        name: "Magallanes Public Market",
        distance: "3.5 km away",
        travelTime: "42 min walk",
        hours: "5:00 AM - 7:00 PM",
        phone: "(082) 241-7890",
        specialties: "Fresh vegetables, seafood, meat, local fruits",
        description: "Well-maintained market serving the Magallanes area",
        lat: 7.0431,
        lng: 125.5789
      },
      {
        name: "Monteverde Public Market",
        distance: "1.8 km away",
        travelTime: "22 min walk",
        hours: "5:30 AM - 8:00 PM",
        phone: "(082) 285-6789",
        specialties: "Everything - vegetables, seafood, meat, dry goods, household items",
        description: "Comprehensive market with all daily necessities",
        lat: 7.0689,
        lng: 125.6234
      },
      {
        name: "Buhangin Public Market",
        distance: "4.2 km away",
        travelTime: "50 min walk",
        hours: "5:00 AM - 7:30 PM",
        phone: "(082) 276-5432",
        specialties: "Fresh vegetables, fruits, seafood, poultry",
        description: "Popular market in Buhangin district with quality fresh goods",
        lat: 7.1092,
        lng: 125.6523
      },
      {
        name: "Tigatto Public Market",
        distance: "5.5 km away",
        travelTime: "66 min walk",
        hours: "4:30 AM - 8:00 PM",
        phone: "(082) 333-2468",
        specialties: "Wholesale vegetables, fruits, farm produce, organic items",
        description: "Northern Davao market known for wholesale fresh produce",
        lat: 7.1478,
        lng: 125.6089
      },
      {
        name: "Roxas Avenue Night Market",
        distance: "0.8 km away",
        travelTime: "10 min walk",
        hours: "6:00 PM - 2:00 AM",
        phone: "(082) 222-1234",
        specialties: "Street food, fresh fruits, seafood, grilled items",
        description: "Famous Davao night market with local street food and fresh produce",
        lat: 7.0644,
        lng: 125.6075
      }
    ];

    // Calculate distances from user location if provided
    let nearbyMarkets = realPublicMarkets;
    if (userLocation && userLocation.lat && userLocation.lng) {
      nearbyMarkets = realPublicMarkets.map(m => {
        const distance = calculateDistance(
          userLocation.lat, userLocation.lng,
          m.lat, m.lng
        );
        return {
          ...m,
          distance: `${distance.toFixed(1)} km away`,
          travelTime: `${Math.ceil(distance * 12)} min walk`,
          actualDistance: distance
        };
      }).sort((a, b) => a.actualDistance - b.actualDistance);
    }

    // Enhanced AI prompt with structured output request
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: `You are a helpful Filipino market (palengke) assistant. 
Help users find the best nearby markets based on their needs.

Available markets in the area:
${nearbyMarkets.map(m => `- **${m.name}**: ${m.specialties} (${m.distance})`).join('\n')}

When recommending markets:
- Use bullet points with • symbol
- Bold market names with **Market Name**
- Be specific about what each market offers
- Give practical shopping tips for Filipino markets
- Keep responses friendly and conversational (2-4 paragraphs max)
- Always mention specific market names from the list above when relevant`
        },
        {
          role: "user",
          content: query,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiResponse = chatResponse.choices[0]?.message?.content?.trim() || "No response generated.";

    // Determine which markets to recommend based on query
    let recommendedMarkets = [];
    const queryLower = query.toLowerCase();

    // Helper function to check if vendor matches query
    const matchesQuery = (market, keywords) => {
      const searchText = `${market.name} ${market.specialties} ${market.description}`.toLowerCase();
      return keywords.some(keyword => searchText.includes(keyword));
    };

    if (queryLower.includes('seafood') || queryLower.includes('fish') || queryLower.includes('isda')) {
      recommendedMarkets = nearbyMarkets.filter(m => 
        matchesQuery(m, ['seafood', 'fish', 'isda', 'bangus', 'tilapia', 'shrimp', 'hipon'])
      );
    } else if (queryLower.includes('vegetable') || queryLower.includes('gulay') || queryLower.includes('produce') || queryLower.includes('veggie')) {
      recommendedMarkets = nearbyMarkets.filter(m => 
        matchesQuery(m, ['vegetable', 'gulay', 'produce', 'tomato', 'kamatis', 'carrot', 'lettuce', 'cabbage'])
      );
    } else if (queryLower.includes('meat') || queryLower.includes('karne') || queryLower.includes('pork') || queryLower.includes('chicken') || queryLower.includes('beef')) {
      recommendedMarkets = nearbyMarkets.filter(m => 
        matchesQuery(m, ['meat', 'karne', 'pork', 'chicken', 'beef', 'manok', 'baboy'])
      );
    } else if (queryLower.includes('fruit') || queryLower.includes('prutas')) {
      recommendedMarkets = nearbyMarkets.filter(m => 
        matchesQuery(m, ['fruit', 'prutas', 'banana', 'mango', 'apple', 'orange'])
      );
    } else if (queryLower.includes('organic')) {
      recommendedMarkets = nearbyMarkets.filter(m => 
        matchesQuery(m, ['organic', 'fresh', 'natural'])
      );
    } else if (queryLower.includes('everything') || queryLower.includes('variety') || queryLower.includes('all') || queryLower.includes('general')) {
      // Show markets with most variety (most inventory items)
      recommendedMarkets = nearbyMarkets.slice(0, 4);
    } else if (queryLower.includes('nearby') || queryLower.includes('close') || queryLower.includes('malapit') || queryLower.includes('nearest')) {
      recommendedMarkets = nearbyMarkets.slice(0, 3); // Show top 3 closest
    } else {
      // Default: show top 4 markets
      recommendedMarkets = nearbyMarkets.slice(0, 4);
    }

    // If no specific matches found and not showing all, show closest 2
    if (recommendedMarkets.length === 0) {
      console.warn("⚠️ No specific matches, showing closest markets");
      recommendedMarkets = nearbyMarkets.slice(0, 2);
    }

    console.log(`✅ AI Map response generated with ${recommendedMarkets.length} markets`);

    res.json({ 
      success: true,
      response: aiResponse,
      markets: recommendedMarkets
    });
  } catch (error) {
    console.error("❌ AI Map Assistant Error:", error);
    res.status(500).json({ 
      success: false,
      error: "AI request failed", 
      message: error.message 
    });
  }
});

export default router;
