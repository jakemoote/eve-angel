const session = require("express-session");

const { PrismaClient } = require('./prisma/generated/eve-angel-client')
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');
const prisma = new PrismaClient()
const prisma_store = new PrismaSessionStore(prisma, {
    checkPeriod: 10 * 60 * 1000,
    dbRecordIdIsSessionId: true,
    dbRecordIdFunction: undefined,
})

const session_options = {
    store: prisma_store,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,
        sameSite: 'none'
    }
}

module.exports = session(session_options)