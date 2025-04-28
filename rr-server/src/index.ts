import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { typeDefs } from './graphql/typeDefs';
import { resolvers } from './graphql/resolvers';

async function startServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 }
  });

  console.log(`🚀 Server töötab aadressil: ${url}`);
}

startServer().catch((error) => {
  console.error('💥 Serveri käivitamisel tekkis viga:', error);

  process.exit(1);
});
