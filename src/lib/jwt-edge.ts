import { jwtVerify } from 'jose'

// JWT verification for Edge Runtime (without Prisma dependencies)
export async function verifyJWTEdge(token: string): Promise<{ userId: string; sessionId: string } | null> {
  try {
    const JWT_SECRET = process.env.JWT_SECRET
    if (!JWT_SECRET) {
      return null
    }

    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)

    return {
      userId: payload.userId as string,
      sessionId: payload.sessionId as string
    }
  } catch (error) {
    return null
  }
}