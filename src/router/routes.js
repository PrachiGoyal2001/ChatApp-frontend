import MainLayout from "../layouts/MainLayout.vue";
import LoginLayout from "../layouts/LoginLayout.vue";
import IndexPage from "../pages/IndexPage.vue";
import LoginPage from "../pages/LoginPage.vue";
import ProfilePage from "../pages/ProfilePage.vue";
import RegisterPage from "../pages/RegisterPage.vue";
import SearchPage from "../pages/SearchPage.vue";
import SelectedUserPage from "../pages/SelectedUserPage.vue";

const routes = [
  {
    path: "/",
    component: MainLayout,
    children: [
      {
        path: "",
        component: IndexPage,
        children: [{ path: ":userId", component: SelectedUserPage }],
      },
      {
        path: "/profile",
        component: ProfilePage,
      },
      {
        path: "/search",
        component: SearchPage,
      },
    ],
  },
  {
    path: "/",
    component: LoginLayout,
    children: [
      {
        path: "login",
        component: LoginPage,
      },
      {
        path: "register",
        component: RegisterPage,
      },
    ],
  },
  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;
