import bcrypt from 'bcryptjs'
import { randomBytes, createHash } from 'crypto'
import { SignJWT, jwtVerify } from 'jose'
import { NextRequest } from 'next/server'
import { prisma } from './prisma'

// Security configurations
const SALT_ROUNDS = 12
const JWT_SECRET = process.env.JWT_SECRET || '2fRQzpylv3A01WBkmB+Aj9ql2/RCbU6e4gL5vGRP5GtQQ292XJQY03hIzRGVI3T6uv6Ywg6KCgD///20wqkEhQ=='
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

// JWT secret as Uint8Array for jose
const getJWTSecret = () => new TextEncoder().encode(JWT_SECRET)

// Password hashing utilities
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// JWT utilities using jose for Edge Runtime compatibility
export async function generateJWT(userId: string, sessionId: string): Promise<string> {
  const token = await new SignJWT({ userId, sessionId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + SESSION_DURATION) / 1000))
    .sign(getJWTSecret())

  return token
}

export async function verifyJWT(token: string): Promise<{ userId: string; sessionId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJWTSecret())

    return {
      userId: payload.userId as string,
      sessionId: payload.sessionId as string
    }
  } catch (error) {
    return null
  }
}

// Token generation utilities
export function generateSecureToken(): string {
  return randomBytes(32).toString('hex')
}

export function generateEmailVerificationToken(): string {
  return randomBytes(32).toString('hex')
}

export function generatePasswordResetToken(): string {
  return randomBytes(32).toString('hex')
}

// Session management
export async function createSession(
  userId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<{ sessionId: string; token: string }> {
  const sessionId = generateSecureToken()
  const expiresAt = new Date(Date.now() + SESSION_DURATION)

  await prisma.session.create({
    data: {
      id: sessionId,
      userId,
      token: generateSecureToken(),
      expiresAt,
      userAgent,
      ipAddress
    }
  })

  const token = await generateJWT(userId, sessionId)

  return { sessionId, token }
}

export async function validateSession(token: string): Promise<{
  isValid: boolean;
  userId?: string;
  sessionId?: string;
}> {
  const decoded = await verifyJWT(token)
  if (!decoded) {
    return { isValid: false }
  }

  const session = await prisma.session.findUnique({
    where: { id: decoded.sessionId },
    include: { user: true }
  })

  if (!session || session.expiresAt < new Date() || !session.user.isActive) {
    return { isValid: false }
  }

  return {
    isValid: true,
    userId: decoded.userId,
    sessionId: decoded.sessionId
  }
}

export async function invalidateSession(sessionId: string): Promise<void> {
  await prisma.session.delete({
    where: { id: sessionId }
  })
}

export async function invalidateAllUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { userId }
  })
}

// Cleanup expired sessions
export async function cleanupExpiredSessions(): Promise<void> {
  await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date()
      }
    }
  })
}

// Input validation utilities
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 320
}

export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('A senha deve ter pelo menos 8 caracteres')
  }

  if (password.length > 128) {
    errors.push('A senha deve ter no máximo 128 caracteres')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra minúscula')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra maiúscula')
  }

  if (!/\d/.test(password)) {
    errors.push('A senha deve conter pelo menos um número')
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('A senha deve conter pelo menos um caractere especial')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function sanitizeInput(input: string): string {
  return input.trim().substring(0, 1000) // Limit input length
}

export function sanitizeName(name: string): string {
  return name.trim().replace(/[<>]/g, '').substring(0, 100)
}

// Rate limiting utilities (in-memory store for simplicity, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Cleanup expired entries periodically
function cleanupRateLimitStore() {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// Clear rate limit for a specific key (useful for testing/debugging)
export function clearRateLimit(key: string): void {
  rateLimitStore.delete(key)
}

// Clear all rate limits (useful for testing/debugging)
export function clearAllRateLimits(): void {
  rateLimitStore.clear()
}

export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remainingAttempts: number; resetTime: number } {
  const now = Date.now()
  
  // Cleanup expired entries before checking
  cleanupRateLimitStore()
  
  const record = rateLimitStore.get(key)

  if (!record || now > record.resetTime) {
    // New window or expired
    const newRecord = { count: 1, resetTime: now + windowMs }
    rateLimitStore.set(key, newRecord)
    return {
      allowed: true,
      remainingAttempts: maxAttempts - 1,
      resetTime: newRecord.resetTime
    }
  }

  if (record.count >= maxAttempts) {
    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: record.resetTime
    }
  }

  record.count++
  rateLimitStore.set(key, record)

  return {
    allowed: true,
    remainingAttempts: maxAttempts - record.count,
    resetTime: record.resetTime
  }
}

