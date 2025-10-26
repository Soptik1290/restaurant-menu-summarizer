import { IsString, IsUrl } from 'class-validator';

/**
 * DTO for menu summarization request
 * Validates restaurant URL for menu extraction
 */
export class SummarizeMenuDto {
  /**
   * Restaurant or menu URL
   * Must be a valid URL address
   */
  @IsString()
  @IsUrl()
  url: string;
}