require('dotenv').config()

const router = require('express').Router()

const login_routes = require('../routes/login')
const assets_routes = require('../routes/assets')
const {requireAuth} = require("../middleware/auth");

router.use('/login', login_routes)
router.use('/assets', requireAuth, assets_routes)

router.get('/status', async (req, res) => {
    res.json({
        status: 'ok',
        is_authenticated: req.session.is_authenticated ?? false
    })
})

module.exports = router