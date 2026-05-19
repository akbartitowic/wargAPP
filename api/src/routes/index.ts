import { Router } from 'express'
import { apiRouter } from './api.js'
import { adminAuthRouter, adminRouter } from './admin.js'

export const rootRouter = Router()

rootRouter.use(apiRouter)
rootRouter.use('/admin/auth', adminAuthRouter)
rootRouter.use('/admin', adminRouter)
