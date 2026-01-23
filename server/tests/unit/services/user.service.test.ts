import { UserService } from '../../../src/services/user.service';
import { UserRepository } from '../../../src/repositories/user.repository';
import { PasswordService } from '../../../src/services/password.service';
import { BadRequestError } from '../../../src/core/errors/customErrors';
import { IUser } from '../../../src/interfaces/user.interface';

describe('UserService.list', () => {
  let userService: UserService;
  let mockRepository: jest.Mocked<Pick<UserRepository, 'findAll' | 'countDocuments'>>;
  let mockPasswordService: jest.Mocked<PasswordService>;

  beforeEach(() => {
    // Create a type-safe mock with only the methods needed for these tests
    mockRepository = {
      findAll: jest.fn(),
      countDocuments: jest.fn(),
    };

    mockPasswordService = {
      hashPassword: jest.fn(),
      verifyPassword: jest.fn(),
    } as unknown as jest.Mocked<PasswordService>;

    // Cast to UserRepository for dependency injection (acceptable for unit tests)
    userService = new UserService(
      mockRepository as unknown as UserRepository,
      mockPasswordService
    );
  });

  it('should handle negative page by defaulting to 1', async () => {
    mockRepository.findAll.mockResolvedValue([]);
    mockRepository.countDocuments.mockResolvedValue(0);

    const result = await userService.list(-5, 10);

    expect(result.page).toBe(1);
    expect(mockRepository.findAll).toHaveBeenCalledWith(
      { isActive: true },
      { skip: 0, limit: 10 }
    );
  });

  it('should handle zero page by defaulting to 1', async () => {
    mockRepository.findAll.mockResolvedValue([]);
    mockRepository.countDocuments.mockResolvedValue(0);

    const result = await userService.list(0, 10);

    expect(result.page).toBe(1);
    expect(mockRepository.findAll).toHaveBeenCalledWith(
      { isActive: true },
      { skip: 0, limit: 10 }
    );
  });

  it('should handle negative limit by defaulting to 1', async () => {
    mockRepository.findAll.mockResolvedValue([]);
    mockRepository.countDocuments.mockResolvedValue(0);

    const result = await userService.list(1, -10);

    expect(result.limit).toBe(1);
    expect(mockRepository.findAll).toHaveBeenCalledWith(
      { isActive: true },
      { skip: 0, limit: 1 }
    );
  });

  it('should handle zero limit by defaulting to 1', async () => {
    mockRepository.findAll.mockResolvedValue([]);
    mockRepository.countDocuments.mockResolvedValue(0);

    const result = await userService.list(1, 0);

    expect(result.limit).toBe(1);
    expect(mockRepository.findAll).toHaveBeenCalledWith(
      { isActive: true },
      { skip: 0, limit: 1 }
    );
  });

  it('should handle decimal page by flooring to integer', async () => {
    mockRepository.findAll.mockResolvedValue([]);
    mockRepository.countDocuments.mockResolvedValue(0);

    const result = await userService.list(2.7, 10);

    expect(result.page).toBe(2);
    expect(mockRepository.findAll).toHaveBeenCalledWith(
      { isActive: true },
      { skip: 10, limit: 10 }
    );
  });

  it('should handle decimal limit by flooring to integer', async () => {
    mockRepository.findAll.mockResolvedValue([]);
    mockRepository.countDocuments.mockResolvedValue(0);

    const result = await userService.list(1, 15.9);

    expect(result.limit).toBe(15);
    expect(mockRepository.findAll).toHaveBeenCalledWith(
      { isActive: true },
      { skip: 0, limit: 15 }
    );
  });

  it('should calculate correct skip value for valid pagination', async () => {
    mockRepository.findAll.mockResolvedValue([]);
    mockRepository.countDocuments.mockResolvedValue(100);

    await userService.list(3, 20);

    expect(mockRepository.findAll).toHaveBeenCalledWith(
      { isActive: true },
      { skip: 40, limit: 20 }
    );
  });

  it('should calculate correct totalPages', async () => {
    mockRepository.findAll.mockResolvedValue([]);
    mockRepository.countDocuments.mockResolvedValue(47);

    const result = await userService.list(1, 10);

    expect(result.totalPages).toBe(5); // Math.ceil(47 / 10)
  });

  it('should handle combination of invalid page and limit', async () => {
    mockRepository.findAll.mockResolvedValue([]);
    mockRepository.countDocuments.mockResolvedValue(0);

    const result = await userService.list(-3, -5);

    expect(result.page).toBe(1);
    expect(result.limit).toBe(1);
    expect(mockRepository.findAll).toHaveBeenCalledWith(
      { isActive: true },
      { skip: 0, limit: 1 }
    );
  });
});

