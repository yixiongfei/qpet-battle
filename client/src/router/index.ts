import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import Battle from '../pages/Battle.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/battle',
      name: 'battle',
      component: Battle
    }
  ]
})

export default router
