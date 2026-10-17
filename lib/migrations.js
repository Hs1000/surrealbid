const User = require("../models/User");

/**
 * One-off fixes for existing databases, run at startup (each is safe to run repeatedly).
 */
async function runMigrations() {
  // Accounts may now have no email (WhatsApp sign-up). The original unique index on email
  // treated every missing email as a duplicate, so replace it with a partial index.
  const indexes = await User.collection.indexes().catch(() => []);
  const emailIndex = indexes.find((index) => index.name === "email_1");
  if (emailIndex && !emailIndex.partialFilterExpression) {
    await User.collection.dropIndex("email_1");
    console.log("[migrations] replaced users.email_1 with a partial unique index");
  }
  await User.createIndexes();
}

module.exports = { runMigrations };
