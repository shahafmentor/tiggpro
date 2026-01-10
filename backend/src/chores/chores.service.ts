import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Chore,
  ChoreAssignment,
  ChoreInstance,
  ChoreRecurrence,
  TenantMember,
  User,
} from '@/entities';
import {
  CreateChoreDto,
  UpdateChoreDto,
  AssignChoreDto,
  AssignCustomChoreDto,
} from './dto';
import { AssignmentStatus, TenantMemberRole } from '@tiggpro/shared';
import { RealtimeEventsService } from '@/websocket/realtime-events.service';
import { SchedulerService } from './scheduler.service';

@Injectable()
export class ChoresService {
  constructor(
    @InjectRepository(Chore)
    private choreRepository: Repository<Chore>,
    @InjectRepository(ChoreInstance)
    private choreInstanceRepository: Repository<ChoreInstance>,
    @InjectRepository(ChoreAssignment)
    private assignmentRepository: Repository<ChoreAssignment>,
    @InjectRepository(ChoreRecurrence)
    private recurrenceRepository: Repository<ChoreRecurrence>,
    @InjectRepository(TenantMember)
    private tenantMemberRepository: Repository<TenantMember>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private realtimeEventsService: RealtimeEventsService,
    private schedulerService: SchedulerService,
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
    const activeAssignments = await this.assignmentRepository
      .createQueryBuilder('assignment')
      .innerJoin('assignment.choreInstance', 'choreInstance')
      .where('choreInstance.templateChoreId = :templateChoreId', {
        templateChoreId: choreId,
      })
      .andWhere('assignment.status = :status', { status: AssignmentStatus.PENDING })
      .getCount();

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
    const assigneeMembership = await this.verifyUserMembership(
      tenantId,
      assignChoreDto.assignedTo,
    );
    if (assigneeMembership.role !== TenantMemberRole.CHILD) {
      throw new BadRequestException('Chores can only be assigned to children');
    }

    // If this is a recurring chore, handle it differently
    if (chore.isRecurring && chore.recurrencePattern) {
      return this.createRecurringAssignment(
        chore,
        tenantId,
        assignChoreDto,
        assignedById,
      );
    }

    // Non-recurring chore: check for existing pending assignment
    const existingAssignment = await this.assignmentRepository
      .createQueryBuilder('assignment')
      .innerJoin('assignment.choreInstance', 'choreInstance')
      .where('choreInstance.templateChoreId = :templateChoreId', {
        templateChoreId: choreId,
      })
      .andWhere('assignment.assignedTo = :assignedTo', {
        assignedTo: assignChoreDto.assignedTo,
      })
      .andWhere('assignment.status = :status', {
        status: AssignmentStatus.PENDING,
      })
      .getOne();

    if (existingAssignment) {
      throw new BadRequestException(
        'This chore is already assigned to this user',
      );
    }

    // Create a snapshot instance at assignment time (copy-on-assign)
    const choreInstance = this.choreInstanceRepository.create({
      tenantId,
      templateChoreId: chore.id,
      title: chore.title,
      description: chore.description,
      pointsReward: chore.pointsReward,
      difficultyLevel: chore.difficultyLevel,
      estimatedDurationMinutes: chore.estimatedDurationMinutes,
      isRecurring: chore.isRecurring,
      recurrencePattern: chore.recurrencePattern,
      createdBy: assignedById,
    });
    const savedInstance = await this.choreInstanceRepository.save(choreInstance);

    const assignment = this.assignmentRepository.create({
      choreInstanceId: savedInstance.id,
      assignedTo: assignChoreDto.assignedTo,
      assignedBy: assignedById,
      dueDate: new Date(assignChoreDto.dueDate),
      priority: assignChoreDto.priority,
      status: AssignmentStatus.PENDING,
    });

    const savedAssignment = await this.assignmentRepository.save(assignment);

    // Get user details for real-time event
    const [assignedToUser, assignedByUser] = await Promise.all([
      this.userRepository.findOne({ where: { id: assignChoreDto.assignedTo } }),
      this.userRepository.findOne({ where: { id: assignedById } }),
    ]);

    if (assignedToUser && assignedByUser) {
      // Emit real-time event for chore assignment
      this.realtimeEventsService.emitChoreAssigned(
        tenantId,
        {
          assignmentId: savedAssignment.id,
          choreInstanceId: savedInstance.id,
          templateChoreId: chore.id,
          choreTitle: savedInstance.title,
          assignedTo: {
            id: assignedToUser.id,
            displayName: assignedToUser.displayName,
            email: assignedToUser.email,
          },
          assignedBy: {
            id: assignedByUser.id,
            displayName: assignedByUser.displayName,
            email: assignedByUser.email,
          },
          dueDate: new Date(savedAssignment.dueDate).toISOString(),
          priority: savedAssignment.priority,
          pointsReward: savedInstance.pointsReward,
        },
        assignedById, // Exclude the assigner from receiving the notification
      );
    }

    return savedAssignment;
  }

