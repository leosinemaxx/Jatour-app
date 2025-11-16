import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Query, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginDto } from './dto/login.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    try {
      console.log('Registration request received:', { email: createUserDto.email, fullName: createUserDto.fullName });
      const result = await this.usersService.create(createUserDto);
      console.log('Registration successful:', result.id);
      return result;
    } catch (error: any) {
      console.error('Registration error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
        response: error?.response,
      });
      
      // Return proper error response
      if (error instanceof ConflictException) {
        throw error;
      }
      
      // For other errors, return a proper HTTP exception
      throw new InternalServerErrorException(error?.message || 'Failed to create user account');
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    try {
      console.log('Login request received for:', loginDto.email);
      const result = await this.usersService.login(loginDto);
      console.log('Login successful, returning user data');
      return result;
    } catch (error: any) {
      console.error('Login error in controller:', {
        message: error?.message,
        email: loginDto.email,
      });
      throw error;
    }
  }

  @Get('email/:email')
  findByEmail(@Param('email') email: string) {
    return this.usersService.findByEmail(email);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}

