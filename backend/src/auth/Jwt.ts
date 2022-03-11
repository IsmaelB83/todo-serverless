// Node modules
import { JwtHeader } from 'jsonwebtoken'
// Own modules
import { JwtPayload } from './JwtPayload'

// Interface representing a JWT token
export interface Jwt {
  header: JwtHeader
  payload: JwtPayload
}
