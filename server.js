const express = require('express')
const session = require('express-session')
const axios = require('axios')
const qs = require('querystring')
const FileStore = require('session-file-store')(session);
const Sequelize = require('sequelize')
const SequelizeStore = require("connect-session-sequelize")(session.Store);
require('dotenv').config()

const app = express()
const port = 80

const clientId = process.env.ESI_CLIENT_ID
const secretKey = process.env.ESI_SECRET_KEY

const session_options = {
    store: new FileStore({}),
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: false,
    cookie: {}
}

// if (app.get('env') === 'production') {
//     app.set('trust proxy', 1) // trust first proxy
//     sess.cookie.secure = true // serve secure cookies
// }

app.use(session(session_options))

app.use(express.static('public'))

app.get('/callback', async (req, res) => {
    console.debug('EVE Login Callback')

    const response = await axios.post('https://login.eveonline.com/v2/oauth/token', qs.stringify({
        grant_type: 'authorization_code',
        code: req.query.code
    }), {
        auth: {
            username: clientId,
            password: secretKey
        }
    })

    req.session.esi_access_token = response.data.access_token
    req.session.esi_refresh_token = response.data.refresh_token

    res.redirect('/assets')
})

app.get('/assets', async (req, res) => {
    if (!req.session.esi_access_token) {
        return res.redirect('/')
    }

    const response = await axios.get('https://esi.evetech.net/verify', {
        headers: {'Authorization': 'Bearer ' + req.session.esi_access_token}
    })

    const character_id = response.data.CharacterID;
    const character_name = response.data.CharacterName;

    const assets_response = await axios.get('https://esi.evetech.net/latest/characters/' + character_id + '/assets/', {
        headers: {'Authorization': 'Bearer ' + req.session.esi_access_token}
    })

    // assets_response.headers['x-pages']
    console.debug(assets_response.data)
    console.debug('^^^ ASSET DATA ^^^')

    res.send('Login success - Assets')
})

app.listen(port, () => {
    console.debug(`Listening at http://localhost:${port}`)
})