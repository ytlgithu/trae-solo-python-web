import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const categories = await prisma.category.findMany()
  const catMap = new Map()
  for (const cat of categories) {
    if (!catMap.has(cat.name)) {
      catMap.set(cat.name, cat)
    } else {
      const keep = catMap.get(cat.name)
      await prisma.post.updateMany({
        where: { categoryId: cat.id },
        data: { categoryId: keep.id }
      })
      await prisma.category.delete({ where: { id: cat.id } })
    }
  }

  const tags = await prisma.tag.findMany({ include: { posts: true } })
  const tagMap = new Map()
  for (const tag of tags) {
    if (!tagMap.has(tag.name)) {
      tagMap.set(tag.name, tag)
    } else {
      const keep = tagMap.get(tag.name)
      for (const post of tag.posts) {
        await prisma.post.update({
          where: { id: post.id },
          data: {
            tags: {
              disconnect: { id: tag.id },
              connect: { id: keep.id }
            }
          }
        })
      }
      await prisma.tag.delete({ where: { id: tag.id } })
    }
  }
}
main().then(() => console.log('Done')).catch(console.error).finally(() => prisma.$disconnect())
