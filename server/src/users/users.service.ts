import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    try {
      console.log('Creating user with email:', createUserDto.email);
      
      // Validate input
      if (!createUserDto.email || !createUserDto.password || !createUserDto.fullName) {
        throw new Error('Missing required fields: email, password, or fullName');
      }

      // Check if user exists
      console.log('Checking if user exists...');
      const existingUser = await this.prisma.user.findUnique({
        where: { email: createUserDto.email },
      });

      if (existingUser) {
        console.log('User already exists:', existingUser.email);
        throw new ConflictException('Email already registered');
      }

      // Hash password
      console.log('Hashing password...');
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      // Set default preferences if not provided
      const preferences = {
        language: 'id',
        notifications: true,
        theme: 'light',
      };

      // Create user
      console.log('Creating user in database...');
      const user = await this.prisma.user.create({
        data: {
          email: createUserDto.email,
          password: hashedPassword,
          fullName: createUserDto.fullName,
          phone: createUserDto.phone || null,
          profilePicture: createUserDto.profilePicture || '/avatars/default.jpg',
          preferences: preferences,
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          profilePicture: true,
          preferences: true,
          createdAt: true,
        },
      });

      console.log('User created successfully:', user.id);
      return user;
    } catch (error: any) {
      console.error('Error creating user - Full details:', {
        message: error?.message,
        name: error?.name,
        code: error?.code,
        meta: error?.meta,
        stack: error?.stack,
      });
      
      if (error instanceof ConflictException) {
        throw error;
      }
      
      // Handle Prisma errors
      if (error?.code === 'P2002') {
        throw new ConflictException('Email already registered');
      }
      
      if (error?.code === 'P1001') {
        throw new Error('Cannot reach database server. Please check your database connection.');
      }
      
      // Re-throw with better message
      throw new Error(error?.message || 'Failed to create user account');
    }
  }

  async login(loginDto: LoginDto) {
    try {
      console.log('Login attempt for email:', loginDto.email);
      
      const user = await this.prisma.user.findUnique({
        where: { email: loginDto.email },
      });

      if (!user) {
        console.log('User not found:', loginDto.email);
        throw new UnauthorizedException('Invalid credentials');
      }

      console.log('User found, comparing password...');
      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

      if (!isPasswordValid) {
        console.log('Password mismatch for user:', loginDto.email);
        throw new UnauthorizedException('Invalid credentials');
      }

      console.log('Login successful for user:', user.email);
      const { password, ...result } = user;
      return result;
    } catch (error: any) {
      console.error('Login error:', {
        message: error?.message,
        email: loginDto.email,
      });
      
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        profilePicture: true,
        createdAt: true,
      },
    });
  }

  async findByEmail(email: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          profilePicture: true,
          preferences: true,
          createdAt: true,
        },
      });
      
      if (!user) {
        return [];
      }
      
      // Return as array to match the expected format from frontend
      return [user];
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        profilePicture: true,
        preferences: true,
        createdAt: true,
      },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        profilePicture: true,
        preferences: true,
        updatedAt: true,
      },
    });
  }

  remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}

