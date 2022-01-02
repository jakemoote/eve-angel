const {requireAuth} = require("../middleware/auth")
const {prisma} = require("../services/prisma")
const {getCharacterWithUpdatedToken} = require("../services/eve-character-token-manager")
const axios = require("axios")
const express = require("express")
const router = express.Router()

router.get('/update', requireAuth, async (req, res) => {
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

module.exports = router