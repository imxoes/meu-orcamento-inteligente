import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ message: 'Token not found' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    const userId = decoded.userId

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // Return only the fields we need (role may not exist in old databases)
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      emoji: user.emoji,
      telegramId: user.telegramId,
      role: (user as any).role || 'USER',
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt
    }

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ message: 'Token not found' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    const userId = decoded.userId

    const { name, telegramId, emoji } = await request.json()

    // Preparar dados para atualização
    const updateData: any = {}
    
    if (name !== undefined) {
      if (!name || name.trim().length < 2) {
        return NextResponse.json({ message: 'Nome deve ter pelo menos 2 caracteres' }, { status: 400 })
      }
      updateData.name = name.trim()
    }
    
    if (telegramId !== undefined) {
      updateData.telegramId = telegramId || null
    }

    if (emoji !== undefined) {
      updateData.emoji = emoji || '😊'
    }

    // Se não há nada para atualizar
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'Nenhum dado para atualizar' }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        emoji: true,
        telegramId: true,
        role: true,
        lastLoginAt: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      message: 'Perfil atualizado com sucesso',
      user: updatedUserData
    })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 })
  }
}