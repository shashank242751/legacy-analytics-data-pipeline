import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EtlService } from './etl.service';
import { MonthDateUtil } from './utils/date.util';


@Injectable()
export class EtlCron {
  private readonly logger = new Logger(EtlCron.name);

  constructor(private readonly etlService: EtlService) { }

  /**
   * Monthly Cron Job:
   * Scheduled to run at 23:55 (11:55 PM) on the 28th, 29th, 30th, and 31st of every month.
   * Checks if TODAY is the actual last calendar day of the month using native Date arithmetic.
   * If yes -> triggers the full monthly sync!
   */
  @Cron('55 23 28-31 * *')
  async handleMonthlyCron() {
    const today = new Date();
    const isLastDay = MonthDateUtil.isTodayLastDayOfMonth(today);

    if (isLastDay) {
      const year = today.getFullYear();
      const month = today.getMonth() + 1; // 1 - 12
      this.logger.log(`⏰ [CRON TRIGGERED] Today is the last day of ${year}-${month}. Executing automated monthly sync...`);
      try {
        await this.etlService.executeMonthlySync(year, month);
      } catch (err) {
        this.logger.error(`[CRON ERROR] Monthly sync failed: ${err.message}`, err.stack);
      }
    } else {
      this.logger.log(`⏰ [CRON CHECK] Today is not the last day of the month. Skipping.`);
    }
  }
}

