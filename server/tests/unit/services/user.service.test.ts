import { UserService } from '../../../src/services/user.service';
import { UserRepository } from '../../../src/repositories/user.repository';

describe('UserService.list', () => {
  let userService: UserService;
  let mockRepository: jest.Mocked<Pick<UserRepository, 'findAll' | 'countDocuments'>>;

  beforeEach(() => {
    // Create a type-safe mock with only the methods needed for these tests
    mockRepository = {
      findAll: jest.fn(),
      countDocuments: jest.fn(),
    };

    // Cast to UserRepository for dependency injection (acceptable for unit tests)
    userService = new UserService(mockRepository as unknown as UserRepository);
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
