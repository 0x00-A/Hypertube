import mongoose, { Types } from 'mongoose';
import argon2 from 'argon2';
import { env } from '../src/config/env';
import { UserModel } from '../src/models/User';
import { UserRepository } from '../src/repositories/user.repository';
import { JWTService } from '../src/services/jwt.service';
import { logger } from '../src/utils/logger';

async function main(): Promise<void> {
  const [, , username = 'script-user', email = 'script@example.com', password = 'ChangeMe123!'] =
    process.argv;

  await mongoose.connect(env.MONGODB_URI, {});

  try {
    const existing = await UserModel.findOne({ $or: [{ username }, { email }] }).exec();
    if (existing) {
      logger.warn({ username, email }, 'User already exists - skipping creation');
      const repo = new UserRepository();
      const jwtService = new JWTService(repo);
      const payload = { userId: (existing._id as Types.ObjectId).toString() };
      const tokens = jwtService.generateTokens(payload);
      logger.info(
        { accessToken: tokens.access_token },
        'Use this access token in Swagger (set cookie accessToken)',
      );
      return;
    }

    const hashed = await argon2.hash(password);

    const userDoc = await UserModel.create({
      username,
      email,
      password: hashed,
      firstName: 'Script',
      lastName: 'User',
      isActive: true,
    });

    const repo = new UserRepository();
    const jwtService = new JWTService(repo);
    const payload = { userId: (userDoc._id as Types.ObjectId).toString() };
    const tokens = jwtService.generateTokens(payload);

    logger.info(
      { userId: userDoc._id, accessToken: tokens.access_token },
      'Active user created. Set cookie "accessToken" with this value for Swagger.',
    );
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error({ err }, 'Failed to create user');
    } else {
      logger.error('Unknown error while creating user');
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();
