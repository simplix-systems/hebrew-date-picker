import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'core/index': 'src/core/index.ts',
    'vue/index': 'src/vue/index.ts',
    'react/index': 'src/react/index.tsx',
    'angular/index': 'src/angular/index.ts',
    'webcomponent/index': 'src/webcomponent/index.ts'
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  // Frameworks are peer deps - never bundle them.
  external: ['vue', 'react', 'react-dom', 'react/jsx-runtime', 'svelte', '@angular/core', '@angular/forms'],
  outExtension({ format }) {
    return { js: format === 'cjs' ? '.cjs' : '.js' };
  }
});
