import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RagService } from './rag.service';

@Injectable()
export class RagCronService {
  private readonly logger = new Logger(RagCronService.name);
  private isRunning = false;

  constructor(private readonly ragService: RagService) {}

  /**
   * Update embeddings every 6 hours
   * Processes issues that don't have embeddings yet
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async updateEmbeddings() {
    if (this.isRunning) {
      this.logger.warn('Batch embedding update already running, skipping...');
      return;
    }

    this.isRunning = true;
    this.logger.log('Starting batch embedding update...');

    try {
      const updated = await this.ragService.batchUpdateEmbeddings(100);
      this.logger.log(
        `Batch embedding update completed: ${updated} issues updated`,
      );
    } catch (error) {
      this.logger.error(`Batch embedding update failed: ${error.message}`);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Full embedding sync daily at midnight
   * Processes all issues until none remain
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async fullEmbeddingSync() {
    if (this.isRunning) {
      this.logger.warn('Full embedding sync already running, skipping...');
      return;
    }

    this.isRunning = true;
    this.logger.log('Starting full embedding sync...');

    let totalUpdated = 0;
    let batchCount = 0;

    try {
      // Process in batches until all done
      while (true) {
        const updated = await this.ragService.batchUpdateEmbeddings(50);

        if (updated === 0) break;

        totalUpdated += updated;
        batchCount++;

        this.logger.log(`Batch ${batchCount}: ${updated} issues updated`);

        // Wait 1 minute between batches to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 60000));
      }

      this.logger.log(
        `Full sync completed: ${totalUpdated} total issues updated`,
      );
    } catch (error) {
      this.logger.error(`Full embedding sync failed: ${error.message}`);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Log embedding statistics every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async logStats() {
    try {
      const stats = await this.ragService.getEmbeddingStats();
      this.logger.log(
        `Embedding Stats: ${stats.withEmbedding}/${stats.total} issues (${stats.percentage.toFixed(2)}%)`,
      );
    } catch (error) {
      this.logger.error(`Failed to get embedding stats: ${error.message}`);
    }
  }
}
