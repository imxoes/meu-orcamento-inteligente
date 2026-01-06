import * as brevo from '@getbrevo/brevo'

// Initialize Brevo (Sendinblue) if API key is available
let brevoApi: brevo.TransactionalEmailsApi | null = null

if (process.env.BREVO_API_KEY) {
  brevoApi = new brevo.TransactionalEmailsApi()
  brevoApi.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY)
}

export async function sendVerificationEmail(
  email: string,
  verificationToken: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!brevoApi || !process.env.BREVO_API_KEY) {
      console.log('⚠️ BREVO_API_KEY não configurada, simulando envio de email')
      console.log(`📧 Email de verificação para: ${email}`)
      console.log(`🔗 Link: ${process.env.NEXTAUTH_URL || 'http://localhost:7007'}/auth/verify-email?token=${verificationToken}`)
      return { success: true }
    }

    const verificationUrl = `${process.env.NEXTAUTH_URL || 'https://useorbi.app'}/auth/verify-email?token=${verificationToken}`

    const sendSmtpEmail = new brevo.SendSmtpEmail()
    sendSmtpEmail.subject = 'Confirme seu email - Meu Orçamento Inteligente'
    sendSmtpEmail.htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirme seu email</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #000000; color: #ffffff;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold; background: linear-gradient(135deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
              Meu Orçamento Inteligente
            </h1>
          </div>

          <!-- Main Content -->
          <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(139, 92, 246, 0.05)); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 12px; padding: 32px; margin-bottom: 32px;">
            <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #ffffff;">
              Olá, ${name}!
            </h2>

            <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.5; color: #d4d4d8;">
              Obrigado por se cadastrar no <strong>Meu Orçamento Inteligente</strong>!
            </p>

            <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 1.5; color: #d4d4d8;">
              Para começar a usar nossa plataforma de controle financeiro com inteligência artificial, você precisa confirmar seu endereço de email.
            </p>

            <div style="text-align: center;">
              <a href="${verificationUrl}"
                 style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; transition: all 0.3s ease;">
                Confirmar Email
              </a>
            </div>
          </div>

          <!-- Alternative Link -->
          <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 20px; margin-bottom: 32px;">
            <p style="margin: 0 0 12px 0; font-size: 14px; color: #a1a1aa;">
              Se o botão não funcionar, copie e cole este link no seu navegador:
            </p>
            <p style="margin: 0; word-break: break-all;">
              <a href="${verificationUrl}" style="color: #3b82f6; text-decoration: none; font-size: 14px;">
                ${verificationUrl}
              </a>
            </p>
          </div>

          <!-- Security Note -->
          <div style="border-left: 3px solid #fbbf24; padding: 16px; background: rgba(251, 191, 36, 0.1); border-radius: 0 8px 8px 0; margin-bottom: 32px;">
            <p style="margin: 0; font-size: 14px; color: #fbbf24;">
              <strong>⚠️ Importante:</strong> Este link expira em 24 horas. Se você não solicitou este cadastro, pode ignorar este email.
            </p>
          </div>

          <!-- Footer -->
          <div style="text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 24px;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #71717a;">
              Meu Orçamento Inteligente
            </p>
            <p style="margin: 0; font-size: 12px; color: #52525b;">
              Controle financeiro pessoal com inteligência artificial
            </p>
          </div>
        </div>
      </body>
      </html>
    `
    sendSmtpEmail.textContent = `
      Olá, ${name}!

      Obrigado por se cadastrar no Meu Orçamento Inteligente!

      Para confirmar seu email, acesse este link:
      ${verificationUrl}

      Este link expira em 24 horas.

      Se você não solicitou este cadastro, pode ignorar este email.

      --
      Meu Orçamento Inteligente
      Controle financeiro pessoal com inteligência artificial
    `
    sendSmtpEmail.sender = { name: 'Meu Orçamento Inteligente', email: process.env.BREVO_SENDER_EMAIL || 'noreply@useorbi.app' }
    sendSmtpEmail.to = [{ email }]

    const data = await brevoApi.sendTransacEmail(sendSmtpEmail)

    console.log('✅ Email de verificação enviado:', data.body?.messageId || 'sucesso')
    return { success: true }

  } catch (error) {
    console.error('❌ Erro no sistema de email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!brevoApi || !process.env.BREVO_API_KEY) {
      console.log('⚠️ BREVO_API_KEY não configurada, simulando envio de email')
      console.log(`📧 Email de reset de senha para: ${email}`)
      console.log(`🔗 Link: ${process.env.NEXTAUTH_URL || 'http://localhost:7007'}/auth/reset-password?token=${resetToken}`)
      return { success: true }
    }

    const resetUrl = `${process.env.NEXTAUTH_URL || 'https://useorbi.app'}/auth/reset-password?token=${resetToken}`

    const sendSmtpEmail = new brevo.SendSmtpEmail()
    sendSmtpEmail.subject = 'Redefinir senha - Meu Orçamento Inteligente'
    sendSmtpEmail.htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Redefinir senha</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #000000; color: #ffffff;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold; background: linear-gradient(135deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
              Meu Orçamento Inteligente
            </h1>
          </div>

          <!-- Main Content -->
          <div style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(245, 101, 101, 0.05)); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 32px; margin-bottom: 32px;">
            <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #ffffff;">
              Redefinir senha
            </h2>

            <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.5; color: #d4d4d8;">
              Olá, ${name}! Recebemos uma solicitação para redefinir a senha da sua conta.
            </p>

            <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 1.5; color: #d4d4d8;">
              Clique no botão abaixo para criar uma nova senha:
            </p>

            <div style="text-align: center;">
              <a href="${resetUrl}"
                 style="display: inline-block; background: linear-gradient(135deg, #ef4444, #f56565); color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; transition: all 0.3s ease;">
                Redefinir Senha
              </a>
            </div>
          </div>

          <!-- Alternative Link -->
          <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 20px; margin-bottom: 32px;">
            <p style="margin: 0 0 12px 0; font-size: 14px; color: #a1a1aa;">
              Se o botão não funcionar, copie e cole este link no seu navegador:
            </p>
            <p style="margin: 0; word-break: break-all;">
              <a href="${resetUrl}" style="color: #ef4444; text-decoration: none; font-size: 14px;">
                ${resetUrl}
              </a>
            </p>
          </div>

          <!-- Security Note -->
          <div style="border-left: 3px solid #ef4444; padding: 16px; background: rgba(239, 68, 68, 0.1); border-radius: 0 8px 8px 0; margin-bottom: 32px;">
            <p style="margin: 0; font-size: 14px; color: #f87171;">
              <strong>🔒 Segurança:</strong> Este link expira em 1 hora. Se você não solicitou esta redefinição, ignore este email e sua senha permanecerá inalterada.
            </p>
          </div>

          <!-- Footer -->
          <div style="text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 24px;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #71717a;">
              Meu Orçamento Inteligente
            </p>
            <p style="margin: 0; font-size: 12px; color: #52525b;">
              Controle financeiro pessoal com inteligência artificial
            </p>
          </div>
        </div>
      </body>
      </html>
    `
    sendSmtpEmail.textContent = `
      Redefinir senha - Meu Orçamento Inteligente

      Olá, ${name}!

      Recebemos uma solicitação para redefinir a senha da sua conta.

      Para criar uma nova senha, acesse este link:
      ${resetUrl}

      Este link expira em 1 hora.

      Se você não solicitou esta redefinição, ignore este email e sua senha permanecerá inalterada.

      --
      Meu Orçamento Inteligente
      Controle financeiro pessoal com inteligência artificial
    `
    sendSmtpEmail.sender = { name: 'Meu Orçamento Inteligente', email: process.env.BREVO_SENDER_EMAIL || 'noreply@useorbi.app' }
    sendSmtpEmail.to = [{ email }]

    const data = await brevoApi.sendTransacEmail(sendSmtpEmail)

    console.log('✅ Email de reset de senha enviado:', data.body?.messageId || 'sucesso')
    return { success: true }

  } catch (error) {
    console.error('❌ Erro no sistema de email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}