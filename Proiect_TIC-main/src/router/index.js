import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "Home",
    component: ()=>import('../views/Home.vue'),
  },
  {
    path: "/review",
    name: "Reviews",
    component: ()=>import('../views/Reviews.vue'),
  },
  {
    path: "/login",
    name: "Login",
    component: ()=>import('../views/Login.vue'),
  },
  {
    path: '/reviews/:reviewTitle',
    name: 'ReviewDetails',
    component: () => import('../views/ReviewDetails.vue'),
    props: route => ({ review: JSON.parse(route.query.review) }),
  },
  {
    path: "/register",
    name: "Register",
    component: ()=>import('../views/Register.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
