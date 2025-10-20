// server/routes/vendors.js
import express from "express";
import Vendor from "../models/Vendor.js";

const router = express.Router();

// GET /api/vendors?lat=...&lng=...&radius=meters
router.get("/", async (req, res) => {
  try {
    const { lat, lng, radius = 3000 } = req.query;

    if (!lat || !lng) {
      // return sample vendors if no coords provided
      const all = await Vendor.find({}).limit(40).lean();
      return res.json(all);
    }

    const vendors = await Vendor.find({
      location: {
        $nearSphere: {
          $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius),
        },
      },
    })
      .limit(200)
      .lean();

    res.json(vendors);
  } catch (err) {
    console.error("vendors route error:", err);
    res.status(500).json({ error: "Failed to fetch vendors" });
  }
});

// GET /api/vendors/:id
router.get("/:id", async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id).lean();
    if (!vendor) return res.status(404).json({ error: "Not found" });
    res.json(vendor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch vendor" });
  }
});

export default router;
