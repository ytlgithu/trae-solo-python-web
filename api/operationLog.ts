import prisma from './db.js'

export const writeLog = async (params: { actorId: string; action: string; target?: string; detail?: string }) => {
  try {
    await prisma.operationLog.create({
      data: {
        actorId: params.actorId,
        action: params.action,
        target: params.target,
        detail: params.detail,
      },
    })

    const old = await prisma.operationLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip: 200,
      select: { id: true },
    })

    if (old.length > 0) {
      await prisma.operationLog.deleteMany({ where: { id: { in: old.map((x) => x.id) } } })
    }
  } catch {
  }
}

