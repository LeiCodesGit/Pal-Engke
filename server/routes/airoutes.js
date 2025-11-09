import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import Vendor from "../models/Vendor.js";

dotenv.config();

const router = express.Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    const { ingredients } = req.body;

    if (!ingredients || ingredients.trim() === "") {
      return res.status(400).json({ error: "No ingredients provided." });
    }

    console.log("🧂 Ingredients received:", ingredients);

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
      return res.json({ suggestion: "❌ This doesn't seem like a meal or food-related input." });
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

    res.json({ suggestion });
  } catch (error) {
    console.error("❌ AI Route Error:", error);
    res.status(500).json({ error: "AI request failed", details: error.message });
  }
});

// ✅ New AI Map Assistant Route
router.post("/map-assistant", async (req, res) => {
  try {
    const { query, userLocation } = req.body;

    if (!query || query.trim() === "") {
      return res.status(400).json({ 
        success: false,
        error: "No query provided." 
      });
    }

    console.log("🗺️ Map query received:", query);
    console.log("📍 User location:", userLocation);

    // ✅ Fetch real nearby markets from database
    let nearbyMarkets = [];
    
    if (userLocation && userLocation.lat && userLocation.lng) {
      try {
        const vendors = await Vendor.find({
          location: {
            $nearSphere: {
              $geometry: {
                type: "Point",
                coordinates: [userLocation.lng, userLocation.lat],
              },
              $maxDistance: 5000, // 5km radius
            },
          },
        }).limit(10);

        console.log(`✅ Found ${vendors.length} nearby vendors from database`);

        // Transform vendors to market format (using correct field names from Vendor schema)
        nearbyMarkets = vendors.map(v => {
          const distance = v.location?.coordinates 
            ? calculateDistance(
                userLocation.lat, userLocation.lng, 
                v.location.coordinates[1], v.location.coordinates[0]
              )
            : null;
          
          // Extract inventory items for specialties
          let specialties = "General market";
          if (v.inventory && v.inventory.size > 0) {
            const items = Array.from(v.inventory.keys()).slice(0, 5).join(", ");
            specialties = items;
          } else if (v.category) {
            specialties = v.category;
          }
          
          return {
            name: v.name,
            distance: distance ? `${distance.toFixed(1)} km away` : "Distance unknown",
            travelTime: distance ? `${Math.ceil(distance * 12)} min walk` : "N/A",
            hours: v.hours || "Hours not specified",
            phone: v.phone || "No phone listed",
            specialties: specialties,
            description: `${v.category || 'Market'} located at ${v.address || 'the area'}`,
            rating: v.rating || "No rating yet",
            lat: v.location?.coordinates?.[1],
            lng: v.location?.coordinates?.[0],
            _id: v._id.toString()
          };
        });
        
        console.log("📋 Sample vendor data:", nearbyMarkets[0]);
      } catch (dbError) {
        console.error("❌ Database query failed:", dbError);
      }
    }

    // Fallback to sample data if no vendors found
    if (nearbyMarkets.length === 0) {
      console.warn("⚠️ No vendors found in database, using fallback data");
      nearbyMarkets = [
        {
          name: "Barangay Central Market",
          distance: "0.3 km away",
          travelTime: "4 min walk",
          hours: "5:00 AM - 6:00 PM",
          phone: "(02) 123-4567",
          specialties: "Fresh vegetables, seafood, meat",
          description: "Main community market with wide variety of fresh produce",
          lat: userLocation?.lat ? userLocation.lat + 0.003 : 14.6790,
          lng: userLocation?.lng ? userLocation.lng + 0.002 : 121.0467
        },
        {
          name: "Greenleaf Farmers Market",
          distance: "0.8 km away",
          travelTime: "10 min walk",
          hours: "6:00 AM - 7:00 PM",
          phone: "(02) 234-5678",
          specialties: "Organic produce, herbs, fruits",
          description: "Specializes in organic and locally-grown vegetables",
          lat: userLocation?.lat ? userLocation.lat - 0.005 : 14.6710,
          lng: userLocation?.lng ? userLocation.lng + 0.003 : 121.0470
        }
      ];
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
