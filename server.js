// Entry point for cPanel "Setup Node.js App" (Passenger). Passenger runs this file
// directly and expects the app to listen on process.env.PORT — plain `next start`
// isn't invocable through Passenger's Node integration, so this replicates it.
const { createServer } = require("http");
const next = require("next");

const port = parseInt(process.env.PORT || "3000", 10);
const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => handle(req, res)).listen(port, () => {
    console.log(`daftar-hadir listening on port ${port}`);
  });
});
