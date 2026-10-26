import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import next from 'next';
import path from 'path';
import { parse } from 'url';
import { setupSocketHandlers } from './socketHandler';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);
const dir = path.resolve(__dirname, '../../');

const app = next({ dev, hostname, port, dir });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  const httpServer = http.createServer(server);

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  setupSocketHandlers(io);

  // Let Next.js handle all requests including App Router API routes
  server.all('*', (req, res) => {
    const parsedUrl = parse(req.url, true);
    return handle(req, res, parsedUrl);
  });

  httpServer.listen(port, () => {
    console.log(`> Quiz Battle Royale Server ready on http://localhost:${port}`);
  });
}).catch((err) => {
  console.error('Server startup error:', err);
  process.exit(1);
});
