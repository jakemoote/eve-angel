const sequelize = require("./sequelize");
const session = require("express-session");

const SequelizeStore = require("connect-session-sequelize")(session.Store)
const sequelize_store = new SequelizeStore({db: sequelize})
sequelize_store.sync()

const session_options = {
    store: sequelize_store,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,
        sameSite: 'none'
    }
}

module.exports = session(session_options)