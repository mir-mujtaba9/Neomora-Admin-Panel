import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'The email address of the platform admin',
    example: 'admin@neomora.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'The password of the platform admin',
    example: 'Admin123!',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password!: string;
}
