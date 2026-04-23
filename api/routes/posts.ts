import { Router, type Request, type Response } from 'express'
import jwt from 'jsonwebtoken'
import { Prisma } from '@prisma/client'
import GithubSlugger from 'github-slugger'
import prisma from '../db.js'
import { writeLog } from '../operationLog.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_do_not_use_in_prod'

// Get all published posts
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, category, tag } = req.query

    const where: Prisma.PostWhereInput = {
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
    console.error('Fetch posts error:', error)
    res.status(500).json({ error: 'Failed to fetch posts', details: String(error) })
  }
})

// Get post by id (for editing)
router.get('/id/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        category: true,
        tags: true
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

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string }
    
    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        userId: decoded.id,
        status: 'APPROVED'
      }
    })

    await writeLog({
      actorId: decoded.id,
      action: 'COMMENT_CREATE',
      target: comment.id,
      detail: `post:${postId}`,
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

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string }
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
            where: { slug: new GithubSlugger().slug(category) },
            create: { name: category, slug: new GithubSlugger().slug(category) }
          }
        } : undefined,
        tags: tags ? {
          connectOrCreate: tags.split(',').map((t: string) => {
            const trimmed = t.trim()
            const slugged = new GithubSlugger().slug(trimmed)
            return {
              where: { slug: slugged },
              create: { name: trimmed, slug: slugged }
            }
          })
        } : undefined
      }
    })

    await writeLog({
      actorId: decoded.id,
      action: 'POST_CREATE',
      target: post.id,
      detail: `${post.title} (${status})`,
    })

    res.json(post)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create post'
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Failed to create post' : message })
  }
})

// Update Post
router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string }
    const { id } = req.params
    const { title, excerpt, content, status, category, tags } = req.body

    const existing = await prisma.post.findUnique({ where: { id } })
    if (!existing || existing.authorId !== decoded.id) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const post = await prisma.post.update({
      where: { id },
      data: {
        title,
        excerpt,
        content,
        status,
        publishedAt: status === 'PUBLISHED' && !existing.publishedAt ? new Date() : existing.publishedAt,
        category: category ? {
          connectOrCreate: {
            where: { slug: new GithubSlugger().slug(category) },
            create: { name: category, slug: new GithubSlugger().slug(category) }
          }
        } : undefined,
        tags: tags ? {
          set: [],
          connectOrCreate: tags.split(',').map((t: string) => {
            const trimmed = t.trim()
            const slugged = new GithubSlugger().slug(trimmed)
            return {
              where: { slug: slugged },
              create: { name: trimmed, slug: slugged }
            }
          })
        } : undefined
      }
    })

    await writeLog({
      actorId: decoded.id,
      action: 'POST_UPDATE',
      target: post.id,
      detail: `${post.title} (${status})`,
    })

    res.json(post)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update post'
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Failed to update post' : message })
  }
})

export default router
