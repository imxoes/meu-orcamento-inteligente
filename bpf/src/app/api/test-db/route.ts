import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('🔍 Testing database connection...')
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL)
    
    // Try to count users
    const userCount = await prisma.user.count()
    console.log('✅ User count:', userCount)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connected!',
      userCount,
      databaseUrlExists: !!process.env.DATABASE_URL
    })
  } catch (error: any) {
    console.error('❌ Database test error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error?.message,
      name: error?.name,
      databaseUrlExists: !!process.env.DATABASE_URL
    }, { status: 500 })
  }
}

