import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth-utils'
import PDFDocument from 'pdfkit'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const decoded = await verifyToken(token)
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const userId = decoded.userId
    const { searchParams } = new URL(request.url)
    
    // Filtros opcionais (mesmos da consulta)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const categoryId = searchParams.get('categoryId')
    const type = searchParams.get('type')
    const minAmount = searchParams.get('minAmount')
    const maxAmount = searchParams.get('maxAmount')

    // Construir filtros (mesma lógica da rota GET)
    const where: any = { userId }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        const [year, month, day] = startDate.split('-').map(Number)
        const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
        where.date.gte = start
      }
      if (endDate) {
        const [year, month, day] = endDate.split('-').map(Number)
        const end = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))
        where.date.lte = end
      }
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (type && (type === 'INCOME' || type === 'EXPENSE')) {
      where.type = type
    }

    if (minAmount || maxAmount) {
      where.amount = {}
      if (minAmount) {
        where.amount.gte = parseFloat(minAmount)
      }
      if (maxAmount) {
        where.amount.lte = parseFloat(maxAmount)
      }
    }

    // Buscar transações
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: {
          select: { name: true }
        }
      },
      orderBy: { date: 'desc' }
    })

    // Buscar dados do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true }
    })

    // Calcular totais
    const totalIncome = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpenses = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)

    const balance = totalIncome - totalExpenses

    // Criar PDF usando stream
    const chunks: Buffer[] = []
    
    const doc = new PDFDocument({ margin: 50, size: 'A4' })

    doc.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })

    // Cabeçalho
    doc.fontSize(20).text('Relatório de Transações', { align: 'center' })
    doc.moveDown()
    
    if (user) {
      doc.fontSize(12).text(`Cliente: ${user.name}`, { align: 'left' })
      doc.text(`Email: ${user.email}`, { align: 'left' })
      doc.moveDown()
    }

    // Informações do período
    if (startDate || endDate) {
      doc.fontSize(12).text('Período:', { align: 'left' })
      if (startDate && endDate) {
        doc.text(`${new Date(startDate).toLocaleDateString('pt-BR')} até ${new Date(endDate).toLocaleDateString('pt-BR')}`, { align: 'left' })
      } else if (startDate) {
        doc.text(`A partir de ${new Date(startDate).toLocaleDateString('pt-BR')}`, { align: 'left' })
      } else if (endDate) {
        doc.text(`Até ${new Date(endDate).toLocaleDateString('pt-BR')}`, { align: 'left' })
      }
      doc.moveDown()
    }

    // Resumo
    doc.fontSize(14).text('Resumo', { align: 'left', underline: true })
    doc.moveDown(0.5)
    doc.fontSize(11)
    doc.text(`Total de Receitas: R$ ${totalIncome.toFixed(2)}`, { align: 'left' })
    doc.text(`Total de Gastos: R$ ${totalExpenses.toFixed(2)}`, { align: 'left' })
    doc.text(`Saldo: R$ ${balance.toFixed(2)}`, { align: 'left' })
    doc.text(`Total de Transações: ${transactions.length}`, { align: 'left' })
    doc.moveDown()

    // Tabela de transações
    if (transactions.length > 0) {
      doc.fontSize(14).text('Transações', { align: 'left', underline: true })
      doc.moveDown(0.5)

      // Cabeçalho da tabela
      let currentY = doc.y
      const rowHeight = 20
      
      doc.fontSize(10).font('Helvetica-Bold')
      doc.text('Data', 50, currentY)
      doc.text('Descrição', 130, currentY)
      doc.text('Categoria', 280, currentY)
      doc.text('Tipo', 380, currentY)
      doc.text('Valor', 460, currentY, { width: 100, align: 'right' })
      
      currentY += rowHeight
      doc.moveTo(50, currentY).lineTo(550, currentY).stroke()
      currentY += 5

      // Linhas da tabela
      doc.font('Helvetica').fontSize(9)
      transactions.forEach((transaction, index) => {
        if (currentY > 700) {
          doc.addPage()
          currentY = 50
        }

        const date = new Date(transaction.date).toLocaleDateString('pt-BR')
        const description = transaction.description.length > 30 
          ? transaction.description.substring(0, 27) + '...' 
          : transaction.description
        const category = transaction.category.name
        const typeText = transaction.type === 'INCOME' ? 'Receita' : 'Gasto'
        const amount = `R$ ${transaction.amount.toFixed(2)}`

        doc.fillColor('#000000')
        doc.text(date, 50, currentY)
        doc.text(description, 130, currentY, { width: 150 })
        doc.text(category, 280, currentY, { width: 100 })
        doc.text(typeText, 380, currentY, { width: 80 })
        doc.fillColor(transaction.type === 'INCOME' ? '#10B981' : '#EF4444')
        doc.text(amount, 460, currentY, { width: 100, align: 'right' })
        doc.fillColor('#000000')

        currentY += rowHeight
        
        if (index < transactions.length - 1) {
          doc.moveTo(50, currentY).lineTo(550, currentY).stroke()
          currentY += 2
        }
      })
    } else {
      doc.fontSize(12).text('Nenhuma transação encontrada no período selecionado.', { align: 'center' })
    }

    // Rodapé
    const totalPages = doc.bufferedPageRange().count
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i)
      doc.fontSize(8)
        .fillColor('#666666')
        .text(
          `Página ${i + 1} de ${totalPages} | Gerado em ${new Date().toLocaleString('pt-BR')}`,
          50,
          doc.page.height - 30,
          { align: 'center' }
        )
    }

    doc.end()

    // Aguardar o PDF ser gerado completamente
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks))
      })
      doc.on('error', reject)
    })

    // Converter Buffer para Uint8Array para NextResponse
    const pdfArray = new Uint8Array(pdfBuffer)

    // Retornar PDF
    return new NextResponse(pdfArray, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="transacoes-${new Date().toISOString().split('T')[0]}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar PDF' },
      { status: 500 }
    )
  }
}

