// Node modules
import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import { verify } from 'jsonwebtoken'
import 'source-map-support/register'
import Axios from 'axios'
// Own modules
import { createLogger } from '../../utils/logger'
import { JwtPayload } from '../../auth/JwtPayload'

// Constants
const LOGGER = createLogger('auth')
const JWKSURL = process.env.JWKSURL!

/**
 * Handler to authorize request
 */
export const handler = async ( event: CustomAuthorizerEvent): Promise<CustomAuthorizerResult> => {
  LOGGER.info('Authorizing a user', event.authorizationToken)
  try {
    // Constants
    const jwtToken = await verifyToken(event.authorizationToken)
    LOGGER.info('User was authorized', jwtToken)
    // Return OK
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
    // Log
    LOGGER.error('User not authorized', { error: e.message })
    // Return KO
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
    const response = await Axios.get(JWKSURL);
    const pemData = response['data']['keys'][0]['x5c'][0];
    const cert = `-----BEGIN CERTIFICATE-----\n${pemData}\n-----END CERTIFICATE-----`;
    console.log(cert);
    // Verify token against cert
    const token = getToken(authHeader);
    return verify(token, cert, { algorithms: ['RS256'] }) as JwtPayload
}

/**
 * Obtain bearer token from auth header
 * @param authHeader Authentication header
 * @returns JWT Token
 */
function getToken(authHeader: string): string {
  // Check auth headers
  if (!authHeader) throw new Error('No authentication header')
  if (!authHeader.toLowerCase().startsWith('bearer ')) throw new Error('Invalid authentication header')
  // Split auth header ('bearer xxx') and return token ('xxx') 
  const split = authHeader.split(' ')
  const token = split[1]
  LOGGER.info('Token split: ', token);
  return token
}
