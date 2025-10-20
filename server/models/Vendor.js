// server/models/Vendor.js
import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: String,
  phone: String,
  rating: Number,
  address: String,
  hours: String,
  inventory: {
    type: Map,
    of: new mongoose.Schema({
      price: Number,
      qty_est: Number
    }, { _id: false })
  },
  location: {
    type: { type: String, enum: ["Point"], required: true },
    coordinates: { type: [Number], required: true } // [lng, lat]
  },
  createdAt: { type: Date, default: Date.now }
});

vendorSchema.index({ location: "2dsphere" });

export default mongoose.models.Vendor || mongoose.model("Vendor", vendorSchema);
