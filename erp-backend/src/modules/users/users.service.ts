import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { imageUploadOptions, persistImage, publicUploadPath } from '../../common/utils/image-upload.util';
import { UpdateProfileDto } from './dto/update-profile.dto';

type UserWithRole = User & { role: { name: string; allowedFeatures: string[] } };

export interface UserProfile {
  id: string;
  companyId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  isActive: boolean;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export const USER_AVATAR_UPLOAD_OPTIONS = imageUploadOptions();

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<UserWithRole | null> {
    return this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: { role: { select: { name: true, allowedFeatures: true } } },
    });
  }

  findById(id: string): Promise<UserWithRole | null> {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { role: { select: { name: true, allowedFeatures: true } } },
    });
  }

  updateLastLogin(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async getProfile(id: string): Promise<UserProfile> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toProfile(user);
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<UserProfile> {
    await this.assertExists(id);
    const updated = await this.prisma.user.update({
      where: { id },
      data: dto,
      include: { role: { select: { name: true, allowedFeatures: true } } },
    });
    return this.toProfile(updated);
  }

  async updateAvatar(id: string, file: Express.Multer.File): Promise<UserProfile> {
    await this.assertExists(id);
    // persistImage inspects the bytes before anything touches disk — the
    // mimetype on the request cannot be trusted.
    const filename = await persistImage(file, 'avatars');
    const avatarUrl = publicUploadPath('avatars', filename);
    const updated = await this.prisma.user.update({
      where: { id },
      data: { avatarUrl },
      include: { role: { select: { name: true, allowedFeatures: true } } },
    });
    return this.toProfile(updated);
  }

  private toProfile(user: UserWithRole): UserProfile {
    return {
      id: user.id,
      companyId: user.companyId,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      role: user.role.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private async assertExists(id: string): Promise<void> {
    const exists = await this.prisma.user.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!exists) {
      throw new NotFoundException('User not found');
    }
  }
}
