import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User, TenantMember } from '@/entities';
import { SyncUserDto, UpdateProfileDto } from '@/auth/dto';
import { AuthProvider, TenantMemberRole } from '@tiggpro/shared';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(TenantMember)
    private tenantMemberRepository: Repository<TenantMember>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async syncUser(syncUserDto: SyncUserDto): Promise<User> {
    const { email, name, image, providerId, provider } = syncUserDto;

    // Check if user exists by email
    let user = await this.userRepository.findOne({
      where: { email },
    });

    if (user) {
      // Update user if provider info has changed
      let hasChanges = false;

      if (provider === AuthProvider.GOOGLE && user.googleId !== providerId) {
        user.googleId = providerId;
        hasChanges = true;
      }

      if (provider === AuthProvider.APPLE && user.appleId !== providerId) {
        user.appleId = providerId;
        hasChanges = true;
      }

      if (user.displayName !== name) {
        user.displayName = name;
        hasChanges = true;
      }

      if (image && user.avatarUrl !== image) {
        user.avatarUrl = image;
        hasChanges = true;
      }

      if (user.provider !== provider) {
        user.provider = provider;
        hasChanges = true;
      }

      if (hasChanges) {
        user = await this.userRepository.save(user);
      }
    } else {
      // Create new user
      const userData: Partial<User> = {
        email,
        displayName: name,
        avatarUrl: image,
        provider,
        isActive: true,
      };

      if (provider === AuthProvider.GOOGLE) {
        userData.googleId = providerId;
      } else if (provider === AuthProvider.APPLE) {
        userData.appleId = providerId;
      }

      user = this.userRepository.create(userData);

      user = await this.userRepository.save(user);
    }

    return user;
  }

  async validateUserById(userId: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });

    return user;
  }

  async validateUserByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email, isActive: true },
    });

    return user;
  }

  generateJwtToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
    };

    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('app.jwtExpiresIn'),
    });
  }

  login(user: User) {
    const token = this.generateJwtToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        provider: user.provider,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      access_token: token,
    };
  }

  // RBAC Methods
  async getUserRoleInTenant(userId: string, tenantId: string): Promise<TenantMemberRole | null> {
    const membership = await this.tenantMemberRepository.findOne({
      where: {
        userId,
        tenantId,
        isActive: true
      },
    });

    return membership?.role || null;
  }

  async isUserMemberOfTenant(userId: string, tenantId: string): Promise<boolean> {
    const membership = await this.tenantMemberRepository.findOne({
      where: {
        userId,
        tenantId,
        isActive: true
      },
    });

    return !!membership;
  }

  async getUserTenants(userId: string): Promise<TenantMember[]> {
    return this.tenantMemberRepository.find({
      where: {
        userId,
        isActive: true
      },
      relations: ['tenant'],
    });
  }

  async hasPermission(
    userId: string,
    tenantId: string,
    requiredRoles: TenantMemberRole[]
  ): Promise<boolean> {
    const userRole = await this.getUserRoleInTenant(userId, tenantId);
    return userRole ? requiredRoles.includes(userRole) : false;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Update only provided fields
    if (updateProfileDto.displayName !== undefined) {
      user.displayName = updateProfileDto.displayName;
    }

    if (updateProfileDto.avatarUrl !== undefined) {
      user.avatarUrl = updateProfileDto.avatarUrl;
    }

    return this.userRepository.save(user);
  }
}
