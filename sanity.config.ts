import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { presentationTool } from 'sanity/presentation';
import { visionTool } from '@sanity/vision';
import { apiVersion, dataset, projectId } from './src/sanity/env';
import { schemaTypes } from './src/sanity/schemaTypes';
import { resolve } from './src/sanity/presentation/resolve';

export default defineConfig({
  name: 'default',
  title: 'Uzay Koleji',
  projectId,
  dataset,
  basePath: '/studio',
  schema: { types: schemaTypes },
  plugins: [
    presentationTool({
      resolve,
      previewUrl: {
        initial: typeof window === 'undefined' ? process.env.NEXT_PUBLIC_SITE_URL! : window.location.origin,
        previewMode: { enable: '/api/draft-mode/enable', disable: '/api/draft-mode/disable' },
      },
    }),
    structureTool(),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
});
