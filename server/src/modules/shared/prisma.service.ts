import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Chalk } from 'src/common';
import { appConfig } from 'src/configs';
import { SeedService } from './seed.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly chalk = new Chalk();
    private static isSeeded = false;

    constructor(private readonly seedService: SeedService) {
        super();
    }

    async onModuleInit() {
        const sqlConfig = appConfig.database.sql;
        if (!process.env.DATABASE_URL) {
            process.env.DATABASE_URL = `mysql://${sqlConfig.username}:${sqlConfig.password}@${sqlConfig.host}:${sqlConfig.port}/${sqlConfig.database}?connectionLimit=${sqlConfig.connectionLimit}`;
        }

        await this.$connect();

        if (!PrismaService.isSeeded) {
            const allowSeed = sqlConfig.seedDatabase;

            if (allowSeed) {
                this.chalk.log(`${sqlConfig.database} database successfully seeded`);
                await this.seedService.seed();
                PrismaService.isSeeded = true;
            }
        }
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
