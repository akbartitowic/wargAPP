import { Router } from 'express'
import { asyncHandler } from '../middlewares/asyncHandler.js'
import { adminAuthMiddleware } from '../middlewares/authMiddleware.js'
import { requireAdminRoles } from '../middlewares/roleMiddleware.js'
import * as adminAuthController from '../controllers/adminAuth.controller.js'
import * as adminController from '../controllers/admin.controller.js'
import * as housingController from '../controllers/housing.controller.js'
import * as wilayahController from '../controllers/wilayah.controller.js'
import * as adminManageController from '../controllers/adminManage.controller.js'
import * as adminNewsController from '../controllers/adminNews.controller.js'
import * as adminUmkmController from '../controllers/adminUmkm.controller.js'
import * as adminFacilityController from '../controllers/adminFacility.controller.js'
import * as newsCategoryController from '../controllers/newsCategory.controller.js'

/** Route CMS admin — /api/v1/admin */
export const adminRouter = Router()

export const adminAuthRouter = Router()
adminAuthRouter.post('/login', asyncHandler(adminAuthController.login))

adminRouter.use(adminAuthMiddleware)

adminRouter.get('/me', asyncHandler(adminAuthController.me))
adminRouter.put('/me/password', asyncHandler(adminAuthController.changePassword))

adminRouter.get(
  '/admins',
  requireAdminRoles('super_admin'),
  asyncHandler(adminManageController.list),
)
adminRouter.get(
  '/admins/:id',
  requireAdminRoles('super_admin'),
  asyncHandler(adminManageController.getById),
)
adminRouter.post(
  '/admins',
  requireAdminRoles('super_admin'),
  asyncHandler(adminManageController.create),
)
adminRouter.put(
  '/admins/:id',
  requireAdminRoles('super_admin'),
  asyncHandler(adminManageController.update),
)

adminRouter.get(
  '/wilayah',
  requireAdminRoles('super_admin', 'housing_admin'),
  asyncHandler(wilayahController.search),
)
adminRouter.get(
  '/wilayah/:kode/chain',
  requireAdminRoles('super_admin', 'housing_admin'),
  asyncHandler(wilayahController.getChain),
)
adminRouter.get(
  '/wilayah/:kode',
  requireAdminRoles('super_admin', 'housing_admin'),
  asyncHandler(wilayahController.getByKode),
)

adminRouter.get(
  '/housing-complexes',
  requireAdminRoles('super_admin'),
  asyncHandler(housingController.listHousing),
)
adminRouter.get(
  '/housing-complexes/:id',
  requireAdminRoles('super_admin'),
  asyncHandler(housingController.getHousing),
)
adminRouter.post(
  '/housing-complexes',
  requireAdminRoles('super_admin'),
  asyncHandler(housingController.createHousing),
)
adminRouter.put(
  '/housing-complexes/:id',
  requireAdminRoles('super_admin'),
  asyncHandler(housingController.updateHousing),
)
adminRouter.delete(
  '/housing-complexes/:id',
  requireAdminRoles('super_admin'),
  asyncHandler(housingController.deactivateHousing),
)

