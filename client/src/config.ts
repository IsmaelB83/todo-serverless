// TODO: Once your application is deployed, copy an API id here so that the frontend could interact with it
const apiId = 'wi0vuhdi9h'
export const apiEndpoint = `https://${apiId}.execute-api.us-east-1.amazonaws.com/dev`

export const authConfig = {
  // (DONE): Create an Auth0 application and copy values from it into this map. For example:
  domain: 'dev-wbbbogs3.us.auth0.com',              // Auth0 domain
  clientId: 'yIKjkEIUrCZ70Pw0zYXl3QkHTdMyLHmA',     // Auth0 client id
  callbackUrl: 'http://localhost:3000/callback'     // Callback url in frontend
}
