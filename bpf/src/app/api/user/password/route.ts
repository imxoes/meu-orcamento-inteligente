import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { verifyToken } from '@/lib/auth-utils'

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ message: 'Token not found' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    const userId = decoded.userId

    const { currentPassword, newPassword, confirmPassword } = await request.json()

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ message: 'Todos os campos são obrigatórios' }, { status: 400 })
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ message: 'Nova senha e confirmação não coincidem' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ message: 'Nova senha deve ter pelo menos 6 caracteres' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 })
    }

    const validCurrentPassword = await bcrypt.compare(currentPassword, user.password)
    if (!validCurrentPassword) {
      return NextResponse.json({ message: 'Senha atual incorreta' }, { status: 401 })
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    })

    return NextResponse.json({ message: 'Senha alterada com sucesso' })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 })
  }
}