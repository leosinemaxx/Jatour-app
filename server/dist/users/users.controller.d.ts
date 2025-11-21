import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginDto } from './dto/login.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    register(createUserDto: CreateUserDto): Promise<{
        email: string;
        fullName: string;
        phone: string;
        profilePicture: string;
        id: string;
        preferences: string;
        createdAt: Date;
    }>;
    login(loginDto: LoginDto): Promise<{
        email: string;
        fullName: string;
        phone: string | null;
        profilePicture: string | null;
        id: string;
        preferences: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findByEmail(email: string): Promise<{
        email: string;
        fullName: string;
        phone: string;
        profilePicture: string;
        id: string;
        preferences: string;
        createdAt: Date;
    }[]>;
    findAll(): import(".prisma/client").Prisma.PrismaPromise<{
        email: string;
        fullName: string;
        phone: string;
        profilePicture: string;
        id: string;
        createdAt: Date;
    }[]>;
    findOne(id: string): import(".prisma/client").Prisma.Prisma__UserClient<{
        email: string;
        fullName: string;
        phone: string;
        profilePicture: string;
        id: string;
        preferences: string;
        createdAt: Date;
    }, null, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<{
        email: string;
        fullName: string;
        phone: string;
        profilePicture: string;
        id: string;
        preferences: string;
        updatedAt: Date;
    }>;
    remove(id: string): import(".prisma/client").Prisma.Prisma__UserClient<{
        email: string;
        password: string;
        fullName: string;
        phone: string | null;
        profilePicture: string | null;
        id: string;
        preferences: string | null;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
