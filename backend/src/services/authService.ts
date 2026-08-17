import bcrypt from "bcryptjs";
import { userRepository } from "../repositories/userRepository.js";
import { signToken } from "../utils/jwt.js";

export const authService = {
  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user || !user.active) {
      throw { status: 401, code: "INVALID_CREDENTIALS", message: "Email ou mot de passe incorrect." };
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw { status: 401, code: "INVALID_CREDENTIALS", message: "Email ou mot de passe incorrect." };
    }

    const token = signToken({ userId: user.id, role: user.role });
    return { token, user: publicUser(user) };
  },
};

function publicUser(user: { id: number; firstName: string; lastName: string; email: string; role: string }) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
  };
}