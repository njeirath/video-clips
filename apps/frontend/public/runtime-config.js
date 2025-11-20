// This file is meant to be edited at container runtime to configure the SPA
// Example contents you can place here (no quotes needed around keys):
// window.__RUNTIME_CONFIG__ = { GRAPHQL_URI: 'https://api.example.com/graphql' };

// Provide a safe default to avoid runtime errors if the file isn't edited.
window.__RUNTIME_CONFIG__ = window.__RUNTIME_CONFIG__ || {
	GRAPHQL_URI: 'http://localhost:3020/graphql',
	// Cognito defaults (can be overridden at container/runtime config)
	COGNITO_USER_POOL_ID: 'us-east-2_CV9d0tKnO',
	COGNITO_USER_POOL_CLIENT_ID: '4lk87f6cg3o2dr9sbsldkv8ntq',
	// Optional region override
	COGNITO_REGION: 'us-east-2',
};
