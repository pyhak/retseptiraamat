import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const client = new ApolloClient({
  uri: 'http://localhost:4000/', // Sinu GraphQL serveri aadress
  cache: new InMemoryCache()
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </React.StrictMode>
);