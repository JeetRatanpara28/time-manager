// src/main.js
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

const app = createApp(App);

// make sure router is used
app.use(router);

app.mount("#app");
