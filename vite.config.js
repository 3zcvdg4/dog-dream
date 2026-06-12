import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const posterSourceDir = path.resolve(__dirname, 'poster');
const posterDevRoute = '/__poster';
const posterBuildDirName = 'poster';
const contentWorkspaceDir = path.resolve(__dirname, '../网站/三级页面项目合集');

const posterMimeTypes = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

const isInsidePosterDirectory = (targetPath) => {
  const relativePath = path.relative(posterSourceDir, targetPath);
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
};

const getPosterMimeType = (filePath) => posterMimeTypes[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';

const copyPosterDirectoryToDist = async (distDir) => {
  if (!fs.existsSync(posterSourceDir)) {
    return;
  }

  const targetDir = path.join(distDir, posterBuildDirName);
  await fsp.rm(targetDir, { recursive: true, force: true });
  await fsp.cp(posterSourceDir, targetDir, { recursive: true });
};

const posterRuntimePlugin = () => {
  let distDir = path.resolve(__dirname, 'dist');

  return {
    name: 'poster-runtime-plugin',
    configResolved(config) {
      distDir = path.resolve(config.root, config.build.outDir);
    },
    configureServer(server) {
      if (fs.existsSync(posterSourceDir)) {
        server.watcher.add(posterSourceDir);
      }

      const triggerPosterReload = (filePath) => {
        if (!filePath) {
          return;
        }

        const absolutePath = path.resolve(filePath);

        if (!isInsidePosterDirectory(absolutePath)) {
          return;
        }

        server.ws.send({ type: 'full-reload' });
      };

      server.watcher.on('add', triggerPosterReload);
      server.watcher.on('change', triggerPosterReload);
      server.watcher.on('unlink', triggerPosterReload);

      server.middlewares.use(async (req, res, next) => {
        const requestUrl = req.url?.split('?')[0] ?? '';

        if (!requestUrl.startsWith(`${posterDevRoute}/`)) {
          next();
          return;
        }

        const relativePath = decodeURIComponent(requestUrl.slice(posterDevRoute.length + 1));
        const absolutePath = path.resolve(posterSourceDir, relativePath);

        if (!isInsidePosterDirectory(absolutePath)) {
          res.statusCode = 403;
          res.end('Forbidden');
          return;
        }

        try {
          const fileStat = await fsp.stat(absolutePath);

          if (!fileStat.isFile()) {
            next();
            return;
          }

          res.setHeader('Content-Type', getPosterMimeType(absolutePath));
          fs.createReadStream(absolutePath).pipe(res);
        } catch (error) {
          if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
            res.statusCode = 404;
            res.end('Not found');
            return;
          }

          next(error);
        }
      });

      return () => {
        server.watcher.off('add', triggerPosterReload);
        server.watcher.off('change', triggerPosterReload);
        server.watcher.off('unlink', triggerPosterReload);
      };
    },
    async closeBundle() {
      await copyPosterDirectoryToDist(distDir);
    },
  };
};

export default defineConfig({
  server: {
    fs: {
      allow: [__dirname, contentWorkspaceDir],
    },
  },
  plugins: [react(), posterRuntimePlugin()],
});