  /**
   * Create a recurring assignment series.
   * This creates a ChoreRecurrence record and generates assignments for the rolling window.
   */
  private async createRecurringAssignment(
    chore: Chore,
    tenantId: string,
    assignChoreDto: AssignChoreDto,
    assignedById: string,
  ): Promise<ChoreAssignment> {
    // Check if there's already an active recurrence for this chore and user
    const existingRecurrence = await this.recurrenceRepository.findOne({
      where: {
        templateChoreId: chore.id,
        assignedTo: assignChoreDto.assignedTo,
        isActive: true,
      },
    });

    // If there's an existing active recurrence, end it before creating the new one
    // This allows parents to easily re-assign with updated settings
    if (existingRecurrence) {
      existingRecurrence.isActive = false;
      await this.recurrenceRepository.save(existingRecurrence);
    }

    const startDate = new Date(assignChoreDto.dueDate);
    // Set lastGeneratedDate to the day before start so the first occurrence is included
    const lastGeneratedDate = new Date(startDate);
    lastGeneratedDate.setDate(lastGeneratedDate.getDate() - 1);

    // Build the recurrence pattern with startDate
    const recurrencePattern = {
      ...chore.recurrencePattern,
      startDate: startDate.toISOString().split('T')[0],
    };

    // Create the recurrence record
    const recurrence = await this.recurrenceRepository.save(
      this.recurrenceRepository.create({
        tenantId,
        templateChoreId: chore.id,
        assignedTo: assignChoreDto.assignedTo,
        assignedBy: assignedById,
        recurrencePattern,
        priority: assignChoreDto.priority,
        lastGeneratedDate,
        isActive: true,
      }),
    );

    // Load the template chore for the scheduler
    recurrence.templateChore = chore;

    // Generate initial assignments for the rolling window
    const createdCount = await this.schedulerService.generateInitialAssignments(recurrence);

    if (createdCount === 0) {
      // No assignments were created - this might be because the pattern doesn't match any dates
      throw new BadRequestException(
        'No assignments could be created for this recurrence pattern. Please check the pattern configuration.',
      );
    }

    // Return the first created assignment
    const firstAssignment = await this.assignmentRepository
      .createQueryBuilder('assignment')
      .innerJoin('assignment.choreInstance', 'choreInstance')
      .where('choreInstance.templateChoreId = :templateChoreId', {
        templateChoreId: chore.id,
      })
      .andWhere('assignment.assignedTo = :assignedTo', {
        assignedTo: assignChoreDto.assignedTo,
      })
      .andWhere('assignment.status = :status', {
        status: AssignmentStatus.PENDING,
      })
      .orderBy('assignment.dueDate', 'ASC')
      .getOne();

    if (!firstAssignment) {
      throw new BadRequestException('Failed to create recurring assignments');
    }

    // Emit real-time event for the first assignment
    const [assignedToUser, assignedByUser] = await Promise.all([
      this.userRepository.findOne({ where: { id: assignChoreDto.assignedTo } }),
      this.userRepository.findOne({ where: { id: assignedById } }),
    ]);

    if (assignedToUser && assignedByUser) {
      this.realtimeEventsService.emitChoreAssigned(
        tenantId,
        {
          assignmentId: firstAssignment.id,
          choreInstanceId: firstAssignment.choreInstanceId,
          templateChoreId: chore.id,
          choreTitle: chore.title,
          assignedTo: {
            id: assignedToUser.id,
            displayName: assignedToUser.displayName,
            email: assignedToUser.email,
          },
          assignedBy: {
            id: assignedByUser.id,
            displayName: assignedByUser.displayName,
            email: assignedByUser.email,
          },
          dueDate: new Date(firstAssignment.dueDate).toISOString(),
          priority: firstAssignment.priority,
          pointsReward: chore.pointsReward,
        },
        assignedById,
      );
    }

    return firstAssignment;
  }

