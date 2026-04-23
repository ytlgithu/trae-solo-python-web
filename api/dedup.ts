import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting data deduplication...')
  
  // Deduplicate Categories
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
      console.log(`Deleted duplicate category: ${cat.name}`)
    }
  }

  // Deduplicate Tags
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
      console.log(`Deleted duplicate tag: ${tag.name}`)
    }
  }

  console.log('Data deduplication completed.')
}

main()
  .catch(e => {
    console.error('Error during deduplication:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
