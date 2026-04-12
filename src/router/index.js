import { defineRouter } from "#q-app/wrappers";
import { useAuthStore } from "../stores/auth";
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from "vue-router";
import routes from "./routes";

/*
 * If not building with SSR mode, you can
 * directly export the router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the router instance.
 */

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === "history"
      ? createWebHistory
      : createWebHashHistory;

  const router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  // Navigation guard
  router.beforeEach(async (to, from, next) => {
    const auth = useAuthStore();

    const isLoggedIn = await auth.checkAuth();
    if (!isLoggedIn && to.path !== "/login" && to.path !== "/register") {
      next("/login");
    } else {
      next();
    }
  });

  return router;
});
