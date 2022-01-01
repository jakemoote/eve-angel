require('dotenv').config()

const router = require('express').Router()
const axios = require("axios");
const qs = require("querystring");
const jwksClient = require("jwks-rsa");
const jwt = require("jsonwebtoken");
const crypto = require("crypto")
const { PrismaClient } = require('../prisma/generated/eve-angel-client')
const { PrismaClient: SDEPrismaClient } = require('../prisma/generated/eve-sde-client')
const {TokenExpiredError} = require("jsonwebtoken");

const prisma = new PrismaClient({
    log: ['query']
})
const sde_prisma = new SDEPrismaClient({
    log: ['query']
})

const esi_client_id = process.env.ESI_CLIENT_ID
const esi_secret_key = process.env.ESI_SECRET_KEY

const requireAuth = (req, res, next) => {
    if (!req.session.is_authenticated) {
        return res.status(401).json({error: 'Unauthorized'})
    }

    next()
}

const jwks_client = jwksClient({
    jwksUri: 'https://login.eveonline.com/oauth/jwks'
})

const getKey = (header, callback) => {
    jwks_client.getSigningKey(header.kid, function (err, key) {
        const signingKey = key.publicKey || key.rsaPublicKey
        callback(null, signingKey)
    })
}

const getCharacterWithUpdatedToken = async (character, refresh_expired = true) => {
    try {
        await verifyTokenByCharacter(character)
        return character
    } catch (err) {
        if (err instanceof TokenExpiredError && refresh_expired) {
            const updated_character = await refreshTokenForCharacter(character)
            return await getCharacterWithUpdatedToken(updated_character, false)
        }

        throw err
    }
}

const verifyTokenByCharacter = async (character) => {
    try {
        return !!await verifyTokenAndIssuer(character.access_token, 'login.eveonline.com')
    } catch (err) {
        if (err.message.includes('jwt issuer invalid.')) {
            return !!await verifyTokenAndIssuer(character.access_token, 'https://login.eveonline.com')
        }

        throw err
    }
}

const verifyTokenAndIssuer = async (token, issuer) => {
    return new Promise((resolve, reject) => {
        return jwt.verify(token, getKey, {issuer}, (err, decoded) =>
            err ? reject(err) : resolve(decoded))
    })
}

const refreshTokenForCharacter = async (character) => {
    const refresh_token_response = await axios.post('https://login.eveonline.com/v2/oauth/token', qs.stringify({
        grant_type: 'refresh_token',
        refresh_token: character.refresh_token,
    }), {
        auth: {
            username: esi_client_id,
            password: esi_secret_key
        }
    })

    return prisma.character.update({
        where: { character_id: character.character_id },
        data: {
            access_token: refresh_token_response.data.access_token,
            refresh_token: refresh_token_response.data.refresh_token
        }
    })
}

router.get('/status', async (req, res) => {
    res.json({
        status: 'ok',
        is_authenticated: req.session.is_authenticated ?? false
    })
})

router.get('/login/eve', async (req, res) => {
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

router.get('/login/eve/callback', async (req, res) => {
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

router.get('/assets/update', requireAuth, async (req, res) => {
    const user = await prisma.user.findUnique({
        where: {
            id: req.session.user_id,
        },
        include: {
            characters: true,
        },
    })

    const updateCharacter = async (character) => {
        try {
            const updated_character = await getCharacterWithUpdatedToken(character)
            const assets_response = await axios.get('https://esi.evetech.net/latest/characters/' + updated_character.character_id + '/assets/', {
                headers: {'Authorization': 'Bearer ' + updated_character.access_token}
            })

            const asset_data = assets_response.data.map((asset) => {
                return {
                    character_id: updated_character.character_id,
                    is_singleton: asset.is_singleton,
                    item_id: asset.item_id,
                    location_flag: asset.location_flag,
                    location_id: asset.location_id,
                    location_type: asset.location_type,
                    quantity: asset.quantity,
                    type_id: asset.type_id,
                }
            })
            // const pages = assets_response.headers['x-pages'] // TODO: Handle multiple pages

            await prisma.asset.deleteMany({where: {character_id: updated_character.character_id}})
            await prisma.asset.createMany({data: asset_data})
        } catch (err) {
            console.debug(err, `^^^ Skipped updating ${character.id}...`)
        }
    }

    const updateCharactersAssets = async () => Promise.all(user.characters.map((character) => updateCharacter(character)))

    updateCharactersAssets()

    res.json({'status': 'updating in background'})
})

router.get('/assets', requireAuth, async (req, res) => {
    const assets = await prisma.asset.findMany({
        select: {
            type_id: true,
            quantity: true,
            location_type: true,
            location_id: true,
            character: {
                select: {
                    name: true
                }
            }
        },
        where: {
            character: {
                user_id: req.session.user_id
            }
        },
    })

    const type_ids = assets.map((asset) => asset.type_id)
    const types = await sde_prisma.invTypes.findMany({
        where: {typeID: {in: type_ids}},
        select: {
            typeID: true,
            typeName: true,
            description: true,
        },
    },)

    const station_location_ids = assets.map((asset) => asset.location_type === 'station' ? asset.location_id : null).filter(asset => asset)
    const stations = await sde_prisma.staStations.findMany({
        select: {
            stationID: true,
            stationName: true
        },
        where: {stationID: {in: station_location_ids}}
    })

    const assets_return = assets.map((asset) => {
        const type = types.find(type => type.typeID === asset.type_id)
        const type_name = type.typeName

        const data = {
            type_id: asset.type_id,
            name: type_name,
            quantity: asset.quantity,
            character: asset.character
        }

        const station = asset.location_type === 'station' ? (stations.find(station => station.stationID === asset.location_id)) : null

        if (station) {
            data.station = station
        }

        return data
    })

    res.json(assets_return)
})

module.exports = router