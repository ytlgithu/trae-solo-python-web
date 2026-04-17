import { Router, type Request, type Response } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../db.js'

const router = Router()

// Get all published posts
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, category, tag } = req.query

    const where: any = {
      status: 'PUBLISHED',
      publishedAt: { lte: new Date() }
    }

    if (q) {
      where.OR = [
        { title: { contains: String(q) } },
        { content: { contains: String(q) } },
        { excerpt: { contains: String(q) } }
      ]
    }

    if (category) {
      where.category = { slug: String(category) }
    }

    if (tag) {
      where.tags = { some: { slug: String(tag) } }
    }

    const posts = await prisma.post.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      include: {
        author: { select: { username: true } },
        category: true,
        tags: true
      }
    })

    res.json(posts)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posts' })
  }
})

// Get post by slug
router.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params
    const post = await prisma.post.findUnique({
      where: { slug },
      include: {
        author: { select: { username: true } },
        category: true,
        tags: true,
        comments: {
          include: { user: { select: { username: true } } },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!post) {
      res.status(404).json({ error: 'Post not found' })
      return
    }

    res.json(post)
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

// Create comment
router.post('/:id/comments', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const { id: postId } = req.params
    const { content } = req.body

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key') as { id: string }
    
    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        userId: decoded.id,
        status: 'APPROVED'
      }
    })

    res.json(comment)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error'
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Server error' : message })
  }
})

// Create Post
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key') as { id: string }
    const { title, slug, excerpt, content, status, category, tags } = req.body

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        status,
        author: { connect: { id: decoded.id } },
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
        category: category ? {
          connectOrCreate: {
            where: { slug: category.toLowerCase().replace(/[\s\W-]+/g, '-') },
            create: { name: category, slug: category.toLowerCase().replace(/[\s\W-]+/g, '-') }
          }
        } : undefined,
        tags: tags ? {
          connectOrCreate: tags.split(',').map((t: string) => ({
            where: { slug: t.trim().toLowerCase().replace(/[\s\W-]+/g, '-') },
            create: { name: t.trim(), slug: t.trim().toLowerCase().replace(/[\s\W-]+/g, '-') }
          }))
        } : undefined
      }
    })

    res.json(post)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create post'
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Failed to create post' : message })
  }
})

export default router
