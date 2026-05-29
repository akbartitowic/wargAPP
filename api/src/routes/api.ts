import { Router } from 'express'
import { asyncHandler } from '../middlewares/asyncHandler.js'
import { authMiddleware } from '../middlewares/authMiddleware.js'
import { requireBillingAccess } from '../middlewares/roleMiddleware.js'
import { paymentProofUpload } from '../middlewares/upload.js'
import * as authController from '../controllers/auth.controller.js'
import * as profileController from '../controllers/profile.controller.js'
import * as homeController from '../controllers/home.controller.js'
import * as billingController from '../controllers/billing.controller.js'
import * as newsController from '../controllers/news.controller.js'
import * as umkmController from '../controllers/umkm.controller.js'
import * as umkmPartnerManageController from '../controllers/umkmPartnerManage.controller.js'
import * as religiousController from '../controllers/religious.controller.js'
import * as facilityController from '../controllers/facility.controller.js'
import * as complaintController from '../controllers/complaint.controller.js'
import { complaintUpload } from '../middlewares/complaintUpload.js'

/** Route aplikasi warga — /api/v1 */
export const apiRouter = Router()

apiRouter.post('/auth/login', asyncHandler(authController.login))

apiRouter.get('/profile', authMiddleware, asyncHandler(profileController.getProfile))
apiRouter.put('/profile/update', authMiddleware, asyncHandler(profileController.updateProfile))
apiRouter.post(
  '/profile/upload-photo',
  authMiddleware,
  profileController.uploadProfilePhotoMiddleware,
  asyncHandler(profileController.uploadProfilePhoto),
)
apiRouter.get(
  '/profile/family',
  authMiddleware,
  asyncHandler(profileController.getFamilyMembers),
)
apiRouter.get(
  '/profile/support',
  authMiddleware,
  asyncHandler(profileController.getSupportInfo),
)

apiRouter.get('/home/config', authMiddleware, asyncHandler(homeController.getConfig))

const billingRouter = Router()
billingRouter.use(authMiddleware, requireBillingAccess)
billingRouter.get('/current', asyncHandler(billingController.getCurrent))
billingRouter.get('/history', asyncHandler(billingController.getHistory))
billingRouter.post(
  '/upload-proof',
  paymentProofUpload.single('proof'),
  asyncHandler(billingController.uploadProof),
)
apiRouter.use('/billing', billingRouter)

apiRouter.get('/umkm/shops', authMiddleware, asyncHandler(umkmController.listShops))
apiRouter.get(
  '/umkm/shops/:id/products',
  authMiddleware,
  asyncHandler(umkmController.listProducts),
)
apiRouter.get(
  '/umkm/partner/my-shop',
  authMiddleware,
  asyncHandler(umkmController.getMyPartnerShop),
)
apiRouter.post(
  '/umkm/partner/apply',
  authMiddleware,
  asyncHandler(umkmController.applyPartnerShop),
)
apiRouter.post(
  '/umkm/partner/upload-image',
  authMiddleware,
  umkmController.umkmImageUpload.single('image'),
  asyncHandler(umkmController.uploadPartnerImage),
)
apiRouter.get(
  '/umkm/partner/manage',
  authMiddleware,
  asyncHandler(umkmPartnerManageController.getManageDashboard),
)
apiRouter.patch(
  '/umkm/partner/manage/open-status',
  authMiddleware,
  asyncHandler(umkmPartnerManageController.setManualClosed),
)
apiRouter.post(
  '/umkm/partner/manage/shop',
  authMiddleware,
  asyncHandler(umkmPartnerManageController.submitShopUpdate),
)
apiRouter.post(
  '/umkm/partner/manage/products',
  authMiddleware,
  asyncHandler(umkmPartnerManageController.submitProductCreate),
)
apiRouter.put(
  '/umkm/partner/manage/products/:productId',
  authMiddleware,
  asyncHandler(umkmPartnerManageController.submitProductUpdate),
)
apiRouter.delete(
  '/umkm/partner/manage/products/:productId',
  authMiddleware,
  asyncHandler(umkmPartnerManageController.submitProductDelete),
)
apiRouter.get('/news/categories', authMiddleware, asyncHandler(newsController.listCategories))
apiRouter.get('/news', authMiddleware, asyncHandler(newsController.list))
apiRouter.get('/news/:slug', authMiddleware, asyncHandler(newsController.getBySlug))
apiRouter.get('/religious/schedule', authMiddleware, asyncHandler(religiousController.getSchedule))
apiRouter.get('/religious/places', authMiddleware, asyncHandler(religiousController.listPlaces))

apiRouter.get('/facilities', authMiddleware, asyncHandler(facilityController.list))
apiRouter.get('/facilities/:id', authMiddleware, asyncHandler(facilityController.getById))

apiRouter.get('/complaints/categories', authMiddleware, asyncHandler(complaintController.listCategories))
apiRouter.get('/complaints', authMiddleware, asyncHandler(complaintController.listMine))
apiRouter.get('/complaints/:id', authMiddleware, asyncHandler(complaintController.getById))
apiRouter.post(
  '/complaints',
  authMiddleware,
  complaintUpload.array('attachments', 8),
  asyncHandler(complaintController.create),
)
