const express = require('express')
const session = require('express-session')
const axios = require('axios')
const qs = require('querystring')
const { Sequelize, DataTypes} = require('sequelize')
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const SequelizeStore = require("connect-session-sequelize")(session.Store);
require('dotenv').config()

const app = express()
const port = 80

const esi_client_id = process.env.ESI_CLIENT_ID
const esi_secret_key = process.env.ESI_SECRET_KEY

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    dialect: 'postgres',
    dialectOptions: {},
    host: process.env.DB_HOST,
    port: process.env.DB_PORT
});

const Asset = sequelize.define('Asset', {
    // Model attributes are defined here
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    character_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    is_singleton: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    item_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        unique: true
    },
    location_flag: {
        type: DataTypes.STRING,
        allowNull: false
    },
    location_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    location_type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    type_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {});

sequelize.sync({force: true})

const sequelize_store = new SequelizeStore({db: sequelize})
sequelize_store.sync()

const session_options = {
    store: sequelize_store,
    secret: process.env.SESSION_SECRET,
    resave: false,
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
    const response = await axios.post('https://login.eveonline.com/v2/oauth/token', qs.stringify({
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
    });
    function getKey(header, callback){
        jwks_client.getSigningKey(header.kid, function(err, key) {
            const signingKey = key.publicKey || key.rsaPublicKey;
            callback(null, signingKey);
        });
    }

    const access_token = response.data.access_token // JWT Token

    const verifyToken = async (issuer) => {
        return new Promise((resolve,reject) => {
            return jwt.verify(access_token, getKey, { issuer }, (err, decoded) =>
                    err ? reject(err) : resolve(decoded))
        })
    }

    let decoded;
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

    console.debug(decoded)

    req.session.esi_access_token = access_token
    // TODO: Implement refresh token
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
    assets_response.data.map((asset_data) => {
        asset_data.character_id = character_id
        Asset.create(asset_data)
    })

    res.send('Login success - Assets')
})

app.listen(port, () => {
    console.debug(`Listening at http://localhost:${port}`)
})