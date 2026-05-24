const express = require("express");
const path = require("path");
const fs = require("fs");
const { WebSocketServer } = require("ws");

const PORT = process.env.PORT || 8080;

const app = express();

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/mods", (req, res) => {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "mods.json"), "utf-8"));
  res.json(data);
});

app.get("/api/mods/:id", (req, res) => {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "mods.json"), "utf-8"));
  const mod = data.find((m) => m.id === req.params.id);
  if (!mod) return res.status(404).json({ error: "mod not found" });
  res.json(mod);
});

// SPA fallback: serve index.html for non-API, non-file routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const server = app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server });

const sessions = new Map(); // ws -> { from, source, ign, island }

wss.on("error", (err) => {
  console.error(`[WS] Error:`, err.message);
});

function sendJson(ws, data) {
  if (ws.readyState === 1) ws.send(JSON.stringify(data));
}

function broadcast(data, excludeWs) {
  wss.clients.forEach((client) => {
    if (client !== excludeWs && client.readyState === 1) {
      client.send(JSON.stringify(data));
    }
  });
}

function broadcastAll(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(JSON.stringify(data));
  });
}

function sessionByWs(ws) {
  return sessions.get(ws);
}

wss.on("connection", (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`[WS] client connected from ${clientIp}`);

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    const { type, from, source, payload } = msg;

    switch (type) {
      case "connect": {
        if (!from || !source || !payload?.ign) {
          sendJson(ws, { type: "error", payload: { code: "INVALID_PAYLOAD", message: "Missing from/source/ign" } });
          return;
        }
        sessions.set(ws, { from, source, ign: payload.ign, island: payload.island || "" });
        const onlineCount = sessions.size;
        sendJson(ws, { type: "system", payload: { content: "connected", onlineCount } });
        broadcast({ type: "player_join", source, from, timestamp: Date.now(), payload: { ign: payload.ign } }, ws);
        console.log(`[WS] ${payload.ign} connected (online: ${onlineCount})`);
        break;
      }

      case "disconnect": {
        const session = sessionByWs(ws);
        if (session) {
          broadcast({ type: "player_leave", source: session.source, from: session.from, timestamp: Date.now(), payload: { ign: session.ign } }, ws);
          sessions.delete(ws);
          console.log(`[WS] ${session.ign} disconnected`);
        }
        break;
      }

      case "chat": {
        const session = sessionByWs(ws);
        if (!session) return;
        const out = { type: "chat", source, from, timestamp: Date.now(), payload: { ign: session.ign, content: payload?.content || "" } };
        broadcastAll(out);
        break;
      }

      case "event": {
        const session = sessionByWs(ws);
        if (!session) return;
        const out = { type: "event", source, from, timestamp: Date.now(), payload: { ign: session.ign, eventType: payload?.eventType || "", data: payload?.data || {} } };
        broadcastAll(out);
        break;
      }

      case "ping": {
        sendJson(ws, { type: "pong", timestamp: Date.now() });
        break;
      }

      default:
        break;
    }
  });

  ws.on("close", () => {
    const session = sessionByWs(ws);
    if (session) {
      broadcast({ type: "player_leave", source: session.source, from: session.from, timestamp: Date.now(), payload: { ign: session.ign } }, ws);
      sessions.delete(ws);
      console.log(`[WS] ${session.ign} disconnected (online: ${sessions.size})`);
    }
  });

  ws.on("error", (err) => {
    console.error(`[WS] error from ${clientIp}:`, err.message);
  });
});
