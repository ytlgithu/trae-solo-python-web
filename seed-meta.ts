import { PrismaClient } from '@prisma/client'
import GithubSlugger from 'github-slugger'

const prisma = new PrismaClient()
const slugger = new GithubSlugger()

const categories = [
  '技术分享', '随笔生活', '读书笔记', '项目复盘', '行业动态'
]

const tags = [
  'React', 'Node.js', 'TypeScript', 'Vue', 'Next.js',
  'Python', 'Go', 'Rust', 'Docker', 'Kubernetes',
  '前端', '后端', '全栈', '面试', '算法', 'AI'
]

async function main() {
  for (const name of categories) {
    const slug = slugger.slug(name)
    await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name, slug }
    })
  }
  
  for (const name of tags) {
    const slug = slugger.slug(name)
    await prisma.tag.upsert({
      where: { slug },
      update: {},
      create: { name, slug }
    })
  }
  console.log('Seeded default categories and tags.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
