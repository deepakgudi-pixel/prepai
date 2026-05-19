const express = require("express");
const {
  sendChatMessage,
  saveChatMessage,
  getChatHistory,
  clearChatHistory,
} = require("../services/ai-chat.service");

const router = express.Router();

// Send message to AI
router.post("/message", async (req, res, next) => {
  try {
    const { message, conversationHistory } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    // Save user message
    await saveChatMessage(req.appUser.id, "user", message);

    // Get AI response
    const result = await sendChatMessage(
      req.appUser.id,
      message,
      conversationHistory || []
    );

    if (result.success) {
      // Save AI response
      await saveChatMessage(req.appUser.id, "assistant", result.message);
    }

    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

// Get chat history
router.get("/history", async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const history = await getChatHistory(req.appUser.id, limit);

    return res.json({
      success: true,
      history,
    });
  } catch (error) {
    return next(error);
  }
});

// Clear chat history
router.delete("/history", async (req, res, next) => {
  try {
    const cleared = await clearChatHistory(req.appUser.id);

    if (!cleared) {
      return res.status(500).json({
        success: false,
        message: "Failed to clear chat history",
      });
    }

    return res.json({
      success: true,
      message: "Chat history cleared",
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
