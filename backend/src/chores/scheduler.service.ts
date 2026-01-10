import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import {
  Chore,
  ChoreAssignment,
  ChoreInstance,
  ChoreRecurrence,
} from '@/entities';
import { RecurrenceService } from './recurrence.service';
import { AssignmentStatus } from '@tiggpro/shared';

/**
 * SchedulerService handles the automatic generation of recurring chore assignments.
 * It runs a daily cron job to maintain a rolling window of assignments (default: 14 days).
 */
@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);
  private readonly WINDOW_DAYS = 14; // How many days ahead to generate

  constructor(
    @InjectRepository(ChoreRecurrence)
    private recurrenceRepository: Repository<ChoreRecurrence>,
    @InjectRepository(Chore)
    private choreRepository: Repository<Chore>,
    @InjectRepository(ChoreInstance)
    private choreInstanceRepository: Repository<ChoreInstance>,
    @InjectRepository(ChoreAssignment)
    private assignmentRepository: Repository<ChoreAssignment>,
    private recurrenceService: RecurrenceService,
  ) {}

  /**
   * Daily cron job that runs at 1:00 AM to generate recurring assignments.
   * Uses 1 AM instead of midnight to avoid potential timezone issues.
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleRecurringChoresGeneration(): Promise<void> {
    this.logger.log('Starting recurring chores generation...');

    try {
      const { from, to } = this.recurrenceService.getGenerationWindow(
        this.WINDOW_DAYS,
      );
      this.logger.log(`Generation window: ${from.toISOString()} to ${to.toISOString()}`);

      // Get all active recurrences that need processing
      const recurrences = await this.recurrenceRepository.find({
        where: {
          isActive: true,
          // Only process recurrences where lastGeneratedDate is before the window end
          lastGeneratedDate: LessThan(to),
        },
        relations: ['templateChore'],
      });

      this.logger.log(`Found ${recurrences.length} active recurrences to process`);

      let totalCreated = 0;
      for (const recurrence of recurrences) {
        try {
          const created = await this.processRecurrence(recurrence, to);
          totalCreated += created;
        } catch (error) {
          this.logger.error(
            `Failed to process recurrence ${recurrence.id}: ${error.message}`,
            error.stack,
          );
        }
      }

      this.logger.log(
        `Recurring chores generation complete. Created ${totalCreated} assignments.`,
      );
    } catch (error) {
      this.logger.error(
        `Recurring chores generation failed: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Process a single recurrence and generate assignments for the window.
   * Returns the number of assignments created.
   */
  private async processRecurrence(
    recurrence: ChoreRecurrence,
    windowEnd: Date,
  ): Promise<number> {
    // Check if the template chore is still active
    const templateChore = recurrence.templateChore;
    if (!templateChore || !templateChore.isActive) {
      this.logger.warn(
        `Skipping recurrence ${recurrence.id}: template chore is inactive`,
      );
      return 0;
    }

    // Check if the recurrence has ended
    const pattern = recurrence.recurrencePattern;
    if (pattern.endDate) {
      const endDate = new Date(pattern.endDate);
      if (endDate < new Date()) {
        // Deactivate the recurrence since it has ended
        await this.recurrenceRepository.update(recurrence.id, { isActive: false });
        this.logger.log(`Deactivated ended recurrence ${recurrence.id}`);
        return 0;
      }
    }

    // Calculate the generation range
    // Start from the day after lastGeneratedDate
    const fromDate = new Date(recurrence.lastGeneratedDate);
    fromDate.setDate(fromDate.getDate() + 1);

    // Generate occurrences for the range
    const occurrences = this.recurrenceService.generateOccurrences(
      pattern,
      fromDate,
      windowEnd,
    );

    if (occurrences.length === 0) {
      return 0;
    }

    this.logger.log(
      `Generating ${occurrences.length} assignments for recurrence ${recurrence.id}`,
    );

    // Create assignments for each occurrence
    let created = 0;
    let maxGeneratedDate = recurrence.lastGeneratedDate;

    for (const dueDate of occurrences) {
      try {
        // Check if an assignment already exists for this date
        const existingAssignment = await this.findExistingAssignment(
          recurrence.templateChoreId,
          recurrence.assignedTo,
          dueDate,
        );

        if (existingAssignment) {
          this.logger.debug(
            `Assignment already exists for ${dueDate.toISOString()}, skipping`,
          );
          // Still update maxGeneratedDate to avoid re-checking
          if (dueDate > maxGeneratedDate) {
            maxGeneratedDate = dueDate;
          }
          continue;
        }

        // Create the chore instance (snapshot)
        const choreInstance = await this.choreInstanceRepository.save(
          this.choreInstanceRepository.create({
            tenantId: recurrence.tenantId,
            templateChoreId: templateChore.id,
            title: templateChore.title,
            description: templateChore.description,
            pointsReward: templateChore.pointsReward,
            difficultyLevel: templateChore.difficultyLevel,
            estimatedDurationMinutes: templateChore.estimatedDurationMinutes,
            isRecurring: true,
            recurrencePattern: pattern,
            createdBy: recurrence.assignedBy,
          }),
        );

        // Create the assignment
        await this.assignmentRepository.save(
          this.assignmentRepository.create({
            choreInstanceId: choreInstance.id,
            assignedTo: recurrence.assignedTo,
            assignedBy: recurrence.assignedBy,
            dueDate: dueDate,
            priority: recurrence.priority,
            status: AssignmentStatus.PENDING,
          }),
        );

        created++;
        if (dueDate > maxGeneratedDate) {
          maxGeneratedDate = dueDate;
        }
      } catch (error) {
        this.logger.error(
          `Failed to create assignment for ${dueDate.toISOString()}: ${error.message}`,
        );
      }
    }

    // Update the lastGeneratedDate
    if (maxGeneratedDate > recurrence.lastGeneratedDate) {
      await this.recurrenceRepository.update(recurrence.id, {
        lastGeneratedDate: maxGeneratedDate,
      });
    }

    return created;
  }

  /**
   * Check if an assignment already exists for a given template, assignee, and date.
   */
  private async findExistingAssignment(
    templateChoreId: string,
    assignedTo: string,
    dueDate: Date,
  ): Promise<ChoreAssignment | null> {
    // Format the date for comparison (date only, no time)
    const dueDateStr = this.recurrenceService.formatDate(dueDate);

    return this.assignmentRepository
      .createQueryBuilder('assignment')
      .innerJoin('assignment.choreInstance', 'instance')
      .where('instance.templateChoreId = :templateChoreId', { templateChoreId })
      .andWhere('assignment.assignedTo = :assignedTo', { assignedTo })
      .andWhere('DATE(assignment.dueDate) = :dueDate', { dueDate: dueDateStr })
      .getOne();
  }

  /**
   * Generate initial assignments when a new recurrence is created.
   * This is called immediately after creating a ChoreRecurrence.
   */
  async generateInitialAssignments(recurrence: ChoreRecurrence): Promise<number> {
    this.logger.log(`Generating initial assignments for recurrence ${recurrence.id}`);

    const { to } = this.recurrenceService.getGenerationWindow(this.WINDOW_DAYS);

    // Load the template chore if not already loaded
    let templateChore = recurrence.templateChore;
    if (!templateChore) {
      const foundChore = await this.choreRepository.findOne({
        where: { id: recurrence.templateChoreId },
      });
      if (!foundChore) {
        throw new Error(`Template chore ${recurrence.templateChoreId} not found`);
      }
      templateChore = foundChore;
      recurrence.templateChore = foundChore;
    }

    return this.processRecurrence(recurrence, to);
  }
}
