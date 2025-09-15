import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalAuthGuard extends AuthGuard('jwt') {
  // Override handleRequest to make authentication optional
  handleRequest(err: any, user: any): any {
    // If there's an error or no user, just return null (no user)
    // This allows the request to continue without authentication
    if (err || !user) {
      return null;
    }
    return user;
  }
}
