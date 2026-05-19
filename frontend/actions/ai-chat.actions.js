"use server";

import { backendFetch, checkUser } from "@/lib/checkUser";

export async function sendChatMessage(formData) {
  try {
    const userJson = formData.get("authUser");
    const user = await checkUser(userJson ? JSON.parse(userJson) : null);
    const message = formData.get("message");
    const conversationHistoryJson = formData.get("conversationHistory");
    const conversationHistory = conversationHistoryJson
      ? JSON.parse(conversationHistoryJson)
      : [];

    if (!user) {
      throw new Error("User not authenticated");
    }

    if (!message || !message.trim()) {
      throw new Error("Message is required");
    }

    const response = await backendFetch("/ai-chat/message", user, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: message.trim(),
        conversationHistory,
      }),
    });

    if (!response) {
      throw new Error("User not authenticated");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to send message");
    }

    return data;
  } catch (error) {
    console.error("Error sending chat message:", error);
    return {
      success: false,
      message: "Sorry, I'm having trouble responding right now. Please try again.",
      error: error.message,
    };
  }
}

export async function getChatHistory(user) {
  try {
    const authUser = await checkUser(user);

    if (!authUser) {
      return { success: false, history: [], message: "Please sign in" };
    }

    const response = await backendFetch("/ai-chat/history", authUser);

    if (!response) {
      return { success: false, history: [], message: "Please sign in" };
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to load chat history");
    }

    return data;
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return {
      success: false,
      history: [],
      message: error.message || "Failed to load chat history",
    };
  }
}

export async function clearChatHistory(formData) {
  try {
    const userJson = formData.get("authUser");
    const user = await checkUser(userJson ? JSON.parse(userJson) : null);

    if (!user) {
      throw new Error("User not authenticated");
    }

    const response = await backendFetch("/ai-chat/history", user, {
      method: "DELETE",
    });

    if (!response) {
      throw new Error("User not authenticated");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to clear chat history");
    }

    return data;
  } catch (error) {
    console.error("Error clearing chat history:", error);
    return {
      success: false,
      message: error.message || "Failed to clear chat history",
    };
  }
}
