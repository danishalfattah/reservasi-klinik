import { hashPassword, comparePassword } from '@/lib/bcrypt';
import { signToken } from '@/lib/jwt';
import { ConflictError, UnauthorizedError } from '@/lib/errors';
import {
  UserRepository,
  type CreateUserInput,
} from '@/repositories/user.repository';
import type { RegisterInput, LoginInput } from '@/validators/auth.validator';
import type { Role } from '@/generated/prisma/client';

interface AuthResult {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
  };
}

export class AuthService {
  constructor(private userRepo: UserRepository) {}

  async registerUser(input: RegisterInput): Promise<AuthResult> {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw new ConflictError(
        'EMAIL_ALREADY_EXISTS',
        'Email sudah terdaftar, silakan gunakan email lain'
      );
    }

    const hashedPassword = await hashPassword(input.password);
    const userInput: CreateUserInput = {
      email: input.email,
      password: hashedPassword,
      name: input.name,
      phone: input.phone,
      role: input.role as Role,
    };

    const user =
      input.role === 'DOKTER'
        ? await this.userRepo.createWithDoctorProfile(userInput, {
            spesialis: input.spesialis,
            tarif: input.tarif,
            durasiMenit: input.durasiMenit,
          })
        : await this.userRepo.create(userInput);

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  }

  async loginUser(input: LoginInput): Promise<AuthResult> {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError('Email atau password salah');
    }

    const isValid = await comparePassword(input.password, user.password);
    if (!isValid) {
      throw new UnauthorizedError('Email atau password salah');
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  }
}
