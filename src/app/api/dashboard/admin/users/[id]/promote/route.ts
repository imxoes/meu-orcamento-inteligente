import { NextResponse } from 'next/server'
import { requireDashboardAdminAuth, logAdminAction } from '@/middleware/dashboard-admin'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireDashboardAdminAuth(request)
    const userId = params.id

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    if (user.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Usuário já é admin' },
        { status: 400 }
      )
    }

    // Promover usuário para admin
    await prisma.user.update({
      where: { id: userId },
      data: {
        role: 'ADMIN'
      }
    })

    // Log da ação
    await logAdminAction(
      admin.id,
      'PROMOTE_TO_ADMIN',
      `Usuário ${user.name} (${user.email}) foi promovido para ADMIN`,
      userId,
      {
        previousRole: user.role,
        newRole: 'ADMIN'
      },
      request
    )

    return NextResponse.json({
      success: true,
      message: 'Usuário promovido para admin com sucesso'
    })

  } catch (error: any) {
    console.error('Erro ao promover usuário para admin:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: error.message === 'Acesso negado: permissões de admin requeridas' ? 403 : 500 }
    )
  }
}

// Rebaixar de admin para usuário
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireDashboardAdminAuth(request)
    const userId = params.id

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Usuário não é admin' },
        { status: 400 }
      )
    }

    // Impedir que o admin rebaixe a si mesmo
    if (user.id === admin.id) {
      return NextResponse.json(
        { error: 'Você não pode rebaixar sua própria conta' },
        { status: 400 }
      )
    }

    // Rebaixar admin para usuário
    await prisma.user.update({
      where: { id: userId },
      data: {
        role: 'USER'
      }
    })

    // Log da ação
    await logAdminAction(
      admin.id,
      'DEMOTE_FROM_ADMIN',
      `Usuário ${user.name} (${user.email}) foi rebaixado de ADMIN para USER`,
      userId,
      {
        previousRole: user.role,
        newRole: 'USER'
      },
      request
    )

    return NextResponse.json({
      success: true,
      message: 'Admin rebaixado para usuário com sucesso'
    })

  } catch (error: any) {
    console.error('Erro ao rebaixar admin:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: error.message === 'Acesso negado: permissões de admin requeridas' ? 403 : 500 }
    )
  }
}