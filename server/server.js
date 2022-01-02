require('dotenv').config()

const { ApolloServer } = require('apollo-server-express')
const express = require('express')
const cors = require('cors')
const app = express()
const http = require('http')
const port = process.env.PORT ?? 80
const http_server = http.createServer(app)
const { Server } = require('socket.io')

const session = require('./session')
app.use(session)

const corsOptions = {
    origin: 'https://eve-angelx.localhost',
    credentials: true,
}
app.use(cors(corsOptions))

app.set('trust proxy', 1)

BigInt.prototype.toJSON = function() {
    return this.toString()
}

const routes = require('./routes/index')
const {prisma} = require("./services/prisma");
app.use('/', routes)

const io = new Server(http_server, {cors: corsOptions})

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
    socket.on('ping', (msg) => {
        console.debug('Socket received: ', msg)
        const data = {status: 'ok', msg: 'pong'}
        console.debug('Socket sending: ', data)
        io.to(socket.id).emit('pong', data)
    })
});

app.get('/socket/test', (req, res) => {
    const data = {status: 'ok', msg: 'pong'}
    console.debug('Socket sending: ', data)
    io.to(req.session.user_id).emit('pong', data)
    res.json({"status": "ok"})
})

const { loadSchema} = require('@graphql-tools/load')
const { GraphQLFileLoader } = require('@graphql-tools/graphql-file-loader')

async function startApolloServer() {
    const typeDefs = await loadSchema('./graphql/schema.graphql', {
        loaders: [new GraphQLFileLoader()]
    })

    const resolvers = require('./graphql/resolvers')

    const apollo_server = new ApolloServer({
        typeDefs,
        resolvers,
        context: ({req, res}) => {
            if (!req.session.is_authenticated) throw new Error('Auth required')
            return {req, res}
        }
    });
    await apollo_server.start();
    apollo_server.applyMiddleware({ app, cors: corsOptions });
    await new Promise(resolve => http_server.listen({ port }, resolve));
    console.log(`Server listening on port ${port}`)
    console.debug(`graphql endpoint: ${apollo_server.graphqlPath}`)
}
startApolloServer()
