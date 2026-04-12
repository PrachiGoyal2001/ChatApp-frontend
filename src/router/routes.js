import MainLayout from "../layouts/MainLayout.vue";
import IndexPage from "../pages/IndexPage.vue";
import LoginPage from "../pages/LoginPage.vue";
import RegisterPage from "../pages/RegisterPage.vue";
import selectedUserPage from "../pages/selectedUserPage.vue";

const routes = [
  {
    path: "/",
    component: MainLayout,
    children: [
      { path: "", 
        component: IndexPage,
        children:[
          { path: ":userId", component: selectedUserPage },
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
