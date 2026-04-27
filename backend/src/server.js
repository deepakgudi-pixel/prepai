const app = require("./app");
const { env } = require("./config/env");

app.listen(env.port, () => {
  console.log(`PrepAI backend listening on port ${env.port}`);
});

module.exports = app;
