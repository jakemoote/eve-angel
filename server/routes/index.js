require('dotenv').config()

const router = require('express').Router()

const login_routes = require('../routes/login')
const assets_routes = require('../routes/assets')
const {requireAuth} = require("../middleware/auth");
const axios = require("axios");
const { prisma } = require('../services/prisma')

router.use('/login', login_routes)
router.use('/assets', requireAuth, assets_routes)

router.get('/status', async (req, res) => {
    res.json({
        status: 'ok',
        is_authenticated: req.session.is_authenticated ?? false
    })
})

router.get('/market/update', requireAuth, async (req, res) => {
    console.debug('getting market data')
    const market_prices_response = await axios.get('https://esi.evetech.net/latest/markets/prices/')
    await prisma.marketPrice.deleteMany()
    await prisma.marketPrice.createMany({data: market_prices_response.data})

    res.json({status: 'ok', msg: 'updating market'})
})

module.exports = router