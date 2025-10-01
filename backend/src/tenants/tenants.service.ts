import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { customAlphabet } from 'nanoid';
import { Tenant, TenantMember, User } from '@/entities';
import {
  CreateTenantDto,
  InviteMemberDto,
  JoinTenantDto,
  UpdateMemberRoleDto,
} from './dto';
import { TenantMemberRole } from '@tiggpro/shared';

@Injectable()
export class TenantsService {
  // Create nanoid generator with readable alphabet (excludes confusing characters like 0, O, I, l, 1)
  private readonly generateCode = customAlphabet(
    '23456789ABCDEFGHJKLMNPQRSTUVWXYZ',
    8,
  );

  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(TenantMember)
    private tenantMemberRepository: Repository<TenantMember>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createTenant(
    createTenantDto: CreateTenantDto,
    createdById: string,
  ): Promise<Tenant> {
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

  async inviteMember(
    tenantId: string,
    inviteMemberDto: InviteMemberDto,
    invitedById: string,
  ): Promise<void> {
    // Verify tenant exists
    await this.getTenantById(tenantId);

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

  async joinTenant(
    joinTenantDto: JoinTenantDto,
    userId: string,
  ): Promise<Tenant> {
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

  async updateMemberRole(
    tenantId: string,
    userId: string,
    updateMemberRoleDto: UpdateMemberRoleDto,
  ): Promise<TenantMember> {
    // Verify tenant exists
    await this.getTenantById(tenantId);

    // Find the membership
    const membership = await this.tenantMemberRepository.findOne({
      where: { tenantId, userId, isActive: true },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    // Update the role
    membership.role = updateMemberRoleDto.role;
    const updatedMembership =
      await this.tenantMemberRepository.save(membership);

    return updatedMembership;
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

  async deleteTenant(tenantId: string): Promise<void> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Use a transaction to ensure all deletes succeed or all fail
    await this.tenantRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // Delete in order to avoid foreign key constraint violations

        // 1. Delete user achievements for this tenant
        await transactionalEntityManager.query(
          'DELETE FROM user_achievements WHERE tenant_id = $1',
          [tenantId],
        );

        // 2. Delete user points for this tenant
        await transactionalEntityManager.query(
          'DELETE FROM user_points WHERE tenant_id = $1',
          [tenantId],
        );

        // 3. Delete notifications for this tenant
        await transactionalEntityManager.query(
          'DELETE FROM notifications WHERE tenant_id = $1',
          [tenantId],
        );

        // 4. Delete chore submissions (depends on chore assignments)
        await transactionalEntityManager.query(
          `
        DELETE FROM chore_submissions
        WHERE assignment_id IN (
          SELECT id FROM chore_assignments WHERE chore_id IN (
            SELECT id FROM chores WHERE tenant_id = $1
          )
        )
      `,
          [tenantId],
        );

        // 5. Delete chore assignments (depends on chores)
        await transactionalEntityManager.query(
          `
        DELETE FROM chore_assignments
        WHERE chore_id IN (
          SELECT id FROM chores WHERE tenant_id = $1
        )
      `,
          [tenantId],
        );

        // 6. Delete chores
        await transactionalEntityManager.query(
          'DELETE FROM chores WHERE tenant_id = $1',
          [tenantId],
        );

        // 7. Delete tenant members
        await transactionalEntityManager.query(
          'DELETE FROM tenant_members WHERE tenant_id = $1',
          [tenantId],
        );

        // 8. Finally, delete the tenant itself
        await transactionalEntityManager.query(
          'DELETE FROM tenants WHERE id = $1',
          [tenantId],
        );
      },
    );

    // Note: In a production app, you might want to:
    // 1. Soft delete instead of hard delete
    // 2. Archive related data instead of deleting
    // 3. Add additional validation (e.g., prevent deletion if there are active chores)
    // 4. Send notifications to members before deletion
    // 5. Allow data export before deletion
  }

  // Membership/Permission helpers for cross-module reuse
  async getMembership(tenantId: string, userId: string): Promise<TenantMember> {
    const membership = await this.tenantMemberRepository.findOne({
      where: { tenantId, userId, isActive: true },
    });
    if (!membership) {
      throw new NotFoundException('Membership not found');
    }
    return membership;
  }

  async verifyUserMembership(
    tenantId: string,
    userId: string,
  ): Promise<TenantMember> {
    return this.getMembership(tenantId, userId);
  }

  async verifyUserPermission(
    tenantId: string,
    userId: string,
    allowedRoles: TenantMemberRole[],
  ): Promise<void> {
    const membership = await this.getMembership(tenantId, userId);
    if (!allowedRoles.includes(membership.role)) {
      throw new NotFoundException('Insufficient permissions for this action');
    }
  }
}
