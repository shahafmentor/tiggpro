import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '@/auth/auth.service';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const jwtSecret = configService.get<string>('app.jwtSecret');
    if (!jwtSecret) {
      throw new Error('JWT secret is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    // This payload comes from the JWT token
    // We can validate the user still exists and is active
    const user = await this.authService.validateUserById(payload.sub);

    if (!user) {
      return null; // This will trigger a 401 Unauthorized
    }

    // Return user object which will be attached to request.user
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      provider: user.provider,
    };
  }
}
