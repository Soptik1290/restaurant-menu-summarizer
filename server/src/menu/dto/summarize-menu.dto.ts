// server/src/menu/dto/summarize-menu.dto.ts

// We import 'validators' that will check our data.
import { IsString, IsUrl } from 'class-validator';

// This defines the 'shape' of the data we expect in the POST request body.
export class SummarizeMenuDto {

  @IsString() // Checks if the value is a string.
  @IsUrl()    // Checks if the value is a valid URL.
  url: string;

}