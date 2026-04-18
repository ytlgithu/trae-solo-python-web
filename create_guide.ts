import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 获取超级管理员账号作为作者
  let admin = await prisma.user.findFirst({
    where: { username: 'admin' }
  })
  if (!admin) {
    admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
  }
  if (!admin) {
    admin = await prisma.user.findFirst()
  }

  if (!admin) {
    console.error('没有找到任何用户，无法发布文章')
    return
  }

  const title = '🌟 私人代码仓库 (Gitea) 快速使用指南'
  const slug = 'gitea-private-repo-guide-' + Date.now().toString(36)
  const excerpt = '我们已经在本地成功搭建了专属的私人代码仓库。本文将手把手教你如何使用这个类似 GitHub 的私有仓库，包括如何推送本地代码和上传个人文件。'
  const content = `## 🎉 欢迎使用你的私人仓库！

我们在本地（G 盘）成功搭建了专属的私人代码仓库（基于 Gitea），它就像一个完全属于你自己的、没有容量限制的 GitHub！

### 🔗 访问地址
请在连接了家庭局域网的任意设备（电脑、手机、平板）上访问：
[**http://192.168.10.248:18080**](http://192.168.10.248:18080)

---

### 🛠️ 核心功能 1：推送本地代码
如果你本地已经有了一个 Git 项目，只需要在项目根目录下打开终端，执行以下命令，就能把代码安全地备份到你的私有仓库中：

\`\`\`bash
# 1. 关联远程仓库（请将 \`admin\` 和 \`你的仓库名\` 替换为你实际的用户名和仓库名）
git remote add origin http://192.168.10.248:18080/admin/你的仓库名.git

# 2. 推送代码到 master 或 main 分支
git push -u origin main
\`\`\`

*(💡 **提示**：第一次推送时会弹窗要求输入 Gitea 的账号密码，输入你刚才注册的超级管理员账号即可。)*

---

### 📁 核心功能 2：当作“私人网盘”使用
不仅是代码，你还可以把它当成一个不限速的**私人网盘**。
在网页端创建仓库后，直接点击右上角的 **“上传文件”**，就可以把图片、压缩包、文档、设计稿等任意文件直接拖拽上去，非常方便！

---

### 🛡️ 为什么这么做？
- **极致安全**：所有数据都物理隔离地保存在你本地电脑的 G 盘中，完全私密。
- **告别限制**：不用再担心公有云的容量限制、下载限速和隐私泄露。
- **永远在线**：只要你家里的这台主机开着，你在任何地方连回家里都能访问到你的宝贵数据。

如果你需要修改配置或重置，可以随时联系管理员。尽情享受属于你自己的数字资产库吧！
`

  const post = await prisma.post.create({
    data: {
      title,
      slug,
      excerpt,
      content,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      authorId: admin.id,
      category: {
        connectOrCreate: {
          where: { slug: 'tutorial' },
          create: { name: '教程指南', slug: 'tutorial' }
        }
      },
      tags: {
        connectOrCreate: [
          { where: { slug: 'gitea' }, create: { name: 'Gitea', slug: 'gitea' } },
          { where: { slug: 'git' }, create: { name: 'Git', slug: 'git' } }
        ]
      }
    }
  })

  console.log('✅ 文章已成功发布：', post.title)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
