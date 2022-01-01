const { PrismaClient } = require('../prisma/generated/eve-angel-client')
const { PrismaClient: SDEPrismaClient } = require('../prisma/generated/eve-sde-client')

const prisma = new PrismaClient({
    log: ['query']
})

const sde_prisma = new SDEPrismaClient({
    log: ['query']
})

module.exports = {prisma, sde_prisma}