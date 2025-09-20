import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse as ApiDoc,
} from '@nestjs/swagger';
import { ChoresService } from './chores.service';
import { CreateChoreDto, UpdateChoreDto, AssignChoreDto } from './dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { TenantMembershipGuard } from '@/auth/guards/tenant-membership.guard';
import type { ApiResponse } from '@tiggpro/shared';

@ApiTags('Chores')
@ApiBearerAuth()
@Controller('tenants/:tenantId/chores')
@UseGuards(JwtAuthGuard, TenantMembershipGuard)
export class ChoresController {
  constructor(private readonly choresService: ChoresService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new chore',
    description: 'Creates a new chore within a tenant',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiDoc({ status: 201, description: 'Chore created successfully' })
  @ApiDoc({ status: 400, description: 'Invalid request data' })
  @ApiDoc({ status: 403, description: 'Insufficient permissions' })
  async createChore(
    @Param('tenantId') tenantId: string,
    @Body() createChoreDto: CreateChoreDto,
    @Request() req: { user: { id: string } },
  ): Promise<ApiResponse> {
    try {
      const chore = await this.choresService.createChore(
        tenantId,
        createChoreDto,
        req.user.id,
      );

      return {
        success: true,
        data: chore,
        message: 'Chore created successfully',
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to create chore',
      };
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Get all chores',
    description: 'Retrieves all chores for a tenant',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiDoc({ status: 200, description: 'Chores retrieved successfully' })
  @ApiDoc({ status: 403, description: 'Insufficient permissions' })
  async getChores(
    @Param('tenantId') tenantId: string,
    @Request() req: { user: { id: string } },
  ): Promise<ApiResponse> {
    try {
      const chores = await this.choresService.getChoresByTenant(
        tenantId,
        req.user.id,
      );

      return {
        success: true,
        data: chores,
        message: 'Chores retrieved successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get chores',
      };
    }
  }

  @Get(':choreId')
  @ApiOperation({
    summary: 'Get a specific chore',
    description: 'Retrieves a specific chore by ID',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiParam({ name: 'choreId', description: 'Chore ID' })
  @ApiDoc({ status: 200, description: 'Chore retrieved successfully' })
  @ApiDoc({ status: 404, description: 'Chore not found' })
  @ApiDoc({ status: 403, description: 'Insufficient permissions' })
  async getChore(
    @Param('tenantId') tenantId: string,
    @Param('choreId') choreId: string,
    @Request() req: { user: { id: string } },
  ): Promise<ApiResponse> {
    try {
      const chore = await this.choresService.getChoreById(
        choreId,
        tenantId,
        req.user.id,
      );

      return {
        success: true,
        data: chore,
        message: 'Chore retrieved successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get chore',
      };
    }
  }

  @Put(':choreId')
  @ApiOperation({
    summary: 'Update a chore',
    description: 'Updates an existing chore',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiParam({ name: 'choreId', description: 'Chore ID' })
  @ApiDoc({ status: 200, description: 'Chore updated successfully' })
  @ApiDoc({ status: 404, description: 'Chore not found' })
  @ApiDoc({ status: 403, description: 'Insufficient permissions' })
  async updateChore(
    @Param('tenantId') tenantId: string,
    @Param('choreId') choreId: string,
    @Body() updateChoreDto: UpdateChoreDto,
    @Request() req: { user: { id: string } },
  ): Promise<ApiResponse> {
    try {
      const chore = await this.choresService.updateChore(
        choreId,
        tenantId,
        updateChoreDto,
        req.user.id,
      );

      return {
        success: true,
        data: chore,
        message: 'Chore updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to update chore',
      };
    }
  }

  @Delete(':choreId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a chore',
    description: 'Deletes an existing chore',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiParam({ name: 'choreId', description: 'Chore ID' })
  @ApiDoc({ status: 200, description: 'Chore deleted successfully' })
  @ApiDoc({ status: 404, description: 'Chore not found' })
  @ApiDoc({ status: 403, description: 'Insufficient permissions' })
  async deleteChore(
    @Param('tenantId') tenantId: string,
    @Param('choreId') choreId: string,
    @Request() req: { user: { id: string } },
  ): Promise<ApiResponse> {
    try {
      await this.choresService.deleteChore(choreId, tenantId, req.user.id);

      return {
        success: true,
        message: 'Chore deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to delete chore',
      };
    }
  }

  @Post(':choreId/assign')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Assign a chore',
    description: 'Assigns a chore to a specific user',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiParam({ name: 'choreId', description: 'Chore ID' })
  @ApiDoc({ status: 201, description: 'Chore assigned successfully' })
  @ApiDoc({ status: 404, description: 'Chore not found' })
  @ApiDoc({ status: 403, description: 'Insufficient permissions' })
  async assignChore(
    @Param('tenantId') tenantId: string,
    @Param('choreId') choreId: string,
    @Body() assignChoreDto: AssignChoreDto,
    @Request() req: { user: { id: string } },
  ): Promise<ApiResponse> {
    try {
      const assignment = await this.choresService.assignChore(
        choreId,
        tenantId,
        assignChoreDto,
        req.user.id,
      );

      return {
        success: true,
        data: assignment,
        message: 'Chore assigned successfully',
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to assign chore',
      };
    }
  }
}
