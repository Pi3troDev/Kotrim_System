import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.accessSecret')!,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.usersService.findById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is no longer active');
    }

    const isImpersonating = Boolean(payload.impersonatedBy);

    return {
      id: user.id,
      companyId: user.companyId,
      roleId: user.roleId,
      roleName: user.role.name,
      email: user.email,
      // Forced off while impersonating. Support looking at a customer's account
      // holds the customer's powers, not their own — otherwise a session meant
      // to *see* what one tenant sees could still reach every other tenant, and
      // start a further impersonation from inside this one.
      isSuperAdmin: isImpersonating ? false : user.isSuperAdmin,
      impersonatedBy: payload.impersonatedBy ?? null,
    };
  }
}
