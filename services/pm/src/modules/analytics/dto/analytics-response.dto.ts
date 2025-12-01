export class ChartDataPointDto {
  key: string;
  count: number;
}

export class ChartResponseDto {
  data: ChartDataPointDto[];
}

export class StatsResponseDto {
  total: number;
  completed: number;
  in_progress: number;
  pending: number;
}

