import { IsString, IsUrl } from 'class-validator';

export class SummarizeMenuDto {

  @IsString() 
  @IsUrl()
  url: string;

}