  async assignCustomChore(
    tenantId: string,
    dto: AssignCustomChoreDto,
    assignedById: string,
  ): Promise<ChoreAssignment> {
    // Verify user has permission to assign chores (ADMIN or PARENT)
    await this.verifyUserPermission(tenantId, assignedById, [
      TenantMemberRole.ADMIN,
      TenantMemberRole.PARENT,
    ]);

    // Verify assignee is a child in the tenant
    const assigneeMembership = await this.verifyUserMembership(
      tenantId,
      dto.assignedTo,
    );
    if (assigneeMembership.role !== TenantMemberRole.CHILD) {
      throw new BadRequestException('Chores can only be assigned to children');
    }

    const dueDate = new Date(dto.dueDate);

    // Duplicate prevention (exact duplicates) for one-off chores:
    // same child + same due date + pending + same title + templateChoreId IS NULL
    const existingOneOff = await this.assignmentRepository
      .createQueryBuilder('assignment')
      .innerJoin('assignment.choreInstance', 'choreInstance')
      .where('assignment.assignedTo = :assignedTo', {
        assignedTo: dto.assignedTo,
      })
      .andWhere('assignment.status = :status', {
        status: AssignmentStatus.PENDING,
      })
      .andWhere('assignment.dueDate = :dueDate', { dueDate })
      .andWhere('choreInstance.title = :title', { title: dto.title })
      .andWhere('choreInstance.templateChoreId IS NULL')
      .getOne();

    if (existingOneOff) {
      throw new BadRequestException(
        'This chore is already assigned to this user for the same due date',
      );
    }

    // Optional: create template first
    const saveAsTemplate = dto.saveAsTemplate ?? false;
    let templateChore: Chore | null = null;

    if (saveAsTemplate) {
      templateChore = await this.choreRepository.save(
        this.choreRepository.create({
          tenantId,
          title: dto.title,
          description: dto.description ?? null,
          pointsReward: dto.pointsReward,
          difficultyLevel: dto.difficultyLevel,
          estimatedDurationMinutes: dto.estimatedDurationMinutes,
          isRecurring: dto.isRecurring,
          recurrencePattern: dto.recurrencePattern,
          createdBy: assignedById,
          isActive: true,
        }),
      );
    }

    // Create instance snapshot (copy-on-assign)
    const choreInstance = this.choreInstanceRepository.create({
      tenantId,
      templateChoreId: templateChore?.id ?? null,
      title: dto.title,
      description: dto.description ?? null,
      pointsReward: dto.pointsReward,
      difficultyLevel: dto.difficultyLevel,
      estimatedDurationMinutes: dto.estimatedDurationMinutes,
      isRecurring: dto.isRecurring,
      recurrencePattern: dto.recurrencePattern,
      createdBy: assignedById,
    });
    const savedInstance = await this.choreInstanceRepository.save(choreInstance);

    const assignment = this.assignmentRepository.create({
      choreInstanceId: savedInstance.id,
      assignedTo: dto.assignedTo,
      assignedBy: assignedById,
      dueDate,
      priority: dto.priority,
      status: AssignmentStatus.PENDING,
    });
    const savedAssignment = await this.assignmentRepository.save(assignment);

    // Real-time event
    const [assignedToUser, assignedByUser] = await Promise.all([
      this.userRepository.findOne({ where: { id: dto.assignedTo } }),
      this.userRepository.findOne({ where: { id: assignedById } }),
    ]);

    if (assignedToUser && assignedByUser) {
      this.realtimeEventsService.emitChoreAssigned(
        tenantId,
        {
          assignmentId: savedAssignment.id,
          choreInstanceId: savedInstance.id,
          templateChoreId: templateChore?.id ?? null,
          choreTitle: savedInstance.title,
          assignedTo: {
            id: assignedToUser.id,
            displayName: assignedToUser.displayName,
            email: assignedToUser.email,
          },
          assignedBy: {
            id: assignedByUser.id,
            displayName: assignedByUser.displayName,
            email: assignedByUser.email,
          },
          dueDate: new Date(savedAssignment.dueDate).toISOString(),
          priority: savedAssignment.priority,
          pointsReward: savedInstance.pointsReward,
        },
        assignedById,
      );
    }

    return savedAssignment;
  }

  async getActiveAssignmentsForTemplate(
    tenantId: string,
    templateChoreId: string,
    userId: string,
  ): Promise<ChoreAssignment[]> {
    // Verify user has permission to view assignments for templates (ADMIN or PARENT)
    await this.verifyUserPermission(tenantId, userId, [
      TenantMemberRole.ADMIN,
      TenantMemberRole.PARENT,
    ]);

    // Verify template exists in this tenant
    await this.getChoreById(templateChoreId, tenantId, userId);

    return this.assignmentRepository
      .createQueryBuilder('assignment')
      .innerJoinAndSelect('assignment.choreInstance', 'choreInstance')
      .leftJoinAndSelect('assignment.assignee', 'assignee')
      .leftJoinAndSelect('assignment.assigner', 'assigner')
      .where('choreInstance.tenantId = :tenantId', { tenantId })
      .andWhere('choreInstance.templateChoreId = :templateChoreId', {
        templateChoreId,
      })
      .andWhere('assignment.status IN (:...statuses)', {
        statuses: [
          AssignmentStatus.PENDING,
          AssignmentStatus.SUBMITTED,
          AssignmentStatus.OVERDUE,
        ],
      })
      .orderBy('assignment.createdAt', 'DESC')
      .getMany();
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
