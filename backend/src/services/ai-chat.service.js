const { query } = require("../db");
const { createOpenRouterChatCompletion } = require("../lib/openrouter");

/**
 * Get user context for AI chat
 * Fetches user's fitness profile, recent nutrition, body tracking, etc.
 */
async function getUserContext(userId) {
  try {
    // Get user fitness profile
    const userResult = await query(
      `SELECT 
        age, gender, height_cm, weight_kg, activity_level, fitness_goal,
        target_calories, target_protein, target_carbs, target_fat,
        created_at
      FROM users WHERE id = $1`,
      [userId]
    );

    const user = userResult.rows[0] || {};

    // Get recent nutrition logs (last 7 days)
    const nutritionResult = await query(
      `SELECT 
        date, total_calories, total_protein, total_carbs, total_fat,
        is_workout_day
      FROM daily_nutrition_logs
      WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY date DESC`,
      [userId]
    );

    // Get latest body measurement
    const bodyResult = await query(
      `SELECT 
        weight_kg, body_fat_percentage, muscle_mass_kg,
        measured_at
      FROM body_measurements
      WHERE user_id = $1
      ORDER BY measured_at DESC
      LIMIT 1`,
      [userId]
    );

    // Get active meal plan
    const mealPlanResult = await query(
      `SELECT 
        name, start_date, end_date, meals_per_day
      FROM meal_plans
      WHERE user_id = $1 AND is_active = true
      LIMIT 1`,
      [userId]
    );

    // Calculate nutrition streak
    const streakResult = await query(
      `SELECT calculate_nutrition_streak($1) as streak`,
      [userId]
    );

    return {
      profile: user,
      recentNutrition: nutritionResult.rows,
      latestBodyMeasurement: bodyResult.rows[0] || null,
      activeMealPlan: mealPlanResult.rows[0] || null,
      currentStreak: streakResult.rows[0]?.streak || 0,
    };
  } catch (error) {
    console.error("Error fetching user context:", error);
    return null;
  }
}

/**
 * Build system prompt with user context
 */
function buildSystemPrompt(context) {
  if (!context) {
    return "You are PrepAI, a helpful fitness and nutrition AI assistant.";
  }

  const { profile, recentNutrition, latestBodyMeasurement, activeMealPlan, currentStreak } = context;

  let prompt = `You are PrepAI, an expert fitness and nutrition AI coach. You help users achieve their fitness goals through personalized advice.

USER PROFILE:
- Age: ${profile.age || "N/A"}, Gender: ${profile.gender || "N/A"}
- Height: ${profile.height_cm || "N/A"} cm, Weight: ${profile.weight_kg || "N/A"} kg
- Activity Level: ${profile.activity_level || "N/A"}
- Fitness Goal: ${profile.fitness_goal || "N/A"}
- Daily Targets: ${profile.target_calories || "N/A"} cal, ${profile.target_protein || "N/A"}g protein, ${profile.target_carbs || "N/A"}g carbs, ${profile.target_fat || "N/A"}g fat

CURRENT PROGRESS:
- Nutrition Streak: ${currentStreak} days
`;

  if (latestBodyMeasurement) {
    prompt += `- Latest Weight: ${latestBodyMeasurement.weight_kg} kg
- Body Fat: ${latestBodyMeasurement.body_fat_percentage || "N/A"}%
- Muscle Mass: ${latestBodyMeasurement.muscle_mass_kg || "N/A"} kg
`;
  }

  if (recentNutrition.length > 0) {
    prompt += `\nRECENT NUTRITION (Last 7 days):
`;
    recentNutrition.forEach((day) => {
      prompt += `- ${day.date}: ${day.total_calories || 0} cal, ${day.total_protein || 0}g protein${day.is_workout_day ? " (Workout Day)" : ""}
`;
    });
  }

  if (activeMealPlan) {
    prompt += `\nACTIVE MEAL PLAN: ${activeMealPlan.name} (${activeMealPlan.meals_per_day} meals/day)
`;
  }

  prompt += `\nYour role:
- Provide personalized fitness and nutrition advice based on user's data
- Analyze their progress and identify patterns or issues
- Explain WHY things are happening (plateaus, gains, losses)
- Suggest what they should adjust or change
- DIRECT users to the appropriate app pages to take action (e.g., "Go to Fitness Profile to adjust your macros")
- Motivate and encourage users on their journey
- Answer questions about fitness, nutrition, supplements, and training
- Be friendly, supportive, and concise
- Use emojis occasionally to be engaging

IMPORTANT: You are a COACH, not a feature replacement. Don't try to log meals, create plans, or track data for users. Instead, guide them to use the app's features.

Keep responses concise (2-3 sentences) unless user asks for detailed explanation.`;

  return prompt;
}

/**
 * Send message to AI chat
 */
async function sendChatMessage(userId, message, conversationHistory = []) {
  try {
    // Get user context
    const context = await getUserContext(userId);

    // Build system prompt
    const systemPrompt = buildSystemPrompt(context);

    // Build messages array
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: message },
    ];

    // Get AI response
    const response = await createOpenRouterChatCompletion({
      messages,
      model: "google/gemini-2.0-flash-exp:free",
      temperature: 0.7,
      max_tokens: 500,
    });

    return {
      success: true,
      message: response,
      context,
    };
  } catch (error) {
    console.error("AI chat error:", error);
    return {
      success: false,
      message: "Sorry, I'm having trouble responding right now. Please try again.",
      error: error.message,
    };
  }
}

/**
 * Save chat message to database
 */
async function saveChatMessage(userId, role, content) {
  try {
    const result = await query(
      `INSERT INTO ai_chat_messages (user_id, role, content)
       VALUES ($1, $2, $3)
       RETURNING id, created_at`,
      [userId, role, content]
    );

    return result.rows[0];
  } catch (error) {
    console.error("Error saving chat message:", error);
    return null;
  }
}

/**
 * Get chat history
 */
async function getChatHistory(userId, limit = 50) {
  try {
    const result = await query(
      `SELECT id, role, content, created_at
       FROM ai_chat_messages
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows.reverse(); // Return in chronological order
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return [];
  }
}

/**
 * Clear chat history
 */
async function clearChatHistory(userId) {
  try {
    await query(
      `DELETE FROM ai_chat_messages WHERE user_id = $1`,
      [userId]
    );
    return true;
  } catch (error) {
    console.error("Error clearing chat history:", error);
    return false;
  }
}

module.exports = {
  getUserContext,
  sendChatMessage,
  saveChatMessage,
  getChatHistory,
  clearChatHistory,
};
