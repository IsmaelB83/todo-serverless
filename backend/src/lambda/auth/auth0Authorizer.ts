// Node modules
import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'
import { verify } from 'jsonwebtoken'
import Axios from 'axios'
// Own modules
import { createLogger } from '../../utils/logger'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

// URL to download a certificate that can be used to verify JWT token signature (Auth0 -> Show Advanced Settings -> Endpoints -> JSON Web Key Set)
const jwksUrl = 'https://dev-wbbbogs3.us.auth0.com/.well-known/jwks.json'

/**
 * Handler to authorize request
 */
export const handler = async ( event: CustomAuthorizerEvent): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)
    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })
    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

/**
 * Method to verify token signature and validity
 * @param authHeader Authentication header
 * @returns Promise that returns a JwtPayload object when resolved
 */
async function verifyToken(authHeader: string): Promise<JwtPayload> {
    // Download certificate
    const response = await Axios.get(jwksUrl);
    const pemData = response['data']['keys'][0]['x5c'][0];
    const cert = `-----BEGIN CERTIFICATE-----\n${pemData}\n-----END CERTIFICATE-----`;
    console.log(cert);
    // Verify token against cert
    const token = getToken(authHeader);
    return verify(token, cert, { algorithms: ['RS256'] }) as JwtPayload
}

function getToken(authHeader: string): string {
  // Check auth headers
  if (!authHeader) throw new Error('No authentication header')
  if (!authHeader.toLowerCase().startsWith('bearer ')) throw new Error('Invalid authentication header')
  // Split auth header ('bearer xxx') and return token ('xxx') 
  const split = authHeader.split(' ')
  const token = split[1]
  logger.info('Token split: ', token);
  return token
}
