import { Router, type Request, type Response } from 'express'
import prisma from '../db.js'

const router = Router()

// Get my posts
router.get('/me/posts', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'secret_key') as { id: string }
    
    const posts = await prisma.post.findMany({
      where: { authorId: decoded.id },
      orderBy: { createdAt: 'desc' }
    })

    res.json(posts)
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
