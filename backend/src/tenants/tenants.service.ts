import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { customAlphabet } from 'nanoid';
import { Tenant, TenantMember, User } from '@/entities';
import { CreateTenantDto, InviteMemberDto, JoinTenantDto } from './dto';
import { TenantMemberRole } from '@tiggpro/shared';

@Injectable()
export class TenantsService {
  // Create nanoid generator with readable alphabet (excludes confusing characters like 0, O, I, l, 1)
  private readonly generateCode = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 8);

  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(TenantMember)
    private tenantMemberRepository: Repository<TenantMember>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createTenant(createTenantDto: CreateTenantDto, createdById: string): Promise<Tenant> {
    // Generate unique tenant code
    const tenantCode = await this.generateUniqueTenantCode();

    // Create tenant
    const tenant = this.tenantRepository.create({
      ...createTenantDto,
      tenantCode,
      createdBy: createdById,
    });

    const savedTenant = await this.tenantRepository.save(tenant);

    // Add creator as admin member
    const membership = this.tenantMemberRepository.create({
      tenantId: savedTenant.id,
      userId: createdById,
      role: TenantMemberRole.ADMIN,
      isActive: true,
    });

    await this.tenantMemberRepository.save(membership);

    return savedTenant;
  }

  async getTenantById(tenantId: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId, isActive: true },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async getTenantMembers(tenantId: string): Promise<TenantMember[]> {
    // Verify tenant exists
    await this.getTenantById(tenantId);

    return this.tenantMemberRepository.find({
      where: { tenantId, isActive: true },
      relations: ['user'],
      order: { joinedAt: 'ASC' },
    });
  }

  async inviteMember(tenantId: string, inviteMemberDto: InviteMemberDto, invitedById: string): Promise<void> {
    // Verify tenant exists
    const tenant = await this.getTenantById(tenantId);

    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email: inviteMemberDto.email, isActive: true },
    });

    if (!user) {
      throw new NotFoundException('User with this email not found');
    }

    // Check if user is already a member
    const existingMembership = await this.tenantMemberRepository.findOne({
      where: { tenantId, userId: user.id },
    });

    if (existingMembership) {
      throw new ConflictException('User is already a member of this tenant');
    }

    // Create membership
    const membership = this.tenantMemberRepository.create({
      tenantId,
      userId: user.id,
      role: inviteMemberDto.role,
      invitedBy: invitedById,
      isActive: true,
    });

    await this.tenantMemberRepository.save(membership);

    // TODO: Send invitation notification/email
  }

  async joinTenant(joinTenantDto: JoinTenantDto, userId: string): Promise<Tenant> {
    // Find tenant by code
    const tenant = await this.tenantRepository.findOne({
      where: { tenantCode: joinTenantDto.tenantCode, isActive: true },
    });

    if (!tenant) {
      throw new NotFoundException('Invalid tenant code');
    }

    // Check if user is already a member
    const existingMembership = await this.tenantMemberRepository.findOne({
      where: { tenantId: tenant.id, userId },
    });

    if (existingMembership) {
      throw new ConflictException('You are already a member of this tenant');
    }

    // Create membership with default CHILD role
    const membership = this.tenantMemberRepository.create({
      tenantId: tenant.id,
      userId,
      role: TenantMemberRole.CHILD,
      isActive: true,
    });

    await this.tenantMemberRepository.save(membership);

    return tenant;
  }

  async getUserTenants(userId: string): Promise<TenantMember[]> {
    return this.tenantMemberRepository.find({
      where: { userId, isActive: true },
      relations: ['tenant'],
      order: { joinedAt: 'ASC' },
    });
  }

  async removeMember(tenantId: string, userId: string): Promise<void> {
    const membership = await this.tenantMemberRepository.findOne({
      where: { tenantId, userId, isActive: true },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    // Soft delete by setting isActive to false
    membership.isActive = false;
    await this.tenantMemberRepository.save(membership);
  }

  private async generateUniqueTenantCode(): Promise<string> {
    let code: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 5; // Reduced since
    //
    //
    // d has much lower collision probability

    while (!isUnique && attempts < maxAttempts) {
      code = this.generateCode(); // Use nanoid generator
      const existing = await this.tenantRepository.findOne({
        where: { tenantCode: code },
      });
      isUnique = !existing;
      attempts++;
    }

    if (!isUnique) {
      throw new BadRequestException('Unable to generate unique tenant code');
    }

    return code!;
  }
}
