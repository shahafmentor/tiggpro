import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as ApiDoc,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from '@/auth/auth.service';
import { SyncUserDto, UpdateProfileDto } from '@/auth/dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import type { ApiResponse as ApiResponseType } from '@tiggpro/shared';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('sync-user')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync user from OAuth provider' })
  @ApiBody({ type: SyncUserDto })
  @ApiDoc({ status: 200, description: 'User synced successfully' })
  @ApiDoc({ status: 400, description: 'Invalid user data' })
  async syncUser(@Body() syncUserDto: SyncUserDto): Promise<ApiResponseType> {
    try {
      const user = await this.authService.syncUser(syncUserDto);
      const loginResponse = await this.authService.login(user);

      return {
        success: true,
        data: loginResponse,
        message: 'User synchronized successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync user',
      };
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiDoc({ status: 200, description: 'Profile retrieved successfully' })
  @ApiDoc({ status: 401, description: 'Unauthorized' })
  async getProfile(
    @Request() req: { user: { id: string } },
  ): Promise<ApiResponseType> {
    try {
      const user = await this.authService.validateUserById(req.user.id);

      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      return {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          provider: user.provider,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        message: 'Profile retrieved successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get profile',
      };
    }
  }

  @Get('validate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  validateToken(@Request() req: { user: any }): ApiResponseType {
    // If we reach here, the JWT is valid
    return {
      success: true,
      data: req.user,
      message: 'Token is valid',
    };
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Body() updateProfileDto: UpdateProfileDto,
    @Request() req: { user: { id: string } },
  ): Promise<ApiResponseType> {
    try {
      const updatedUser = await this.authService.updateProfile(
        req.user.id,
        updateProfileDto,
      );

      return {
        success: true,
        data: {
          id: updatedUser.id,
          email: updatedUser.email,
          displayName: updatedUser.displayName,
          avatarUrl: updatedUser.avatarUrl,
          provider: updatedUser.provider,
          isActive: updatedUser.isActive,
          updatedAt: updatedUser.updatedAt,
        },
        message: 'Profile updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to update profile',
      };
    }
  }
}
