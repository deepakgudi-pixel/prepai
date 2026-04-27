const { query } = require("../db");

async function upsertUserFromHeaders(headers) {
  const clerkUserId = headers["x-clerk-user-id"];
  const email = headers["x-user-email"];

  if (!clerkUserId || !email) {
    return null;
  }

  const username = headers["x-user-username"] || null;
  const firstName = headers["x-user-first-name"] || null;
  const lastName = headers["x-user-last-name"] || null;
  const imageUrl = headers["x-user-image-url"] || null;

  const result = await query(
    `
      INSERT INTO users (
        clerk_user_id,
        email,
        username,
        first_name,
        last_name,
        image_url
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (clerk_user_id)
      DO UPDATE SET
        email = EXCLUDED.email,
        username = EXCLUDED.username,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        image_url = EXCLUDED.image_url,
        updated_at = NOW()
      RETURNING *
    `,
    [clerkUserId, email, username, firstName, lastName, imageUrl],
  );

  return result.rows[0];
}

async function updateDietaryPreference(userId, preference) {
  const result = await query(
    `
      UPDATE users
      SET dietary_preference = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING dietary_preference
    `,
    [userId, preference],
  );

  return result.rows[0];
}

module.exports = {
  upsertUserFromHeaders,
  updateDietaryPreference,
};
