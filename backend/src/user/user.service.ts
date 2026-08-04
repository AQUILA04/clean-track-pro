import { Injectable, Logger, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KeycloakService } from '../shared/keycloak/keycloak.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SiteService } from '../sites/site.service';
import { Tenant } from '../tenant/entities/tenant.entity';

type UserProfileNames = { firstName: string; lastName: string };

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);

    constructor(
        private readonly keycloakService: KeycloakService,
        private readonly siteService: SiteService,
        private readonly configService: ConfigService,
        @InjectRepository(Tenant) private readonly tenantRepository: Repository<Tenant>,
    ) { }

    private getKeycloakRealm(): string {
        return this.configService.get<string>('KEYCLOAK_REALM', 'cleantrack');
    }

    async inviteUser(tenantId: string, inviteUserDto: InviteUserDto) {
        this.logger.log(
            `Inviting user ${inviteUserDto.email} as ${inviteUserDto.role} to tenant ${tenantId}` +
            (inviteUserDto.siteId ? ` for site ${inviteUserDto.siteId}` : ''),
        );

        const tenant = await this.tenantRepository.findOneBy({ id: tenantId });
        if (!tenant) {
            throw new BadRequestException('Tenant introuvable');
        }
        if (tenant.is_active === false) {
            throw new ForbiddenException(
                "Impossible d'inviter un utilisateur : ce tenant est désactivé.",
            );
        }

        const isTenantAdminRole = inviteUserDto.role === 'Admin_Tenant';

        if (!isTenantAdminRole) {
            if (!inviteUserDto.siteId) {
                throw new BadRequestException('Site ID required for Admin_Site and User_Site invitations');
            }
            const isSiteValid = await this.siteService.validate(tenantId, inviteUserDto.siteId);
            if (!isSiteValid) {
                throw new ForbiddenException('Invalid Site ID for this Tenant');
            }
        }

        const attributes: Record<string, string[]> = {
            tenant_id: [tenantId],
            role: [inviteUserDto.role],
        };

        if (inviteUserDto.siteId) {
            attributes.site_ids = [inviteUserDto.siteId];
        }

        const profile = await this.resolveInviteProfile(tenantId, inviteUserDto);

        return this.keycloakService.createUser(
            this.getKeycloakRealm(),
            inviteUserDto.email,
            attributes,
            inviteUserDto.role,
            profile,
        );
    }

    private async resolveInviteProfile(
        tenantId: string,
        inviteUserDto: InviteUserDto,
    ): Promise<UserProfileNames> {
        const firstName = inviteUserDto.firstName?.trim();
        const lastName = inviteUserDto.lastName?.trim();

        if (inviteUserDto.role === 'Admin_Tenant') {
            const tenant = await this.tenantRepository.findOneBy({ id: tenantId });
            return {
                firstName: firstName || 'Admin',
                lastName: lastName || tenant?.name || 'Tenant',
            };
        }

        if (!firstName || !lastName) {
            throw new BadRequestException('First name and last name are required for site users');
        }

        return { firstName, lastName };
    }

    private mapKeycloakUser(user: Record<string, any>) {
        const attributes = user.attributes ?? {};
        const roleFromAttributes = attributes.role?.[0];
        const tenantId = attributes.tenant_id?.[0] ?? attributes.tenantId?.[0];
        const siteIds = attributes.site_ids ?? attributes.siteIds ?? [];
        const resolvedEmail =
            user.email?.trim() ||
            (typeof user.username === 'string' && user.username.includes('@') ? user.username.trim() : '');

        return {
            id: user.id,
            username: user.username,
            email: resolvedEmail,
            enabled: user.enabled,
            firstName: user.firstName,
            lastName: user.lastName,
            role: roleFromAttributes,
            requiredActions: user.requiredActions ?? [],
            attributes: {
                ...attributes,
                tenant_id: tenantId ? [tenantId] : attributes.tenant_id,
                site_ids: siteIds,
                role: roleFromAttributes ? [roleFromAttributes] : attributes.role,
            },
            agencies: [],
        };
    }

    async getUsers(tenantId: string, siteId?: string) {
        const realm = this.getKeycloakRealm();

        const users = siteId
            ? await this.keycloakService.findUsersByAttribute(realm, 'site_ids', siteId)
            : await this.keycloakService.findUsersByAttribute(realm, 'tenant_id', tenantId);

        return (users ?? []).map((user) => this.mapKeycloakUser(user));
    }

    async resendInvitation(tenantId: string, userId: string) {
        const realm = this.getKeycloakRealm();
        const targetUser = await this.findTenantUser(realm, tenantId, userId);

        const requiredActions: string[] = Array.isArray(targetUser.requiredActions)
            ? targetUser.requiredActions
            : [];

        if (!requiredActions.includes('UPDATE_PASSWORD')) {
            throw new BadRequestException('Invitation cannot be resent because account is already configured');
        }

        const emailHint = this.resolveUserEmailFromRecord(targetUser);

        if (!emailHint) {
            throw new BadRequestException(
                'Impossible de renvoyer l\'invitation : adresse e-mail manquante pour cet utilisateur',
            );
        }

        const profile = await this.resolveResendProfile(tenantId, targetUser);

        await this.keycloakService.resendInvitationEmail(
            realm,
            userId,
            ['UPDATE_PASSWORD'],
            emailHint,
            profile,
        );
        return { userId, status: 'invitation_resent' };
    }

    private async resolveResendProfile(
        tenantId: string,
        user: { firstName?: string; lastName?: string; role?: string },
    ): Promise<UserProfileNames> {
        const tenant = await this.tenantRepository.findOneBy({ id: tenantId });
        const isTenantAdmin = user.role === 'Admin_Tenant';

        return {
            firstName: user.firstName?.trim() || (isTenantAdmin ? 'Admin' : 'Utilisateur'),
            lastName: user.lastName?.trim() || tenant?.name || 'Tenant',
        };
    }

    async deleteUser(tenantId: string, userId: string) {
        const realm = this.getKeycloakRealm();
        await this.findTenantUser(realm, tenantId, userId);
        await this.keycloakService.deleteUser(realm, userId);
        return { userId, status: 'deleted' };
    }

    async updateUser(tenantId: string, userId: string, updateUserDto: UpdateUserDto) {
        const realm = this.getKeycloakRealm();
        const targetUser = await this.findTenantUser(realm, tenantId, userId);
        const currentRole = targetUser.attributes?.role?.[0] ?? targetUser.role;
        const nextRole = updateUserDto.role ?? currentRole;

        if (nextRole !== 'Admin_Tenant' && !updateUserDto.siteId && updateUserDto.role) {
            throw new BadRequestException('Site ID required for Admin_Site and User_Site roles');
        }

        if (updateUserDto.siteId) {
            const isSiteValid = await this.siteService.validate(tenantId, updateUserDto.siteId);
            if (!isSiteValid) {
                throw new ForbiddenException('Invalid Site ID for this Tenant');
            }
        }

        const attributes: Record<string, string[]> = {
            tenant_id: [tenantId],
            role: [nextRole],
        };

        if (updateUserDto.siteId) {
            attributes.site_ids = [updateUserDto.siteId];
        } else if (targetUser.attributes?.site_ids?.length) {
            attributes.site_ids = targetUser.attributes.site_ids;
        }

        await this.keycloakService.updateUser(realm, userId, {
            attributes,
            role: updateUserDto.role ? nextRole : undefined,
        });

        return this.mapKeycloakUser({
            ...targetUser,
            attributes: {
                ...(targetUser.attributes ?? {}),
                ...attributes,
            },
        });
    }

    private async findTenantUser(realm: string, tenantId: string, userId: string) {
        const tenantUsers = await this.keycloakService.findUsersByAttribute(realm, 'tenant_id', tenantId);
        const targetUser = tenantUsers.find((user) => user.id === userId);

        if (!targetUser) {
            throw new ForbiddenException('User does not belong to this tenant');
        }

        return this.mapKeycloakUser(targetUser);
    }

    private resolveUserEmailFromRecord(user: { email?: string; username?: string }): string | undefined {
        const email = user.email?.trim();
        if (email && email.includes('@')) {
            return email;
        }
        const username = user.username?.trim();
        if (username && username.includes('@')) {
            return username;
        }
        return undefined;
    }
}
