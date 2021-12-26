import { createRouter, createWebHistory } from 'vue-router'
import Login from '../components/Login.vue'
import Assets from '../components/Assets.vue'

const routes = [
    {
        path: '/',
        name: 'Login',
        component: Login,
    },
    {
        path: '/assets',
        name: 'Assets',
        component: Assets
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router
