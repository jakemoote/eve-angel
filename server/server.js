require('dotenv').config()

const express = require('express')
const cors = require('cors')
const app = express()
const http = require('http')
const port = process.env.PORT ?? 80
const server = http.createServer(app)
const { Server } = require('socket.io')

const session = require('./session')
app.use(session)

corsOptions = {
    origin: 'https://eve-angelx.localhost',
    credentials: true,
}
app.use(cors(corsOptions))

app.set('trust proxy', 1)

BigInt.prototype.toJSON = function() {
    return this.toString()
}

const index_routes = require('./routes/index');
app.use('/', index_routes)

const io = new Server(server, {cors: corsOptions})

io.use((socket, next) => {
    session(socket.request, {}, next);
})

io.on('connection', (socket) => {
    console.log('socket connect');
    const session = socket.request.session
    socket.join(session.user_id)

    socket.on('disconnect', () => {
        console.log('socket disconnect');
    })
    socket.on('test', (msg) => {
        console.debug('socket test')
        console.debug(msg)
    })
});

app.get('/socket/test', (req, res) => {
    io.to(req.session.user_id).emit('test', {'status': 'ok'})
    res.json({"status": "ok"})
})

server.listen(port, () => {
    console.debug(`Server started on port: ${port}`)
})