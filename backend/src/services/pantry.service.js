const { query } = require("../db");

const serializePantryItem = (row) => ({
  id: String(row.id),
  documentId: String(row.id),
  name: row.name,
  quantity: row.quantity,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

async function listPantryItems(userId) {
  const result = await query(
    `
      SELECT *
      FROM pantry_items
      WHERE user_id = $1
      ORDER BY created_at DESC
    `,
    [userId],
  );

  return result.rows.map(serializePantryItem);
}

async function createPantryItem(userId, name, quantity) {
  const result = await query(
    `
      INSERT INTO pantry_items (user_id, name, quantity)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
    [userId, name, quantity],
  );

  return serializePantryItem(result.rows[0]);
}

async function createPantryItemsBulk(userId, ingredients) {
  const savedItems = [];

  for (const ingredient of ingredients) {
    const item = await createPantryItem(userId, ingredient.name, ingredient.quantity);
    savedItems.push(item);
  }

  return savedItems;
}

async function updatePantryItem(userId, itemId, name, quantity) {
  const result = await query(
    `
      UPDATE pantry_items
      SET name = $3, quantity = $4, updated_at = NOW()
      WHERE user_id = $1 AND id = $2
      RETURNING *
    `,
    [userId, itemId, name, quantity],
  );

  return result.rows[0] ? serializePantryItem(result.rows[0]) : null;
}

async function deletePantryItem(userId, itemId) {
  const result = await query(
    `DELETE FROM pantry_items WHERE user_id = $1 AND id = $2`,
    [userId, itemId],
  );

  return result.rowCount > 0;
}

async function clearPantryItems(userId) {
  await query(`DELETE FROM pantry_items WHERE user_id = $1`, [userId]);
}

module.exports = {
  listPantryItems,
  createPantryItem,
  createPantryItemsBulk,
  updatePantryItem,
  deletePantryItem,
  clearPantryItems,
};
