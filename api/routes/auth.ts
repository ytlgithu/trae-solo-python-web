import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../db.js'
import { writeLog } from '../operationLog.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key'

// Register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body
    
    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
      res.status(400).json({ error: '用户名已被注册' })
      return
    }

    const isFirstUser = (await prisma.user.count()) === 0
    const role = isFirstUser || username === '徐亚' ? 'ADMIN' : 'USER'
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role,
        profile: { create: {} }
      }
    })

    await writeLog({
      actorId: user.id,
      action: 'AUTH_REGISTER',
      target: user.id,
      detail: `${user.username} (${user.role})`,
    })

    const token = jwt.sign({ id: user.id, role: user.role, username: user.username }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } })
  } catch (error) {
    res.status(500).json({ error: '服务器错误' })
  }
})

// Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body
    
    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) {
      res.status(401).json({ error: '用户名或密码错误' })
      return
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      res.status(401).json({ error: '用户名或密码错误' })
      return
    }

    const role = username === '徐亚' ? 'ADMIN' : user.role
    if (role !== user.role) {
      await prisma.user.update({ where: { id: user.id }, data: { role } })
    }

    await writeLog({
      actorId: user.id,
      action: 'AUTH_LOGIN',
      target: user.id,
      detail: user.username,
    })

    const token = jwt.sign({ id: user.id, role, username: user.username }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: { id: user.id, username: user.username, role } })
  } catch (error) {
    res.status(500).json({ error: '服务器错误' })
  }
})

// Get me
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      res.status(401).json({ error: '未登录' })
      return
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string }
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, username: true, role: true, profile: true }
    })
    
    if (!user) {
      res.status(401).json({ error: '用户不存在' })
      return
    }
    
    res.json(user)
  } catch (error) {
    res.status(401).json({ error: '认证失效' })
  }
})

export default router
