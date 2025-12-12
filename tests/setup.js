// Mock Prisma client for testing
export const mockPrisma = {
    user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
    },
    profile: {
        create: jest.fn(),
        update: jest.fn(),
    },
    doctor: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
    },
    availabilitySlot: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    consultation: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
    },
    prescription: {
        findFirst: jest.fn(),
        create: jest.fn(),
    },
    payment: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        aggregate: jest.fn(),
    },
    auditLog: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
    },
    idempotencyKey: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
    $queryRaw: jest.fn(),
    $disconnect: jest.fn(),
};

// Setup before each test
beforeEach(() => {
    jest.clearAllMocks();
});

// Cleanup after all tests
afterAll(async () => {
    // Add any cleanup logic here
});
