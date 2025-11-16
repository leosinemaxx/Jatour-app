"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = require("bcrypt");
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createUserDto) {
        try {
            console.log('Creating user with email:', createUserDto.email);
            if (!createUserDto.email || !createUserDto.password || !createUserDto.fullName) {
                throw new Error('Missing required fields: email, password, or fullName');
            }
            console.log('Checking if user exists...');
            const existingUser = await this.prisma.user.findUnique({
                where: { email: createUserDto.email },
            });
            if (existingUser) {
                console.log('User already exists:', existingUser.email);
                throw new common_1.ConflictException('Email already registered');
            }
            console.log('Hashing password...');
            const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
            const preferences = {
                language: 'id',
                notifications: true,
                theme: 'light',
            };
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
        }
        catch (error) {
            console.error('Error creating user - Full details:', {
                message: error?.message,
                name: error?.name,
                code: error?.code,
                meta: error?.meta,
                stack: error?.stack,
            });
            if (error instanceof common_1.ConflictException) {
                throw error;
            }
            if (error?.code === 'P2002') {
                throw new common_1.ConflictException('Email already registered');
            }
            if (error?.code === 'P1001') {
                throw new Error('Cannot reach database server. Please check your database connection.');
            }
            throw new Error(error?.message || 'Failed to create user account');
        }
    }
    async login(loginDto) {
        try {
            console.log('Login attempt for email:', loginDto.email);
            const user = await this.prisma.user.findUnique({
                where: { email: loginDto.email },
            });
            if (!user) {
                console.log('User not found:', loginDto.email);
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            console.log('User found, comparing password...');
            const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
            if (!isPasswordValid) {
                console.log('Password mismatch for user:', loginDto.email);
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            console.log('Login successful for user:', user.email);
            const { password, ...result } = user;
            return result;
        }
        catch (error) {
            console.error('Login error:', {
                message: error?.message,
                email: loginDto.email,
            });
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            throw new common_1.UnauthorizedException('Invalid credentials');
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
    async findByEmail(email) {
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
            return [user];
        }
        catch (error) {
            console.error('Error finding user by email:', error);
            throw error;
        }
    }
    findOne(id) {
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
    async update(id, updateUserDto) {
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
    remove(id) {
        return this.prisma.user.delete({
            where: { id },
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map