const requireAuth = (req, res, next) => {
    if (!req.session.is_authenticated) {
        return res.status(401).json({error: 'Unauthorized'})
    }

    next()
}

module.exports = { requireAuth }