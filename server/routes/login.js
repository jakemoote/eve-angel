const crypto = require("crypto")
const axios = require("axios")
const qs = require("querystring")
const {prisma} = require("../services/prisma")
const express = require("express")
const router = express.Router()

const esi_client_id = process.env.ESI_CLIENT_ID
const esi_secret_key = process.env.ESI_SECRET_KEY

router.get('/eve', async (req, res) => {
    const redirect_uri = req.query.redirect_uri
    const csrf_token = crypto.randomBytes(32).toString('hex')
    const callback_redirect_uri = encodeURI('https://api.eve-angel.localhost/login/eve/callback')

    req.session.login_state = {
        csrf_token,
        redirect_uri
    }
    const url = `https://login.eveonline.com/v2/oauth/authorize/?response_type=code&redirect_uri=${callback_redirect_uri}&client_id=${esi_client_id}&scope=publicData%20esi-assets.read_assets.v1&state=${csrf_token}`
    return res.redirect(url)
})

router.get('/eve/callback', async (req, res) => {
    // TODO: Check already authed
    const login_state = req.session.login_state

    delete req.session.login_state

    if (req.query.state !== login_state.csrf_token) {
        throw Error('Invalid CSRF Token')
    }

    const oauth_response = await axios.post('https://login.eveonline.com/v2/oauth/token', qs.stringify({
        grant_type: 'authorization_code',
        code: req.query.code
    }), {
        auth: {
            username: esi_client_id,
            password: esi_secret_key
        }
    })

    const access_token = oauth_response.data.access_token // JWT Token
    const refresh_token = oauth_response.data.refresh_token

    // TODO: Pull character_id from jwt instead of making request
    const verify_response = await axios.get('https://esi.evetech.net/verify', {
        headers: {'Authorization': 'Bearer ' + access_token}
    })

    const character_id = verify_response.data.CharacterID
    const character_name = verify_response.data.CharacterName

    const user = await prisma.character.findUnique({where: {character_id}}).user()

    if (user) {
        req.session.user_id = user.id
    } else {
        const new_user = await prisma.user.create({
            data: {
                characters: {
                    create: {
                        name: character_name,
                        character_id,
                        access_token,
                        refresh_token
                    },
                }
            },
        })
        req.session.user_id = new_user.id
    }

    req.session.is_authenticated = true

    return res.redirect(login_state.redirect_uri)
})

module.exports = router