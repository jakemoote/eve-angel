const {prisma, sde_prisma} = require("../services/prisma");

module.exports = {
    Query: {
        assets: async (parent, args, context, info) => {
            return await prisma.asset.findMany({
                where: {
                    character: {
                        user_id: context.req.session.user_id
                    }
                }
            })
        }
    },
    Asset: {
        character: async (asset) => {
            // prisma automatically batches findUnique so n+1 is not a problem here, no need to use dataloader pattern
            const character = await prisma.character.findUnique({where: {character_id: asset.character_id}})
            return character
        },
        type: async (asset) => {
            const type = await sde_prisma.invTypes.findUnique({where: {typeID: asset.type_id}})
            return type
        },
        station: async (asset) => {
            if (asset.location_type !== 'station')
                return null

            const station = await sde_prisma.staStations.findUnique({where: {stationID: asset.location_id}})
            return station
        }
    },
    AssetType: {
        market_price: async (asset_type) => {
            const market_price = await prisma.marketPrice.findUnique({where: {type_id: asset_type.typeID}})
            return market_price
        }
    }
}
