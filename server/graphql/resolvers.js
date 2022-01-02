const {prisma} = require("../services/prisma");

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
        }
    }
}
