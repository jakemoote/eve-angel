require('dotenv').config()

const router = require('express').Router()
const axios = require("axios");
const qs = require("querystring");
const jwksClient = require("jwks-rsa");
const jwt = require("jsonwebtoken");
const {User, UserCharacter} = require("../models");

const esi_client_id = process.env.ESI_CLIENT_ID
const esi_secret_key = process.env.ESI_SECRET_KEY

router.get('/callback', async (req, res) => {
    const oauth_response = await axios.post('https://login.eveonline.com/v2/oauth/token', qs.stringify({
        grant_type: 'authorization_code',
        code: req.query.code
    }), {
        auth: {
            username: esi_client_id,
            password: esi_secret_key
        }
    })

    const jwks_client = jwksClient({
        jwksUri: 'https://login.eveonline.com/oauth/jwks'
    })

    function getKey(header, callback) {
        jwks_client.getSigningKey(header.kid, function (err, key) {
            const signingKey = key.publicKey || key.rsaPublicKey
            callback(null, signingKey)
        })
    }

    const access_token = oauth_response.data.access_token // JWT Token
    const refresh_token = oauth_response.data.refresh_token

    const verifyToken = async (issuer) => {
        return new Promise((resolve, reject) => {
            return jwt.verify(access_token, getKey, {issuer}, (err, decoded) =>
                err ? reject(err) : resolve(decoded))
        })
    }

    let decoded
    try {
        decoded = await verifyToken('login.eveonline.com')
    } catch (err) {
        if (err.message.includes('jwt issuer invalid.')) {
            try {
                decoded = await verifyToken('https://login.eveonline.com')
            } catch (err) {
                console.debug('JWT Verification Failed')
                return res.redirect('/')
            }
        } else {
            console.debug('JWT Verification Failed')
            return res.redirect('/')
        }
    }

    console.debug('JWT Verified!')
    console.debug(decoded)
    console.debug(access_token)

    const verify_response = await axios.get('https://esi.evetech.net/verify', {
        headers: {'Authorization': 'Bearer ' + access_token}
    })

    const character_id = verify_response.data.CharacterID
    const character_name = verify_response.data.CharacterName

    console.debug('Character ID: ' + character_id)

    req.session.esi_access_token = access_token
    req.session.esi_refresh_token = refresh_token

    res.redirect('/assets')
})

router.get('/token-refresh', async (req, res) => {
    const response = await axios.post('https://login.eveonline.com/v2/oauth/token', qs.stringify({
        grant_type: 'refresh_token',
        refresh_token: req.session.esi_refresh_token,
    }), {
        auth: {
            username: esi_client_id,
            password: esi_secret_key
        }
    })

    console.debug('Token refreshed!')
    console.debug(response.data)
    console.debug('Old token: ' + req.session.esi_access_token)
    console.debug('Old refresh: ' + req.session.esi_refresh_token)
    console.debug('New token: ' + response.data.access_token)
    console.debug('New refresh: ' + response.data.refresh_token)

    req.session.esi_access_token = response.data.access_token
    req.session.esi_refresh_token = response.data.refresh_token

    return res.redirect('/assets')
})

router.get('/assets', async (req, res) => {
    if (!req.session.esi_access_token) {
        return res.redirect('/')
    }

    // const assets_response = await axios.get('https://esi.evetech.net/latest/characters/' + character_id + '/assets/', {
    //     headers: {'Authorization': 'Bearer ' + req.session.esi_access_token}
    // })

    // assets_response.headers['x-pages']
    // assets_response.data.map((asset_data) => {
    //     asset_data.character_id = character_id
    //     Asset.create(asset_data)
    // })

    res.send('Login success - Assets')
})

module.exports = router