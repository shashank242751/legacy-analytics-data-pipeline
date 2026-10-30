import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const host = this.config.get<string>('PG_HOST', '119.82.96.69');
    const port = Number(this.config.get<number>('PG_PORT', 5432));
    const database = this.config.get<string>('PG_DATABASE', 'postgres');
    const user = this.config.get<string>('PG_USER', 'postgres');
    const password = this.config.get<string>('PG_PASSWORD', '');

    this.pool = new Pool({
      host,
      port,
      database,
      user,
      password,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    this.logger.log(`Initialized PostgreSQL Pool targeting: [${host}:${port}/${database}]`);
  }

  async checkConnection(): Promise<void> {
    const client = await this.pool.connect();
    client.release();
  }

  async query(text: string, params?: any[]) {
    return this.pool.query(text, params);
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
    }
  }
}
