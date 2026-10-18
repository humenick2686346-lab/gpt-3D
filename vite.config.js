import { defineConfig } from 'vite';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
export default defineConfig({
  base: './',
  plugins: [{
    name: 'local-delivery-files',
    configureServer(server) {
      const types={'offline.html':'text/html; charset=utf-8','tokyo-tower-source.zip':'application/zip','THIRD_PARTY_LICENSES.txt':'text/plain; charset=utf-8'};
      server.middlewares.use(async(req,res,next)=>{
        const name=new URL(req.url,'http://localhost').pathname.slice(1);
        if(!Object.hasOwn(types,name))return next();
        try {
          const bytes=await readFile(path.resolve('dist',name));
          res.setHeader('Content-Type',types[name]);res.end(bytes);
        } catch {res.statusCode=503;res.end('Run npm run build to prepare the downloadable files.');}
      });
    },
  }],
  build: { target: 'es2022', chunkSizeWarningLimit: 900 },
});
