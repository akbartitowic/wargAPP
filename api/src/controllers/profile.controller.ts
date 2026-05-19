import type { Request, Response } from 'express'
import { profileUpdateSchema } from '../validators/auth.validator.js'
import * as profileService from '../services/profile.service.js'
import { sendSuccess } from '../utils/response.js'
import { BadRequestError } from '../utils/errors.js'
import { processProfilePhoto, profilePhotoUpload } from '../middlewares/profileUpload.js'

export async function getProfile(req: Request, res: Response): Promise<void> {
  const data = await profileService.getProfile(req.resident!.id)
  sendSuccess(res, data)
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const parsed = profileUpdateSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new BadRequestError('Payload tidak valid', parsed.error.flatten().fieldErrors)
  }
  const data = await profileService.updateProfile(req.resident!.id, parsed.data)
  sendSuccess(res, data)
}

export const uploadProfilePhotoMiddleware = profilePhotoUpload.single('photo')

export async function uploadProfilePhoto(req: Request, res: Response): Promise<void> {
  if (!req.file?.buffer) {
    throw new BadRequestError('File foto wajib diunggah')
  }
  const processed = await processProfilePhoto(req.file.buffer)
  const data = await profileService.setProfilePhoto(req.resident!.id, processed.relativePath)
  sendSuccess(res, data)
}

export async function getFamilyMembers(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await profileService.listFamilyMembers(req.resident!.id))
}

export async function getSupportInfo(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await profileService.getSupportInfo(req.resident!.id))
}
