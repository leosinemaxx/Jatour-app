import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginDto } from './dto/login.dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createUserDto: CreateUserDto): Promise<{
        email: string;
        fullName: string;
        phone: string;
        profilePicture: string;
        id: string;
        preferences: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
    }>;
    login(loginDto: LoginDto): Promise<{
        email: string;
        fullName: string;
        phone: string | null;
        profilePicture: string | null;
        id: string;
        preferences: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(): import(".prisma/client").Prisma.PrismaPromise<{
        email: string;
        fullName: string;
        phone: string;
        profilePicture: string;
        id: string;
        createdAt: Date;
    }[]>;
    findByEmail(email: string): Promise<{
        email: string;
        fullName: string;
        phone: string;
        profilePicture: string;
        id: string;
        preferences: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
    }[]>;
    findOne(id: string): import(".prisma/client").Prisma.Prisma__UserClient<{
        email: string;
        fullName: string;
        phone: string;
        profilePicture: string;
        id: string;
        preferences: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
    }, null, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<{
        email: string;
        fullName: string;
        phone: string;
        profilePicture: string;
        id: string;
        preferences: import("@prisma/client/runtime/library").JsonValue;
        updatedAt: Date;
    }>;
    remove(id: string): import(".prisma/client").Prisma.Prisma__UserClient<{
        email: string;
        password: string;
        fullName: string;
        phone: string | null;
        profilePicture: string | null;
        id: string;
        preferences: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
