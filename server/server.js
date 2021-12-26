require('dotenv').config()

const express = require('express')
const app = express()
const port = 80

const session = require('./session')

// if (app.get('env') === 'production') {
//     app.set('trust proxy', 1) // trust first proxy
//     sess.cookie.secure = true // serve secure cookies
// }

app.use(session)

const index_routes = require('./routes/index');
app.use('/', index_routes)

app.listen(port, () => {
    console.debug(`Listening at http://localhost:${port}`)
})