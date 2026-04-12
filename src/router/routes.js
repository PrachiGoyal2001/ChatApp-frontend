import MainLayout from "../layouts/MainLayout.vue";
import IndexPage from "../pages/IndexPage.vue";
import LoginPage from "../pages/LoginPage.vue";
import RegisterPage from "../pages/RegisterPage.vue";
import SelectedUserPage from "../pages/SelectedUserPage.vue";

const routes = [
  {
    path: "/",
    component: MainLayout,
    children: [
      { path: "", 
        component: IndexPage,
        children:[
          { path: ":userId", component: SelectedUserPage },
        ]
      },
    ],
  },
  {
    path: "/login",
    component: LoginPage,
  },
  {
    path: "/register",
    component: RegisterPage,
  },
  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;
