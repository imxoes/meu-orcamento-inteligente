import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth-utils'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 })
    }

    const body = await request.json()
    const { password, confirmation } = body

    // Verificar se a confirmação foi escrita corretamente
    if (confirmation !== 'EXCLUIR MINHA CONTA') {
      return NextResponse.json({ 
        message: 'Digite "EXCLUIR MINHA CONTA" para confirmar' 
      }, { status: 400 })
    }

    // Verificar senha
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 })
    }

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return NextResponse.json({ message: 'Senha incorreta' }, { status: 401 })
    }

    // Deletar todos os dados do usuário (em cascata já configurado no schema)
    // Mas vamos ser explícitos para garantir
    await prisma.$transaction([
      prisma.transaction.deleteMany({ where: { userId: decoded.userId } }),
      prisma.goal.deleteMany({ where: { userId: decoded.userId } }),
      prisma.investment.deleteMany({ where: { userId: decoded.userId } }),
      prisma.session.deleteMany({ where: { userId: decoded.userId } }),
      prisma.passwordReset.deleteMany({ where: { userId: decoded.userId } }),
      prisma.userSettings.deleteMany({ where: { userId: decoded.userId } }),
      prisma.telegramAlertSettings.deleteMany({ where: { userId: decoded.userId } }),
      prisma.user.delete({ where: { id: decoded.userId } })
    ])

    // Limpar cookie de autenticação
    const response = NextResponse.json({ 
      message: 'Conta excluída com sucesso. Lamentamos ver você partir.' 
    })
    
    response.cookies.delete('token')
    
    return response

  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json({ message: 'Erro ao excluir conta' }, { status: 500 })
  }
}

