import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async seed() {
        await this.seedRoles();
        await this.seedOrganizations();
        await this.seedUsers();
        await this.seedTeams();
        await this.seedUserOrgRoles();
        await this.seedTeamMembers();
    }

    private async seedRoles() {
        const roles = [
            {
                id: 'cm5ijf7oo00050cl7hagfgysj', // Generate a unique ID with cuid
                name: 'Admin',
                description: 'Full access to all features',
                permissions: { canManageUsers: true, canManageOrgs: true, canManageTeams: true }
            },
            {
                id: 'cm5ijfa8100060cl77k6x9wb3',
                name: 'Manager',
                description: 'Can manage teams and members',
                permissions: { canManageTeams: true, canManageMembers: true }
            },
            {
                id: 'cm5ijfskt00070cl72zsifg3g',
                name: 'Member',
                description: 'Regular user with limited access',
                permissions: { canViewTeams: true }
            }
        ];

        for (const role of roles) {
            await this.prisma.roles.upsert({
                where: { id: role.id },
                update: {},
                create: role
            });
        }
    }

    private async seedOrganizations() {
        const organizations = [
            { id: 'cm5ijg28800090cl7aoa43thy', name: 'Acme Corp' },
            { id: 'cm5ijg3xo000a0cl7djjohuv9', name: 'Globex Corporation' }
        ];

        for (const org of organizations) {
            await this.prisma.organizations.upsert({
                where: { id: org.id },
                update: {},
                create: org
            });
        }
    }

    private async seedUsers() {
        const users = [
            { id: 'cm5ijg7jp000b0cl747le7wch', name: 'John Doe', email: 'john@example.com', password: 'password123' },
            { id: 'cm5ijgboo000c0cl7hv4qgveg', name: 'Jane Smith', email: 'jane@example.com', password: 'password456' }
        ];

        for (const user of users) {
            const hashedPassword = await bcrypt.hash(user.password, 10);

            await this.prisma.users.upsert({
                where: { email: user.email },
                update: {},
                create: {
                    ...user,
                    password: hashedPassword
                }
            });
        }
    }

    private async seedTeams() {
        const organizations = await this.prisma.organizations.findMany();

        const teams = [
            {
                id: 'cm5ijgf6h000d0cl7c6a1gsx4',
                name: 'Acme Corp Team',
                description: 'Main team for Acme Corp',
                orgId: organizations[0].id
            },
            {
                id: 'cm5ijgj1q000e0cl74cxd9f7z',
                name: 'Globex Corporation Team',
                description: 'Main team for Globex Corporation',
                orgId: organizations[1].id
            }
        ];

        for (const team of teams) {
            await this.prisma.teams.upsert({
                where: { id: team.id },
                update: {},
                create: team
            });
        }
    }

    private async seedUserOrgRoles() {
        const users = await this.prisma.users.findMany();
        const organizations = await this.prisma.organizations.findMany();
        const roles = await this.prisma.roles.findMany();

        const userOrgRoles = [
            { userId: users[0].id, orgId: organizations[0].id, roleId: roles[0].id },
            { userId: users[1].id, orgId: organizations[1].id, roleId: roles[1].id }
        ];

        for (const userOrgRole of userOrgRoles) {
            await this.prisma.user_org_roles.upsert({
                where: {
                    userId_orgId: {
                        userId: userOrgRole.userId,
                        orgId: userOrgRole.orgId
                    }
                },
                update: {},
                create: userOrgRole
            });
        }
    }

    private async seedTeamMembers() {
        const users = await this.prisma.users.findMany();
        const teams = await this.prisma.teams.findMany();

        const teamMembers = [
            { userId: users[0].id, teamId: teams[0].id, role: 'LEADER' }, // Enum role value
            { userId: users[1].id, teamId: teams[1].id, role: 'MEMBER' } // Enum role value
        ];

        for (const member of teamMembers) {
            await this.prisma.team_members.upsert({
                where: {
                    userId_teamId: {
                        userId: member.userId,
                        teamId: member.teamId
                    }
                },
                update: {},
                create: {
                    userId: member.userId,
                    teamId: member.teamId,
                    role: 'MEMBER'
                }
            });
        }
    }
}
