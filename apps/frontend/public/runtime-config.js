// This file is meant to be edited at container runtime to configure the SPA
// Example contents you can place here (no quotes needed around keys):
// window.__RUNTIME_CONFIG__ = { GRAPHQL_URI: 'https://api.example.com/graphql' };

// Provide a safe default to avoid runtime errors if the file isn't edited.
window.__RUNTIME_CONFIG__ = window.__RUNTIME_CONFIG__ || { GRAPHQL_URI: 'http://localhost:3020/graphql' };