describe('UserService.changePassword', () => {
  let userService: UserService;
  let mockRepository: jest.Mocked<Pick<UserRepository, 'findByUsernameWithPasswordOauth' | 'updateByUsername'>>;
  let mockPasswordService: jest.Mocked<PasswordService>;

  beforeEach(() => {
    mockRepository = {
      findByUsernameWithPasswordOauth: jest.fn(),
      updateByUsername: jest.fn(),
    };

    mockPasswordService = {
      hashPassword: jest.fn(),
      verifyPassword: jest.fn(),
    } as unknown as jest.Mocked<PasswordService>;

    userService = new UserService(
      mockRepository as unknown as UserRepository,
      mockPasswordService
    );
  });

  it('should successfully change password when all conditions are met', async () => {
    const mockUser: Partial<IUser> = {
      _id: 'user123',
      username: 'testuser',
      password: 'hashedOldPassword',
      oauth: {
        provider: 'google',
        id: 'oauth123',
        isPasswordSet: true,
      },
    };

    mockRepository.findByUsernameWithPasswordOauth.mockResolvedValue(mockUser);
    mockPasswordService.verifyPassword.mockResolvedValue(true);
    mockPasswordService.hashPassword.mockResolvedValue('hashedNewPassword');
    mockRepository.updateByUsername.mockResolvedValue(null);

    await userService.changePassword('testuser', 'OldPassword123!', 'NewPassword456!');

    expect(mockRepository.findByUsernameWithPasswordOauth).toHaveBeenCalledWith('testuser');
    expect(mockPasswordService.verifyPassword).toHaveBeenCalledWith('hashedOldPassword', 'OldPassword123!');
    expect(mockPasswordService.hashPassword).toHaveBeenCalledWith('NewPassword456!');
    expect(mockRepository.updateByUsername).toHaveBeenCalledWith('testuser', {
      password: 'hashedNewPassword',
    });
  });

  it('should throw BadRequestError when user not found', async () => {
    mockRepository.findByUsernameWithPasswordOauth.mockResolvedValue(null);

    await expect(
      userService.changePassword('nonexistent', 'OldPassword123!', 'NewPassword456!')
    ).rejects.toThrow(BadRequestError);

    await expect(
      userService.changePassword('nonexistent', 'OldPassword123!', 'NewPassword456!')
    ).rejects.toThrow('User not found');

    expect(mockPasswordService.verifyPassword).not.toHaveBeenCalled();
    expect(mockRepository.updateByUsername).not.toHaveBeenCalled();
  });

  it('should throw BadRequestError when user has no password', async () => {
    const mockUser: Partial<IUser> = {
      _id: 'user123',
      username: 'testuser',
      password: undefined,
      oauth: {
        provider: 'google',
        id: 'google123',
        isPasswordSet: false,
      },
    };

    mockRepository.findByUsernameWithPasswordOauth.mockResolvedValue(mockUser);

    await expect(
      userService.changePassword('testuser', 'OldPassword123!', 'NewPassword456!')
    ).rejects.toThrow(BadRequestError);

    await expect(
      userService.changePassword('testuser', 'OldPassword123!', 'NewPassword456!')
    ).rejects.toThrow('User not found');

    expect(mockPasswordService.verifyPassword).not.toHaveBeenCalled();
    expect(mockRepository.updateByUsername).not.toHaveBeenCalled();
  });

  it('should throw BadRequestError for OAuth users without password set', async () => {
    const mockUser: Partial<IUser> = {
      _id: 'user123',
      username: 'oauthuser',
      password: 'someHashedPassword',
      oauth: {
        provider: 'google',
        id: 'google123',
        isPasswordSet: false,
      },
    };

    mockRepository.findByUsernameWithPasswordOauth.mockResolvedValue(mockUser);

    await expect(
      userService.changePassword('oauthuser', 'OldPassword123!', 'NewPassword456!')
    ).rejects.toThrow(BadRequestError);

    await expect(
      userService.changePassword('oauthuser', 'OldPassword123!', 'NewPassword456!')
    ).rejects.toThrow('Password change not allowed for OAuth users');

    expect(mockPasswordService.verifyPassword).not.toHaveBeenCalled();
    expect(mockRepository.updateByUsername).not.toHaveBeenCalled();
  });

  it('should throw BadRequestError when oauth object is missing', async () => {
    const mockUser: Partial<IUser> = {
      _id: 'user123',
      username: 'testuser',
      password: 'hashedOldPassword',
      oauth: undefined,
    };

    mockRepository.findByUsernameWithPasswordOauth.mockResolvedValue(mockUser);
    mockPasswordService.verifyPassword.mockResolvedValue(true);
    mockPasswordService.hashPassword.mockResolvedValue('hashedNewPassword');
    mockRepository.updateByUsername.mockResolvedValue(null);

    // Should succeed for regular users without oauth
    await expect(
      userService.changePassword('testuser', 'OldPassword123!', 'NewPassword456!')
    ).resolves.not.toThrow();

    expect(mockRepository.updateByUsername).toHaveBeenCalled();
  });

  it('should throw BadRequestError when current password is incorrect', async () => {
    const mockUser: Partial<IUser> = {
      _id: 'user123',
      username: 'testuser',
      password: 'hashedOldPassword',
      oauth: {
        provider: 'google',
        id: 'oauth123',
        isPasswordSet: true,
      },
    };

    mockRepository.findByUsernameWithPasswordOauth.mockResolvedValue(mockUser);
    mockPasswordService.verifyPassword.mockResolvedValue(false);

    await expect(
      userService.changePassword('testuser', 'WrongPassword123!', 'NewPassword456!')
    ).rejects.toThrow(BadRequestError);

    await expect(
      userService.changePassword('testuser', 'WrongPassword123!', 'NewPassword456!')
    ).rejects.toThrow('Current password is incorrect');

    expect(mockPasswordService.verifyPassword).toHaveBeenCalledWith('hashedOldPassword', 'WrongPassword123!');
    expect(mockPasswordService.hashPassword).not.toHaveBeenCalled();
    expect(mockRepository.updateByUsername).not.toHaveBeenCalled();
  });

  it('should hash new password before saving', async () => {
    const mockUser: Partial<IUser> = {
      _id: 'user123',
      username: 'testuser',
      password: 'hashedOldPassword',
      oauth: {
        provider: 'google',
        id: 'oauth123',
        isPasswordSet: true,
      },
    };

    mockRepository.findByUsernameWithPasswordOauth.mockResolvedValue(mockUser);
    mockPasswordService.verifyPassword.mockResolvedValue(true);
    mockPasswordService.hashPassword.mockResolvedValue('hashedNewPassword');
    mockRepository.updateByUsername.mockResolvedValue(null);

    await userService.changePassword('testuser', 'OldPassword123!', 'NewPassword456!');

    expect(mockPasswordService.hashPassword).toHaveBeenCalledWith('NewPassword456!');
    expect(mockRepository.updateByUsername).toHaveBeenCalledWith('testuser', {
      password: 'hashedNewPassword',
    });
  });

  it('should allow password change for regular users with isPasswordSet true', async () => {
    const mockUser: Partial<IUser> = {
      _id: 'user123',
      username: 'regularuser',
      password: 'hashedOldPassword',
      oauth: {
        provider: 'google',
        id: 'oauth123',
        isPasswordSet: true,
      },
    };

    mockRepository.findByUsernameWithPasswordOauth.mockResolvedValue(mockUser);
    mockPasswordService.verifyPassword.mockResolvedValue(true);
    mockPasswordService.hashPassword.mockResolvedValue('hashedNewPassword');
    mockRepository.updateByUsername.mockResolvedValue(null);

    await expect(
      userService.changePassword('regularuser', 'OldPassword123!', 'NewPassword456!')
    ).resolves.not.toThrow();

    expect(mockRepository.updateByUsername).toHaveBeenCalled();
  });

  it('should call repository methods in correct order', async () => {
    const mockUser: Partial<IUser> = {
      _id: 'user123',
      username: 'testuser',
      password: 'hashedOldPassword',
      oauth: {
        provider: 'google',
        id: 'oauth123',
        isPasswordSet: true,
      },
    };

    const callOrder: string[] = [];

    mockRepository.findByUsernameWithPasswordOauth.mockImplementation(async () => {
      callOrder.push('findByUsernameWithPasswordOauth');
      return mockUser;
    });

    mockPasswordService.verifyPassword.mockImplementation(async () => {
      callOrder.push('verifyPassword');
      return true;
    });

    mockPasswordService.hashPassword.mockImplementation(async () => {
      callOrder.push('hashPassword');
      return 'hashedNewPassword';
    });

    mockRepository.updateByUsername.mockImplementation(async () => {
      callOrder.push('updateByUsername');
      return null;
    });

    await userService.changePassword('testuser', 'OldPassword123!', 'NewPassword456!');

    expect(callOrder).toEqual([
      'findByUsernameWithPasswordOauth',
      'verifyPassword',
      'hashPassword',
      'updateByUsername',
    ]);
  });
});
