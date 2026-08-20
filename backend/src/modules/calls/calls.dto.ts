import { PartialType } from '@nestjs/mapped-types';
import {
  IsArray,
  IsIn,
  IsISO8601,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCallDto {
  @IsOptional()
  @IsIn(['in_progress', 'completed', 'failed', 'no_answer'])
  status?: string;

  @IsOptional()
  @IsIn([
    'promise_to_pay',
    'paid_in_full',
    'payment_plan',
    'refused',
    'disputed',
    'no_answer',
  ])
  outcome?: string;

  @IsOptional()
  @IsNumber()
  promiseAmount?: number;

  @IsOptional()
  @IsString()
  promiseDate?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsArray()
  transcript?: unknown[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsISO8601({ strict: true })
  startedAt?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  endedAt?: string;
}

export class UpdateCallDto extends PartialType(CreateCallDto) {}

export class QueryCallsDto {
  @IsOptional()
  @IsIn(['in_progress', 'completed', 'failed', 'no_answer'])
  status?: string;

  @IsOptional()
  @IsIn([
    'promise_to_pay',
    'paid_in_full',
    'payment_plan',
    'refused',
    'disputed',
    'no_answer',
  ])
  outcome?: string;
}
