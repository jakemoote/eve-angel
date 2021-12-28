import { createRouter, createWebHistory } from 'vue-router'
import Login from '../components/Login.vue'
import Assets from '../components/Assets.vue'
import axios from "axios";

const routes = [
    {
        path: '/',
        name: 'Login',
        component: Login,
        meta: {
            requires_guest: true
        }
    },
    {
        path: '/assets',
        name: 'Assets',
        component: Assets,
        meta: {
            requires_auth: true
        }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

router.beforeEach(async (to, from, next) => {
    if (to.matched.some(record => record.meta.requires_auth)) {
        const status_response = await axios.get('https://api.eve-angel.localhost/status', {withCredentials: true})

        if (!status_response.data.is_authenticated) {
            next({
                path: '/', // TODO: Maybe redirect to home and remove redirect_uri param instead of redirecting eve login?
                params: {redirect_uri: to.fullPath}
            })
        }
    } else if (to.matched.some(record => record.meta.requires_guest)) {
        const status_response = await axios.get('https://api.eve-angel.localhost/status', {withCredentials: true})

        if (status_response.data.is_authenticated) {
            next({
                path: '/assets',
            })
        }
    }

    next()
})

export default router