// Cleanup rate limit store (called manually instead of setInterval for serverless compatibility)
function cleanupRateLimitStore() {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// CSRF token utilities
export function generateCSRFToken(): string {
  return randomBytes(32).toString('hex')
}

export function validateCSRFToken(token: string, sessionToken: string): boolean {
  // Simple CSRF validation - in production you might want more sophisticated validation
  const hash = createHash('sha256')
  hash.update(sessionToken + JWT_SECRET)
  const expectedToken = hash.digest('hex')

  return token === expectedToken
}

// Email verification
export async function createEmailVerification(userId: string): Promise<string> {
  const token = generateEmailVerificationToken()

  await prisma.user.update({
    where: { id: userId },
    data: { emailVerificationToken: token }
  })

  return token
}

export async function verifyEmailToken(token: string): Promise<{ success: boolean; userId?: string }> {
  const user = await prisma.user.findUnique({
    where: { emailVerificationToken: token }
  })

  if (!user) {
    return { success: false }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      emailVerificationToken: null
    }
  })

  return { success: true, userId: user.id }
}

// Password reset
export async function createPasswordReset(email: string): Promise<{ success: boolean; token?: string }> {
  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user || !user.isActive) {
    return { success: false }
  }

  const token = generatePasswordResetToken()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      token,
      expiresAt
    }
  })

  return { success: true, token }
}

export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean; errors?: string[] }> {
  const passwordValidation = validatePassword(newPassword)
  if (!passwordValidation.isValid) {
    return { success: false, errors: passwordValidation.errors }
  }

  const resetRecord = await prisma.passwordReset.findUnique({
    where: { token },
    include: { user: true }
  })

  if (!resetRecord || resetRecord.used || resetRecord.expiresAt < new Date()) {
    return { success: false, errors: ['Token inválido ou expirado'] }
  }

  const hashedPassword = await hashPassword(newPassword)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetRecord.userId },
      data: { password: hashedPassword }
    }),
    prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { used: true }
    }),
    // Invalidate all existing sessions for security
    prisma.session.deleteMany({
      where: { userId: resetRecord.userId }
    })
  ])

  return { success: true }
}

// Rate limiter function for login attempts
export async function rateLimiter(request: any): Promise<{ success: boolean; message?: string }> {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const key = `login_${ip}`

  const rateLimit = checkRateLimit(key, 5, 15 * 60 * 1000) // 5 attempts per 15 minutes

  if (!rateLimit.allowed) {
    return {
      success: false,
      message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
    }
  }

  return { success: true }
}

// Create authentication token
export async function createToken(data: { userId: string }): Promise<string> {
  const session = await createSession(data.userId)
  return session.token
}

// Verify token function
export async function verifyToken(token: string): Promise<{ userId: string; sessionId: string }> {
  const validation = await validateSession(token)
  if (!validation.isValid || !validation.userId || !validation.sessionId) {
    throw new Error('Invalid token')
  }

  return {
    userId: validation.userId,
    sessionId: validation.sessionId
  }
}

// Get userId from request token (for API routes)
export async function getUserIdFromToken(request: NextRequest): Promise<string | null> {
  try {
    const token = request.cookies.get('token')?.value

    if (!token) {
      return null
    }

    const decoded = await verifyToken(token)
    return decoded.userId || null
  } catch (error) {
    return null
  }
}

// Get user from request (for API routes)
export async function getUserFromRequest(request: NextRequest): Promise<any | null> {
  try {
    const token = request.cookies.get('token')?.value

    if (!token) {
      return null
    }

    const decoded = await verifyToken(token)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        telegramId: true,
        isActive: true
      }
    })

    return user
  } catch (error) {
    return null
  }
}