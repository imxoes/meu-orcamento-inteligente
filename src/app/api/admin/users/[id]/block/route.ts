import { NextResponse } from 'next/server'
import { requireAdminAuth, logAdminAction } from '@/middleware/admin'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdminAuth(request)
    const { reason } = await request.json()

    const userId = params.id

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId, role: 'USER' },
      select: {
        id: true,
        name: true,
        email: true,
        isBlocked: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    if (user.isBlocked) {
      return NextResponse.json(
        { error: 'Usuário já está bloqueado' },
        { status: 400 }
      )
    }

    // Bloquear usuário
    await prisma.user.update({
      where: { id: userId },
      data: {
        isBlocked: true,
        blockedAt: new Date(),
        blockedBy: admin.id,
        blockedReason: reason || 'Sem motivo especificado'
      }
    })

    // Log da ação
    await logAdminAction(
      admin.id,
      'BLOCK_USER',
      `Usuário ${user.name} (${user.email}) foi bloqueado`,
      userId,
      { reason },
      request
    )

    return NextResponse.json({
      success: true,
      message: 'Usuário bloqueado com sucesso'
    })

  } catch (error: any) {
    console.error('Erro ao bloquear usuário:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: error.message === 'Acesso negado: autenticação de admin requerida' ? 401 : 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdminAuth(request)
    const userId = params.id

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId, role: 'USER' },
      select: {
        id: true,
        name: true,
        email: true,
        isBlocked: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    if (!user.isBlocked) {
      return NextResponse.json(
        { error: 'Usuário não está bloqueado' },
        { status: 400 }
      )
    }

    // Desbloquear usuário
    await prisma.user.update({
      where: { id: userId },
      data: {
        isBlocked: false,
        blockedAt: null,
        blockedBy: null,
        blockedReason: null
      }
    })

    // Log da ação
    await logAdminAction(
      admin.id,
      'UNBLOCK_USER',
      `Usuário ${user.name} (${user.email}) foi desbloqueado`,
      userId,
      {},
      request
    )

    return NextResponse.json({
      success: true,
      message: 'Usuário desbloqueado com sucesso'
    })

  } catch (error: any) {
    console.error('Erro ao desbloquear usuário:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: error.message === 'Acesso negado: autenticação de admin requerida' ? 401 : 500 }
    )
  }
}