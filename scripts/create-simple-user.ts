import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"
import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

const prisma = new PrismaClient()

async function createUser() {
  try {
    const email = "usuario@teste.com"
    const password = "123456"
    const name = "Usuário Teste"
    
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      const hashedPassword = await bcrypt.hash(password, 12)
      await prisma.user.update({
        where: { email },
        data: { password: hashedPassword, emailVerified: new Date(), isActive: true }
      })
      console.log("✅ Usuário atualizado:", email, "senha:", password)
    } else {
      const hashedPassword = await bcrypt.hash(password, 12)
      await prisma.user.create({
        data: { email, name, password: hashedPassword, emailVerified: new Date(), isActive: true }
      })
      console.log("✅ Usuário criado:", email, "senha:", password)
    }
  } catch (error) {
    console.error("Erro:", error.message)
  } finally {
    await prisma.$disconnect()
  }
}
createUser()
