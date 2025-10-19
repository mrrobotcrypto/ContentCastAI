import express from 'express';
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";

async function startServer() {
  const app = express();
  const port = parseInt(process.env.PORT || '5000', 10);

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging middleware
  app.use((req, res, next) => {
    log(`${req.method} ${req.url}`);
    next();
  });

  // Serve static files from public directories (both dev and prod) - BEFORE API routes
  app.use(express.static('public'));
  app.use(express.static('client/public'));

  // Register API routes
  const server = await registerRoutes(app);

  // Setup Vite for development or serve static files for production
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    serveStatic(app);
  } else {
    await setupVite(app, server);
  }

  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({
      ok: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });

  server.listen(port, '0.0.0.0', () => {
    log(`🚀 Server running on http://0.0.0.0:${port}`, 'server');
    log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`, 'server');
  });
}

startServer().catch(console.error);