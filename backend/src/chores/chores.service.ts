import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chore, ChoreAssignment, TenantMember } from '@/entities';
import { CreateChoreDto, UpdateChoreDto, AssignChoreDto } from './dto';
import { AssignmentStatus, TenantMemberRole } from '@tiggpro/shared';

@Injectable()
export class ChoresService {
  constructor(
    @InjectRepository(Chore)
    private choreRepository: Repository<Chore>,
    @InjectRepository(ChoreAssignment)
    private assignmentRepository: Repository<ChoreAssignment>,
    @InjectRepository(TenantMember)
    private tenantMemberRepository: Repository<TenantMember>,
  ) {}

  async createChore(
    tenantId: string,
    createChoreDto: CreateChoreDto,
    createdById: string,
  ): Promise<Chore> {
    // Verify user has permission to create chores (ADMIN or PARENT)
    await this.verifyUserPermission(tenantId, createdById, [
      TenantMemberRole.ADMIN,
      TenantMemberRole.PARENT,
    ]);

    const chore = this.choreRepository.create({
      ...createChoreDto,
      tenantId,
      createdBy: createdById,
      isActive: true,
    });

    return this.choreRepository.save(chore);
  }

  async getChoresByTenant(tenantId: string, userId: string): Promise<Chore[]> {
    // Verify user is member of tenant
    await this.verifyUserMembership(tenantId, userId);

    return this.choreRepository.find({
      where: { tenantId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getChoreById(
    choreId: string,
    tenantId: string,
    userId: string,
  ): Promise<Chore> {
    // Verify user is member of tenant
    await this.verifyUserMembership(tenantId, userId);

    const chore = await this.choreRepository.findOne({
      where: { id: choreId, tenantId, isActive: true },
    });

    if (!chore) {
      throw new NotFoundException('Chore not found');
    }

    return chore;
  }

  async updateChore(
    choreId: string,
    tenantId: string,
    updateChoreDto: UpdateChoreDto,
    userId: string,
  ): Promise<Chore> {
    const chore = await this.getChoreById(choreId, tenantId, userId);

    // Verify user has permission to update chores (ADMIN, PARENT, or creator)
    const userRole = await this.getUserRole(tenantId, userId);
    if (userRole === TenantMemberRole.CHILD && chore.createdBy !== userId) {
      throw new ForbiddenException('You can only update chores you created');
    }

    Object.assign(chore, updateChoreDto);
    return this.choreRepository.save(chore);
  }

  async deleteChore(
    choreId: string,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    const chore = await this.getChoreById(choreId, tenantId, userId);

    // Verify user has permission to delete chores (ADMIN, PARENT, or creator)
    const userRole = await this.getUserRole(tenantId, userId);
    if (userRole === TenantMemberRole.CHILD && chore.createdBy !== userId) {
      throw new ForbiddenException('You can only delete chores you created');
    }

    // Check if chore has active assignments
    const activeAssignments = await this.assignmentRepository.count({
      where: {
        choreId,
        status: AssignmentStatus.PENDING,
      },
    });

    if (activeAssignments > 0) {
      throw new BadRequestException(
        'Cannot delete chore with active assignments',
      );
    }

    // Soft delete
    chore.isActive = false;
    await this.choreRepository.save(chore);
  }

  async assignChore(
    choreId: string,
    tenantId: string,
    assignChoreDto: AssignChoreDto,
    assignedById: string,
  ): Promise<ChoreAssignment> {
    const chore = await this.getChoreById(choreId, tenantId, assignedById);

    // Verify user has permission to assign chores (ADMIN or PARENT)
    await this.verifyUserPermission(tenantId, assignedById, [
      TenantMemberRole.ADMIN,
      TenantMemberRole.PARENT,
    ]);

    // Verify assignee is a member of the tenant
    await this.verifyUserMembership(tenantId, assignChoreDto.assignedTo);

    // Check if there's already a pending assignment for this chore and user
    const existingAssignment = await this.assignmentRepository.findOne({
      where: {
        choreId,
        assignedTo: assignChoreDto.assignedTo,
        status: AssignmentStatus.PENDING,
      },
    });

    if (existingAssignment) {
      throw new BadRequestException(
        'This chore is already assigned to this user',
      );
    }

    const assignment = this.assignmentRepository.create({
      choreId,
      assignedTo: assignChoreDto.assignedTo,
      assignedBy: assignedById,
      dueDate: new Date(assignChoreDto.dueDate),
      priority: assignChoreDto.priority,
      status: AssignmentStatus.PENDING,
    });

    return this.assignmentRepository.save(assignment);
  }

  private async verifyUserMembership(
    tenantId: string,
    userId: string,
  ): Promise<TenantMember> {
    const membership = await this.tenantMemberRepository.findOne({
      where: { tenantId, userId, isActive: true },
    });

    if (!membership) {
      throw new ForbiddenException('User is not a member of this tenant');
    }

    return membership;
  }

  private async verifyUserPermission(
    tenantId: string,
    userId: string,
    allowedRoles: TenantMemberRole[],
  ): Promise<void> {
    const membership = await this.verifyUserMembership(tenantId, userId);

    if (!allowedRoles.includes(membership.role)) {
      throw new ForbiddenException('Insufficient permissions for this action');
    }
  }

  private async getUserRole(
    tenantId: string,
    userId: string,
  ): Promise<TenantMemberRole> {
    const membership = await this.verifyUserMembership(tenantId, userId);
    return membership.role;
  }
}
