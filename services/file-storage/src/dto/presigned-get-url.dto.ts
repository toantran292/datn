import { IsString, IsArray, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class PresignedGetUrlDto {
  @IsString()
  id: string;

  @IsOptional()
  @IsNumber()
  @Min(60) // Minimum 1 minute
  @Max(604800) // Maximum 7 days
  expirySeconds?: number;
}

export class PresignedGetUrlsDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];

  @IsOptional()
  @IsNumber()
  @Min(60) // Minimum 1 minute
  @Max(604800) // Maximum 7 days
  expirySeconds?: number;
}

