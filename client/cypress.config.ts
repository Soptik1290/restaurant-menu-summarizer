// Cypress E2E configuration for the client application
import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Place Node event listeners here when needed (e.g., tasks, preprocessors)
    },
    // Base URL for the React dev server used by E2E tests
    baseUrl: 'http://localhost:3000', 
  },
});