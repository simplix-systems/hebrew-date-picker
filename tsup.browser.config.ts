import { defineConfig } from 'tsup';

// Standalone IIFE build for plain <script> usage (no bundler, works over
// file://). Exposes `window.HebrewDatePicker` and auto-registers the
// <hebrew-date-picker> custom element. Bundles everything (no externals).
export default defineConfig({
  entry: { 'hebrew-datepicker.global': 'src/webcomponent/index.ts' },
  format: ['iife'],
  globalName: 'HebrewDatePicker',
  dts: false,
  sourcemap: true,
  clean: false,
  minify: true,
  outExtension() {
    return { js: '.js' };
  }
});
