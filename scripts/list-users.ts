import { PrismaClient } from "@prisma/client"
import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

const prisma = new PrismaClient()

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: { email: true, name: true, emailVerified: true, isActive: true }
    })
    console.log("Usuários encontrados:", users.length)
    users.forEach(u => console.log(u.email, u.emailVerified ? "✅" : "❌"))
  } catch (error) {
    console.error("Erro:", error.message)
  } finally {
    await prisma.$disconnect()
  }
}
listUsers()
