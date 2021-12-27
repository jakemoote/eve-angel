require('dotenv').config()

const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.PORT ?? 80

const session = require('./session')
app.use(session)

corsOptions = {
    origin: 'https://eve-angelx.localhost',
    credentials: true,
}
app.use(cors(corsOptions))

app.set('trust proxy', 1)

const index_routes = require('./routes/index');
app.use('/', index_routes)

app.listen(port, () => {
    console.debug(`Server started on port: ${port}`)
})