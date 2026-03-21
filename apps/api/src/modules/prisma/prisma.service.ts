import { PrismaClient } from '@manager/db';
import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async setTenantSchema(slug: string): Promise<void> {
    const schema = `tenant_${slug}`;
    await this.$executeRawUnsafe(`SET search_path TO "${schema}", "public"`);
  }

  async resetToPublic(): Promise<void> {
    await this.$executeRawUnsafe(`SET search_path TO "public"`);
  }

  async forTenant(slug: string): Promise<this> {
    await this.setTenantSchema(slug);
    return this;
  }
}
