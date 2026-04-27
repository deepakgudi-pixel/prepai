const express = require("express");
const {
  listPantryItems,
  createPantryItem,
  createPantryItemsBulk,
  updatePantryItem,
  deletePantryItem,
  clearPantryItems,
} = require("../services/pantry.service");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const items = await listPantryItems(req.appUser.id);
    return res.json({ success: true, items });
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, quantity } = req.body;

    if (!name || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Name and quantity are required",
      });
    }

    const item = await createPantryItem(req.appUser.id, name.trim(), quantity.trim());
    return res.json({ success: true, item, message: "Item added successfully!" });
  } catch (error) {
    return next(error);
  }
});

router.post("/bulk", async (req, res, next) => {
  try {
    const ingredients = Array.isArray(req.body.ingredients) ? req.body.ingredients : [];

    if (!ingredients.length) {
      return res.status(400).json({ success: false, message: "No ingredients to save" });
    }

    const savedItems = await createPantryItemsBulk(req.appUser.id, ingredients);
    return res.json({
      success: true,
      savedItems,
      message: `Saved ${savedItems.length} items to your pantry!`,
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/:itemId", async (req, res, next) => {
  try {
    const item = await updatePantryItem(
      req.appUser.id,
      Number(req.params.itemId),
      req.body.name,
      req.body.quantity,
    );

    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    return res.json({ success: true, item, message: "Item updated successfully" });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:itemId", async (req, res, next) => {
  try {
    const deleted = await deletePantryItem(req.appUser.id, Number(req.params.itemId));

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    return res.json({ success: true, message: "Item removed from pantry" });
  } catch (error) {
    return next(error);
  }
});

router.delete("/", async (req, res, next) => {
  try {
    await clearPantryItems(req.appUser.id);
    return res.json({ success: true, message: "Pantry cleared successfully" });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
