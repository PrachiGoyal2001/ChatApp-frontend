import { defineRouter } from "#q-app/wrappers";
import { useAuthStore } from "../stores/auth";
import { useCallStore } from "../stores/callStore";
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
    const callStore = useCallStore();

    const isAuthPage = ["/login", "/register"].includes(to.path);

    if (callStore.isCallActive) {
      const shouldLeave = await callStore.confirmActiveCallRouteLeave();

      if (!shouldLeave) {
        return next(false);
      }
    }

    // Not logged in and trying to access a protected page
    if (!auth.token && !isAuthPage) {
      return next("/login");
    }

    // Logged in and trying to access login/register
    if (auth.token && isAuthPage) {
      return next("/");
    }

    next();
  });

  return router;
});
