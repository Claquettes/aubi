import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

/** Fuseau IANA envoyé par le client : les découpages jour/heure/mois sont
 *  calculés dans le fuseau de l'utilisateur, pas celui du serveur. */
const TZ_RE = /^[A-Za-z0-9_+\-/]{1,64}$/;

/** Le calendrier d'activité est toujours sur 12 mois : seul le fuseau compte. */
export class TzQueryDto {
  @IsOptional()
  @Matches(TZ_RE)
  tz = 'UTC';
}

export class RangeQueryDto {
  @IsOptional()
  @IsIn(['music', 'concert', 'audiobook'])
  section?: string;

  @IsOptional()
  @IsIn(['week', 'month', 'year', 'all'])
  period: 'week' | 'month' | 'year' | 'all' = 'month';

  @IsOptional()
  @Matches(TZ_RE)
  tz = 'UTC';
}

export class TopQueryDto extends RangeQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 10;
}

export class DailyQueryDto {
  /** AAAA-MM-JJ. Par défaut : les 30 derniers jours jusqu'à aujourd'hui. */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to?: string;

  @IsOptional()
  @IsIn(['music', 'concert', 'audiobook'])
  section?: string;

  @IsOptional()
  @Matches(TZ_RE)
  tz = 'UTC';
}

export class MonthlyQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(3)
  @Max(60)
  months = 12;

  @IsOptional()
  @IsIn(['music', 'concert', 'audiobook'])
  section?: string;

  @IsOptional()
  @Matches(TZ_RE)
  tz = 'UTC';
}

export class RecentQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 12;
}
