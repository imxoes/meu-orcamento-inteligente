import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('Email simulation - SMTP not configured:', options)
      return true // Simular sucesso em desenvolvimento
    }

    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Meu Orçamento Inteligente'}" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    })

    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

export async function sendVerificationEmail(email: string, token: string): Promise<boolean> {
  const verificationUrl = `https://useorbi.app/auth/verify-email?token=${token}`

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirme seu email</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #000;
        }
        .container {
          background: linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%);
          border: 1px solid #3b82f6;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .content {
          color: #e5e7eb;
          text-align: center;
        }
        .btn {
          display: inline-block;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin: 20px 0;
          transition: transform 0.2s;
        }
        .btn:hover {
          transform: translateY(-1px);
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #374151;
          text-align: center;
          color: #9ca3af;
          font-size: 14px;
        }
        .warning {
          background-color: rgba(251, 191, 36, 0.1);
          border: 1px solid #f59e0b;
          border-radius: 6px;
          padding: 15px;
          margin: 20px 0;
          color: #fbbf24;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Meu Orçamento Inteligente</div>
          <p style="color: #9ca3af; margin: 0;">Plataforma de Gestão Financeira Inteligente</p>
        </div>

        <div class="content">
          <h2 style="color: #3b82f6; margin-bottom: 20px;">Confirme seu endereço de email</h2>

          <p>Obrigado por se cadastrar! Para concluir o processo de criação da sua conta, precisamos confirmar seu endereço de email.</p>

          <p>Clique no botão abaixo para verificar sua conta:</p>

          <a href="${verificationUrl}" class="btn">Confirmar Email</a>

          <div class="warning">
            <strong>⚠️ Importante:</strong> Este link é válido por 24 horas. Se não confirmar dentro deste prazo, será necessário solicitar um novo link de verificação.
          </div>

          <p style="margin-top: 30px;">Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
          <p style="word-break: break-all; color: #3b82f6; font-size: 14px;">${verificationUrl}</p>
        </div>

        <div class="footer">
          <p>Se você não solicitou esta conta, ignore este email.</p>
          <p>Este é um email automático, não responda esta mensagem.</p>
          <p style="margin-top: 15px;">
            <strong>Meu Orçamento Inteligente</strong><br>
            Sua gestão financeira com inteligência artificial
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: '✨ Confirme seu email - Meu Orçamento Inteligente',
    html,
  })
}

export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  const dashboardUrl = `https://useorbi.app/dashboard`

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bem-vindo(a)!</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #000;
        }
        .container {
          background: linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%);
          border: 1px solid #3b82f6;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .content {
          color: #e5e7eb;
        }
        .btn {
          display: inline-block;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin: 20px 0;
          transition: transform 0.2s;
        }
        .features {
          background-color: rgba(59, 130, 246, 0.1);
          border: 1px solid #3b82f6;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .feature-item {
          margin: 10px 0;
          color: #e5e7eb;
        }
        .emoji {
          margin-right: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Meu Orçamento Inteligente</div>
          <p style="color: #9ca3af; margin: 0;">Bem-vindo(a) à sua jornada financeira inteligente!</p>
        </div>

        <div class="content">
          <h2 style="color: #3b82f6; margin-bottom: 20px;">Olá, ${name}! 🎉</h2>

          <p>Sua conta foi criada com sucesso! Agora você tem acesso à plataforma mais inteligente para gerenciar suas finanças pessoais.</p>

          <div class="features">
            <h3 style="color: #3b82f6; margin-top: 0;">O que você pode fazer agora:</h3>
            <div class="feature-item"><span class="emoji">💰</span> Registrar suas transações e organizar gastos</div>
            <div class="feature-item"><span class="emoji">🎯</span> Definir metas financeiras personalizadas</div>
            <div class="feature-item"><span class="emoji">🤖</span> Receber insights inteligentes da nossa IA</div>
            <div class="feature-item"><span class="emoji">📊</span> Visualizar relatórios detalhados do seu progresso</div>
            <div class="feature-item"><span class="emoji">💬</span> Usar nosso bot do Telegram para facilitar o uso</div>
            <div class="feature-item"><span class="emoji">🔒</span> Manter seus dados 100% privados e seguros</div>
          </div>

          <div style="text-align: center;">
            <a href="${dashboardUrl}" class="btn">Acessar Dashboard</a>
          </div>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #374151; text-align: center; color: #9ca3af; font-size: 14px;">
          <p>Dúvidas? Explore a plataforma ou entre em contato conosco.</p>
          <p>
            <strong>Meu Orçamento Inteligente</strong><br>
            Transformando vidas através da inteligência financeira
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: '🚀 Bem-vindo(a) ao Meu Orçamento Inteligente!',
    html,
  })
}