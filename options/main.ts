/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */


// Components
import App from './options.vue'

// Composables
import { createApp } from 'vue'

const app = createApp(App)

app.mount('#app')