adminRouter.get(
  '/housing-units',
  requireAdminRoles('super_admin', 'housing_admin'),
  asyncHandler(adminController.listHousingUnits),
)
adminRouter.get(
  '/housing-units/:unitId/kk',
  requireAdminRoles('super_admin', 'housing_admin'),
  asyncHandler(adminController.listUnitKk),
)
adminRouter.get(
  '/users',
  requireAdminRoles('super_admin', 'housing_admin'),
  asyncHandler(adminController.listUsers),
)
adminRouter.get(
  '/users/:id',
  requireAdminRoles('super_admin', 'housing_admin'),
  asyncHandler(adminController.getUser),
)
adminRouter.get(
  '/audit-logs',
  requireAdminRoles('super_admin'),
  asyncHandler(adminController.listAudit),
)
adminRouter.post(
  '/users',
  requireAdminRoles('super_admin', 'housing_admin'),
  asyncHandler(adminController.createUser),
)
adminRouter.put(
  '/users/:id',
  requireAdminRoles('super_admin', 'housing_admin'),
  asyncHandler(adminController.updateUser),
)
adminRouter.post(
  '/users/:id/reset-password',
  requireAdminRoles('super_admin', 'housing_admin'),
  asyncHandler(adminController.resetUserPassword),
)
adminRouter.patch(
  '/users/:id/account-status',
  requireAdminRoles('super_admin', 'housing_admin'),
  asyncHandler(adminController.setUserAccountStatus),
)
adminRouter.delete(
  '/users/:id',
  requireAdminRoles('super_admin', 'housing_admin'),
  asyncHandler(adminController.deleteUser),
)
adminRouter.get(
  '/billing/dashboard',
  requireAdminRoles('super_admin', 'housing_admin', 'finance_admin'),
  asyncHandler(adminController.getBillingDashboard),
)
adminRouter.get(
  '/billing/unpaid',
  requireAdminRoles('super_admin', 'housing_admin', 'finance_admin'),
  asyncHandler(adminController.listUnpaidBillings),
)
adminRouter.post(
  '/billing/generate',
  requireAdminRoles('super_admin', 'housing_admin', 'finance_admin'),
  asyncHandler(adminController.generateBills),
)
adminRouter.post(
  '/billing/expenses',
  requireAdminRoles('super_admin', 'housing_admin', 'finance_admin'),
  asyncHandler(adminController.createIplExpense),
)
adminRouter.delete(
  '/billing/expenses/:id',
  requireAdminRoles('super_admin', 'housing_admin', 'finance_admin'),
  asyncHandler(adminController.deleteIplExpense),
)
adminRouter.get(
  '/billing/approval',
  requireAdminRoles('super_admin', 'housing_admin', 'finance_admin'),
  asyncHandler(adminController.listBillingApproval),
)
adminRouter.put(
  '/billing/approve/:id',
  requireAdminRoles('super_admin', 'housing_admin', 'finance_admin'),
  asyncHandler(adminController.approveBilling),
)
adminRouter.post(
  '/news/upload-hero',
  requireAdminRoles('super_admin', 'housing_admin', 'content_admin'),
  adminController.newsHeroUpload.single('image'),
  asyncHandler(adminController.uploadNewsHero),
)
adminRouter.get(
  '/news-categories',
  requireAdminRoles('super_admin', 'housing_admin', 'content_admin'),
  asyncHandler(newsCategoryController.listCategories),
)
adminRouter.post(
  '/news-categories',
  requireAdminRoles('super_admin', 'housing_admin', 'content_admin'),
  asyncHandler(newsCategoryController.createCategory),
)
adminRouter.put(
  '/news-categories/:id',
  requireAdminRoles('super_admin', 'housing_admin', 'content_admin'),
  asyncHandler(newsCategoryController.updateCategory),
)
adminRouter.get(
  '/news',
  requireAdminRoles('super_admin', 'housing_admin', 'content_admin'),
  asyncHandler(adminNewsController.listNews),
)
adminRouter.get(
  '/news/:id',
  requireAdminRoles('super_admin', 'housing_admin', 'content_admin'),
  asyncHandler(adminNewsController.getNews),
)
adminRouter.post(
  '/news',
  requireAdminRoles('super_admin', 'housing_admin', 'content_admin'),
  asyncHandler(adminNewsController.publishNews),
)
adminRouter.put(
  '/news/:id',
  requireAdminRoles('super_admin', 'housing_admin', 'content_admin'),
  asyncHandler(adminNewsController.updateNews),
)

const umkmRoles = requireAdminRoles('super_admin', 'housing_admin', 'content_admin')

adminRouter.post(
  '/umkm/upload-image',
  umkmRoles,
  adminUmkmController.umkmImageUpload.single('image'),
  asyncHandler(adminUmkmController.uploadImage),
)
adminRouter.get('/umkm/shops', umkmRoles, asyncHandler(adminUmkmController.listShops))
adminRouter.get('/umkm/shops/:shopId', umkmRoles, asyncHandler(adminUmkmController.getShop))
adminRouter.post('/umkm/shops', umkmRoles, asyncHandler(adminUmkmController.createShop))
adminRouter.put('/umkm/shops/:shopId', umkmRoles, asyncHandler(adminUmkmController.updateShop))
adminRouter.patch(
  '/umkm/shops/:shopId/status',
  umkmRoles,
  asyncHandler(adminUmkmController.setShopStatus),
)
adminRouter.get(
  '/umkm/shops/:shopId/products',
  umkmRoles,
  asyncHandler(adminUmkmController.listProducts),
)
adminRouter.post(
  '/umkm/shops/:shopId/products',
  umkmRoles,
  asyncHandler(adminUmkmController.createProduct),
)
adminRouter.put(
  '/umkm/shops/:shopId/products/:productId',
  umkmRoles,
  asyncHandler(adminUmkmController.updateProduct),
)
adminRouter.delete(
  '/umkm/shops/:shopId/products/:productId',
  umkmRoles,
  asyncHandler(adminUmkmController.deleteProduct),
)
adminRouter.get(
  '/umkm/change-requests',
  umkmRoles,
  asyncHandler(adminUmkmController.listChangeRequests),
)
adminRouter.post(
  '/umkm/change-requests/:requestId/approve',
  umkmRoles,
  asyncHandler(adminUmkmController.approveChangeRequest),
)
adminRouter.post(
  '/umkm/change-requests/:requestId/reject',
  umkmRoles,
  asyncHandler(adminUmkmController.rejectChangeRequest),
)

const locationRoles = requireAdminRoles('super_admin', 'housing_admin', 'content_admin')

adminRouter.post(
  '/facilities/upload-image',
  locationRoles,
  adminFacilityController.facilityImageUpload.single('image'),
  asyncHandler(adminFacilityController.uploadImage),
)
adminRouter.get('/facilities', locationRoles, asyncHandler(adminFacilityController.list))
adminRouter.get('/facilities/:id', locationRoles, asyncHandler(adminFacilityController.getById))
adminRouter.post('/facilities', locationRoles, asyncHandler(adminFacilityController.create))
adminRouter.put('/facilities/:id', locationRoles, asyncHandler(adminFacilityController.update))
adminRouter.delete('/facilities/:id', locationRoles, asyncHandler(adminFacilityController.remove))
