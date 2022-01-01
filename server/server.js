require('dotenv').config()

const { ApolloServer } = require('apollo-server-express')
const { ApolloServerPluginDrainHttpServer } = require('apollo-server-core')

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

const typeDefs = `
  type Asset {
    id: String
  }
  type Query {
    allAssets: [Asset!]!
  }
`;
const resolvers = {
    Query: {
        allAssets: async () => {
            return await prisma.asset.findMany({})
        }
    }
}

async function startApolloServer(typeDefs, resolvers) {
    const apollo_server = new ApolloServer({
        typeDefs,
        resolvers,
    });
    await apollo_server.start();
    apollo_server.applyMiddleware({ app });
    await new Promise(resolve => http_server.listen({ port }, resolve));
    console.log(`Server listening on port ${port}`)
    console.debug(`grpahql path: ${apollo_server.graphqlPath}`)
}
startApolloServer(typeDefs, resolvers)

// http_server.listen(port, () => {
//     console.debug(`Server started on port: ${port}`)
// })