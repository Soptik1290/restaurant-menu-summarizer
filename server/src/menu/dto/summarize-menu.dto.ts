import { IsString, IsUrl } from 'class-validator';

/**
 * DTO pro požadavek na sumarizaci menu
 * Validuje URL restaurace pro extrakci jídelního lístku
 */
export class SummarizeMenuDto {
  /**
   * URL restaurace nebo jídelního lístku
   * Musí být platná URL adresa
   */
  @IsString()
  @IsUrl()
  url: string;
}