const jwksClient = require("jwks-rsa");
const {TokenExpiredError} = require("jsonwebtoken");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const qs = require("querystring");
const {prisma} = require("../services/prisma");
const jwks_client = jwksClient({
    jwksUri: 'https://login.eveonline.com/oauth/jwks'
})
const {esi_client_id,esi_secret_key} = require('../config/esi')

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

module.exports = {
    getCharacterWithUpdatedToken
}