import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { RagClientModule } from '../common/rag';

@Module({
  imports: [HttpModule, RagClientModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
