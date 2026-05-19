const assert = require("node:assert/strict");
const test = require("node:test");
const express = require("express");

const TEST_USER = { id: "user_test_1" };
const TEST_HEADERS = {
  "x-internal-api-key": "prepai-internal-dev-key",
  "x-clerk-user-id": "clerk_test_1",
  "x-user-email": "test@example.com",
};

function clearModules(...paths) {
  for (const modulePath of paths) {
    delete require.cache[require.resolve(modulePath)];
  }
}

function mockModule(modulePath, exports) {
  require.cache[require.resolve(modulePath)] = {
    id: require.resolve(modulePath),
    filename: require.resolve(modulePath),
    loaded: true,
    exports,
  };
}

function routeApp(router) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.appUser = TEST_USER;
    next();
  });
  app.use(router);
  app.use((error, _req, res, _next) => {
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  });
  return app;
}

async function request(app, path, options = {}) {
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method: options.method || "GET",
      headers: {
        ...(options.body ? { "content-type": "application/json" } : {}),
        ...(options.headers || {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const text = await response.text();
    return {
      status: response.status,
      body: text ? JSON.parse(text) : null,
    };
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("health endpoint is public and protected routes require internal auth", async () => {
  clearModules(
    "../src/app",
    "../src/middleware/internal-auth",
    "../src/services/users.service"
  );

  mockModule("../src/services/users.service", {
    upsertUserFromHeaders: async () => TEST_USER,
  });

  const app = require("../src/app");

  const health = await request(app, "/api/health");
  assert.equal(health.status, 200);
  assert.deepEqual(health.body, { success: true, status: "ok" });

  const unauthorized = await request(app, "/api/fitness-profile");
  assert.equal(unauthorized.status, 401);
  assert.equal(unauthorized.body.success, false);
});

test("fitness macro calculation validates required fields before service work", async () => {
  clearModules(
    "../src/routes/fitness-profile.routes",
    "../src/services/fitness-profile.service"
  );

  let calculateCalled = false;
  mockModule("../src/services/fitness-profile.service", {
    getFitnessProfile: async () => null,
    updateFitnessProfile: async () => ({}),
    calculateMacrosForUser: async () => {
      calculateCalled = true;
      return { macros: { calories: 2200, protein: 160, carbs: 240, fats: 70 } };
    },
  });

  const app = routeApp(require("../src/routes/fitness-profile.routes"));

  const missing = await request(app, "/calculate-macros", {
    method: "POST",
    body: { age: 30 },
  });

  assert.equal(missing.status, 400);
  assert.equal(missing.body.success, false);
  assert.equal(calculateCalled, false);

  const valid = await request(app, "/calculate-macros", {
    method: "POST",
    body: {
      age: 30,
      gender: "male",
      heightCm: 178,
      weightKg: 78,
      activityLevel: "moderate",
      fitnessGoal: "maintain",
    },
  });

  assert.equal(valid.status, 200);
  assert.equal(valid.body.success, true);
  assert.deepEqual(valid.body.macros, {
    targetCalories: 2200,
    targetProtein: 160,
    targetCarbs: 240,
    targetFats: 70,
  });
  assert.equal(calculateCalled, true);
});

test("daily nutrition rejects incomplete meal macros and accepts complete macros", async () => {
  clearModules(
    "../src/routes/daily-nutrition.routes",
    "../src/services/daily-nutrition.service"
  );

  let updatePayload = null;
  mockModule("../src/services/daily-nutrition.service", {
    getTodayLog: async () => ({}),
    getDailyLog: async () => ({}),
    updateDailyLog: async (_userId, date, mealType, macros) => {
      updatePayload = { date, mealType, macros };
      return { id: "log_1", date, meals: { [mealType]: macros } };
    },
    setDailyLogTotals: async () => ({}),
    markAsWorkoutDay: async () => ({}),
    getWeeklyLogs: async () => [],
    calculateDailyProgress: async () => ({}),
    getMacroStreaks: async () => ({}),
    getWeeklySummary: async () => ({}),
  });

  const app = routeApp(require("../src/routes/daily-nutrition.routes"));

  const incomplete = await request(app, "/add-meal", {
    method: "POST",
    body: {
      date: "2026-05-19",
      mealType: "breakfast",
      macros: { calories: 400, protein: 30 },
    },
  });

  assert.equal(incomplete.status, 400);
  assert.equal(incomplete.body.success, false);
  assert.equal(updatePayload, null);

  const complete = await request(app, "/add-meal", {
    method: "POST",
    body: {
      date: "2026-05-19",
      mealType: "breakfast",
      macros: { calories: 400, protein: 30, carbs: 45, fats: 12 },
    },
  });

  assert.equal(complete.status, 200);
  assert.equal(complete.body.success, true);
  assert.deepEqual(updatePayload, {
    date: "2026-05-19",
    mealType: "breakfast",
    macros: { calories: 400, protein: 30, carbs: 45, fats: 12 },
  });
});

test("meal planning grocery list reads cached data and forwards forced refresh", async () => {
  clearModules(
    "../src/routes/meal-planning.routes",
    "../src/services/meal-planning.service"
  );

  const calls = [];
  mockModule("../src/services/meal-planning.service", {
    createMealPlan: async () => ({}),
    getMealPlans: async () => [],
    getMealPlanById: async () => ({}),
    getActiveMealPlan: async () => null,
    updateMealPlan: async () => ({}),
    deleteMealPlan: async () => true,
    getMealPlanDays: async () => [],
    getMealPlanDayByDate: async () => null,
    addMealToPlan: async () => ({}),
    removeMealFromPlan: async () => ({}),
    markDayAsWorkout: async () => ({}),
    generateWeeklyPlan: async () => ({}),
    optimizeMealPlan: async () => ({}),
    copyMealPlan: async () => ({}),
    getGroceryList: async (userId, mealPlanId) => {
      calls.push({ method: "getGroceryList", userId, mealPlanId });
      return {
        success: true,
        hasGroceryList: true,
        groceryList: [{ category: "Produce", items: [{ name: "Spinach", quantity: "1 bag" }] }],
      };
    },
    generateGroceryList: async (userId, mealPlanId, options) => {
      calls.push({ method: "generateGroceryList", userId, mealPlanId, options });
      return { success: true, hasGroceryList: true, cached: false, groceryList: [] };
    },
  });

  const app = routeApp(require("../src/routes/meal-planning.routes"));

  const cached = await request(app, "/plan_1/grocery-list");
  assert.equal(cached.status, 200);
  assert.equal(cached.body.hasGroceryList, true);
  assert.equal(cached.body.groceryList[0].items[0].name, "Spinach");

  const refreshed = await request(app, "/plan_1/grocery-list", {
    method: "POST",
    body: { force: true },
  });
  assert.equal(refreshed.status, 200);
  assert.equal(refreshed.body.cached, false);
  assert.deepEqual(calls, [
    { method: "getGroceryList", userId: TEST_USER.id, mealPlanId: "plan_1" },
    {
      method: "generateGroceryList",
      userId: TEST_USER.id,
      mealPlanId: "plan_1",
      options: { force: true },
    },
  ]);
});

test("AI chat validates input, persists user and assistant messages, and clears history", async () => {
  clearModules("../src/routes/ai-chat.routes", "../src/services/ai-chat.service");

  const savedMessages = [];
  mockModule("../src/services/ai-chat.service", {
    sendChatMessage: async (_userId, message, conversationHistory) => ({
      success: true,
      message: `Coach response to: ${message}`,
      conversationHistoryLength: conversationHistory.length,
    }),
    saveChatMessage: async (userId, role, content) => {
      savedMessages.push({ userId, role, content });
      return true;
    },
    getChatHistory: async () => savedMessages,
    clearChatHistory: async () => {
      savedMessages.length = 0;
      return true;
    },
  });

  const app = routeApp(require("../src/routes/ai-chat.routes"));

  const invalid = await request(app, "/message", {
    method: "POST",
    body: { message: "   " },
  });
  assert.equal(invalid.status, 400);
  assert.equal(savedMessages.length, 0);

  const sent = await request(app, "/message", {
    method: "POST",
    body: { message: "How should I hit protein today?", conversationHistory: [] },
  });
  assert.equal(sent.status, 200);
  assert.equal(sent.body.success, true);
  assert.deepEqual(savedMessages, [
    {
      userId: TEST_USER.id,
      role: "user",
      content: "How should I hit protein today?",
    },
    {
      userId: TEST_USER.id,
      role: "assistant",
      content: "Coach response to: How should I hit protein today?",
    },
  ]);

  const cleared = await request(app, "/history", { method: "DELETE" });
  assert.equal(cleared.status, 200);
  assert.equal(savedMessages.length, 0);
});

test("body tracking validates weight, forwards list/progress limits, and returns not found for missing records", async () => {
  clearModules(
    "../src/routes/body-tracking.routes",
    "../src/services/body-tracking.service"
  );

  const calls = [];
  mockModule("../src/services/body-tracking.service", {
    addBodyMeasurement: async (userId, payload) => {
      calls.push({ method: "addBodyMeasurement", userId, payload });
      return { id: "measure_1", ...payload };
    },
    getBodyMeasurements: async (userId, limit) => {
      calls.push({ method: "getBodyMeasurements", userId, limit });
      return [{ id: "measure_1", weightKg: 80 }];
    },
    getLatestBodyMeasurement: async () => ({ id: "measure_1", weightKg: 80 }),
    getProgressSummary: async (userId, weeks) => {
      calls.push({ method: "getProgressSummary", userId, weeks });
      return { weeks, weightChange: -1.2 };
    },
    updateBodyMeasurement: async () => null,
    deleteBodyMeasurement: async () => false,
  });

  const app = routeApp(require("../src/routes/body-tracking.routes"));

  const missingWeight = await request(app, "/", {
    method: "POST",
    body: { bodyFatPercentage: 15 },
  });
  assert.equal(missingWeight.status, 400);
  assert.equal(missingWeight.body.message, "Weight is required");

  const created = await request(app, "/", {
    method: "POST",
    body: {
      weightKg: 80,
      bodyFatPercentage: 15,
      measurements: { waist: 82 },
      notes: "Morning check-in",
    },
  });
  assert.equal(created.status, 200);
  assert.equal(created.body.success, true);

  const list = await request(app, "/?limit=7");
  assert.equal(list.status, 200);
  assert.equal(list.body.measurements[0].weightKg, 80);

  const progress = await request(app, "/progress?weeks=12");
  assert.equal(progress.status, 200);
  assert.equal(progress.body.progress.weeks, 12);

  const updateMissing = await request(app, "/missing_measurement", {
    method: "PUT",
    body: { weightKg: 79 },
  });
  assert.equal(updateMissing.status, 404);
  assert.equal(updateMissing.body.message, "Measurement not found");

  const deleteMissing = await request(app, "/missing_measurement", {
    method: "DELETE",
  });
  assert.equal(deleteMissing.status, 404);
  assert.equal(deleteMissing.body.message, "Measurement not found");

  assert.deepEqual(calls, [
    {
      method: "addBodyMeasurement",
      userId: TEST_USER.id,
      payload: {
        weightKg: 80,
        bodyFatPercentage: 15,
        muscleMassKg: undefined,
        measurements: { waist: 82 },
        photos: undefined,
        notes: "Morning check-in",
      },
    },
    { method: "getBodyMeasurements", userId: TEST_USER.id, limit: 7 },
    { method: "getProgressSummary", userId: TEST_USER.id, weeks: 12 },
  ]);
});

test("supplements validate required fields, default log servings, and return not found on missing records", async () => {
  clearModules(
    "../src/routes/supplement.routes",
    "../src/services/supplement.service"
  );

  const calls = [];
  mockModule("../src/services/supplement.service", {
    addSupplement: async (userId, payload) => {
      calls.push({ method: "addSupplement", userId, payload });
      return { id: "supp_1", ...payload };
    },
    getSupplements: async () => [{ id: "supp_1", name: "Whey Protein" }],
    updateSupplement: async () => null,
    deleteSupplement: async () => false,
    logSupplement: async (userId, payload) => {
      calls.push({ method: "logSupplement", userId, payload });
      return { id: "log_1", ...payload };
    },
    getSupplementLogs: async (userId, startDate, endDate, limit) => {
      calls.push({ method: "getSupplementLogs", userId, startDate, endDate, limit });
      return [];
    },
    getTodaySupplementLogs: async () => ({ logs: [], summary: { taken: 0 } }),
    getSupplementSuggestions: async () => [{ name: "Creatine" }],
  });

  const app = routeApp(require("../src/routes/supplement.routes"));

  const missingName = await request(app, "/", {
    method: "POST",
    body: { brand: "Brandless" },
  });
  assert.equal(missingName.status, 400);
  assert.equal(missingName.body.message, "Supplement name is required");

  const created = await request(app, "/", {
    method: "POST",
    body: {
      name: "Whey Protein",
      brand: "Optimum",
      servingSize: "1 scoop",
      macros: { calories: 120, protein: 24, carbs: 3, fats: 1 },
      timing: ["post_workout"],
      notes: "Chocolate",
    },
  });
  assert.equal(created.status, 200);
  assert.equal(created.body.success, true);

  const log = await request(app, "/supp_1/log", {
    method: "POST",
    body: { notes: "After training" },
  });
  assert.equal(log.status, 200);
  assert.equal(log.body.log.servings, 1);

  const logs = await request(app, "/logs?startDate=2026-05-01&endDate=2026-05-19&limit=5");
  assert.equal(logs.status, 200);

  const suggestions = await request(app, "/suggestions");
  assert.equal(suggestions.status, 200);
  assert.equal(suggestions.body.suggestions[0].name, "Creatine");

  const updateMissing = await request(app, "/missing_supp", {
    method: "PUT",
    body: { name: "Updated" },
  });
  assert.equal(updateMissing.status, 404);
  assert.equal(updateMissing.body.message, "Supplement not found");

  const deleteMissing = await request(app, "/missing_supp", {
    method: "DELETE",
  });
  assert.equal(deleteMissing.status, 404);
  assert.equal(deleteMissing.body.message, "Supplement not found");

  assert.deepEqual(calls, [
    {
      method: "addSupplement",
      userId: TEST_USER.id,
      payload: {
        name: "Whey Protein",
        brand: "Optimum",
        servingSize: "1 scoop",
        servingsPerContainer: undefined,
        macros: { calories: 120, protein: 24, carbs: 3, fats: 1 },
        timing: ["post_workout"],
        notes: "Chocolate",
      },
    },
    {
      method: "logSupplement",
      userId: TEST_USER.id,
      payload: {
        supplementId: "supp_1",
        servings: 1,
        takenAt: undefined,
        notes: "After training",
      },
    },
    {
      method: "getSupplementLogs",
      userId: TEST_USER.id,
      startDate: "2026-05-01",
      endDate: "2026-05-19",
      limit: 5,
    },
  ]);
});
