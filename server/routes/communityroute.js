// routes/communityroute.js
import express from "express";
import multer from "multer";
import Recipe from "../models/Recipe.js";
import User from "../models/User.js";
import redirectIfNotLoggedIn from "../middlewares/redirectIfNotLoggedIn.js";

const communityRouter = express.Router();

// ✅ Multer setup: store uploads in memory instead of public/uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});


// ✅ Feed page
communityRouter.get("/", redirectIfNotLoggedIn, async (req, res) => {
  try {
    const recipes = await Recipe.find()
      .populate("user", "firstName lastName profile_picture")
      .sort({ createdAt: -1 });

    res.render("community", { user: req.session.user, recipes });
  } catch (err) {
    console.error("GET /community error:", err);
    res.status(500).send("Error loading community page");
  }
});

// ✅ Create new recipe (Base64)
communityRouter.post("/add", redirectIfNotLoggedIn, upload.single("image"), async (req, res) => {
  try {
    const { description, text } = req.body;
    const content = (description || text || "").trim();
    if (!content) return res.status(400).json({ message: "Text is required" });

    let imageBase64 = null;
    if (req.file) {
      const mimeType = req.file.mimetype;
      const base64Data = req.file.buffer.toString("base64");
      imageBase64 = `data:${mimeType};base64,${base64Data}`;
    }

    const userId = req.session.user.id || req.session.user._id;
    const newRecipe = await Recipe.create({
      user: userId,
      text: content,
      image: imageBase64,
    });

    const populatedRecipe = await newRecipe.populate(
      "user",
      "firstName lastName profile_picture"
    );
    res.status(201).json(populatedRecipe);
  } catch (err) {
    console.error("POST /community/add error:", err);
    res.status(500).json({ message: "Failed to share recipe" });
  }
});

// ✅ Edit recipe (Base64)
communityRouter.put("/edit/:id", redirectIfNotLoggedIn, upload.single("image"), async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: "Not found" });

    const userId = String(req.session.user.id || req.session.user._id);
    if (String(recipe.user) !== userId)
      return res.status(403).json({ message: "Unauthorized" });

    const { description, text, removeImage } = req.body;
    const content = (description || text || "").trim();
    if (content) recipe.text = content;

    if (req.file) {
      const mimeType = req.file.mimetype;
      const base64Data = req.file.buffer.toString("base64");
      recipe.image = `data:${mimeType};base64,${base64Data}`;
    } else if (removeImage === "true") {
      recipe.image = null;
    }

    await recipe.save();
    const updated = await Recipe.findById(recipe._id).populate(
      "user",
      "firstName lastName profile_picture"
    );
    res.json(updated);
  } catch (err) {
    console.error("PUT /community/edit/:id error:", err);
    res.status(500).json({ message: "Update failed" });
  }
});

// ✅ Delete recipe (no local files anymore)
communityRouter.delete("/delete/:id", redirectIfNotLoggedIn, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: "Not found" });

    const userId = String(req.session.user.id || req.session.user._id);
    if (String(recipe.user) !== userId)
      return res.status(403).json({ message: "Unauthorized" });

    await recipe.deleteOne();
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("DELETE /community/delete/:id error:", err);
    res.status(500).json({ message: "Delete failed" });
  }
});

// ✅ Like/unlike
communityRouter.post("/like/:id", redirectIfNotLoggedIn, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: "Not found" });

    const userId = req.session.user.id || req.session.user._id;
    const already = recipe.likes.some((l) => String(l) === String(userId));
    if (already) recipe.likes.pull(userId);
    else recipe.likes.push(userId);

    await recipe.save();
    res.json({ likes: recipe.likes.length, liked: !already });
  } catch (err) {
    console.error("POST /community/like/:id error:", err);
    res.status(500).json({ message: "Like failed" });
  }
});

export default communityRouter;
