import { Router, type Request, type Response } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../db.js'
import { writeLog } from '../operationLog.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key'

const getAdminUserId = async (req: Request): Promise<string | null> => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return null
  const decoded = jwt.verify(token, JWT_SECRET) as { id: string }
  const user = await prisma.user.findUnique({ where: { id: decoded.id } })
  if (!user) return null
  if (user.role !== 'ADMIN') return null
  return user.id
}

const isSuperAdmin = async (userId: string): Promise<boolean> => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  return Boolean(user && user.username === 'admin')
}

router.get('/posts', async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = await getAdminUserId(req)
    if (!adminId) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const status = req.query.status as string | undefined
    const posts = await prisma.post.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, username: true } },
        category: true,
        tags: true,
      },
    })
    res.json(posts)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error'
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Server error' : message })
  }
})

router.patch('/posts/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = await getAdminUserId(req)
    if (!adminId) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const { id } = req.params
    const { title, excerpt, content, status } = req.body as {
      title?: string
      excerpt?: string
      content?: string
      status?: string
    }

    const data: any = {}
    if (typeof title === 'string') data.title = title
    if (typeof excerpt === 'string') data.excerpt = excerpt
    if (typeof content === 'string') data.content = content
    if (typeof status === 'string') {
      data.status = status
      if (status === 'PUBLISHED') data.publishedAt = new Date()
      if (status === 'DRAFT') data.publishedAt = null
    }

    const updated = await prisma.post.update({ where: { id }, data })
    if (typeof status === 'string') {
      await writeLog({
        actorId: adminId,
        action: status === 'PUBLISHED' ? 'POST_PUBLISH' : status === 'DRAFT' ? 'POST_UNPUBLISH' : 'POST_UPDATE',
        target: updated.id,
        detail: updated.title,
      })
    } else {
      await writeLog({
        actorId: adminId,
        action: 'POST_UPDATE',
        target: updated.id,
        detail: updated.title,
      })
    }
    res.json(updated)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error'
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Server error' : message })
  }
})

router.delete('/posts/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = await getAdminUserId(req)
    if (!adminId) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const { id } = req.params
    const deleted = await prisma.post.delete({ where: { id } })
    await writeLog({ actorId: adminId, action: 'POST_DELETE', target: deleted.id, detail: deleted.title })
    res.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error'
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Server error' : message })
  }
})

router.get('/logs', async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = await getAdminUserId(req)
    if (!adminId) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const pageRaw = Number(req.query.page ?? 1)
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1
    const pageSize = 20
    const skip = (page - 1) * pageSize

    const [total, items] = await Promise.all([
      prisma.operationLog.count(),
      prisma.operationLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: { actor: { select: { username: true } } },
      }),
    ])

    res.json({
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      items,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error'
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Server error' : message })
  }
})

router.get('/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = await getAdminUserId(req)
    if (!adminId) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const users = await prisma.user.findMany({
      select: { 
        id: true, 
        username: true, 
        role: true, 
        createdAt: true,
        profile: { select: { avatarUrl: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(users)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error'
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Server error' : message })
  }
})

router.patch('/users/:id/role', async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = await getAdminUserId(req)
    if (!adminId) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    if (!(await isSuperAdmin(adminId))) {
      res.status(403).json({ error: '只有超级管理员可以修改用户权限' })
      return
    }

    const { id } = req.params
    const { role } = req.body

    if (id === adminId) {
      res.status(400).json({ error: '不能修改自己的权限' })
      return
    }

    const targetUser = await prisma.user.findUnique({ where: { id } })
    if (!targetUser) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    if (targetUser.username === 'admin') {
      res.status(403).json({ error: '不能修改超级管理员权限' })
      return
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role }
    })

    await writeLog({
      actorId: adminId,
      action: 'USER_ROLE_UPDATE',
      target: updated.id,
      detail: `修改用户 [${targetUser.username}] 的角色为 ${role === 'ADMIN' ? '管理员' : '普通用户'}`
    })

    res.json(updated)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error'
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Server error' : message })
  }
})

export default router
