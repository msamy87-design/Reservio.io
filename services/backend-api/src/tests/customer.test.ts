import { CustomerUser } from '../models/User';
import * as authService from '../services/authService';

// Set JWT secret for testing
beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-key-for-customer-tests-must-be-long-enough';
});

describe('Customer Authentication System', () => {
  describe('Customer Signup', () => {
    it('should signup a new customer successfully', async () => {
      const userData = {
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        phone: '+1-555-123-4567'
      };

      const result = await authService.signupCustomer(
        userData.fullName,
        userData.email,
        userData.password,
        userData.phone
      );

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.fullName).toBe(userData.fullName);
      expect(result.user.email).toBe(userData.email);
      expect(result.user.favoriteBusinessIds).toEqual([]);
    });

    it('should signup customer without phone', async () => {
      const result = await authService.signupCustomer(
        'Jane Smith',
        'jane@example.com',
        'SecurePass123!'
      );

      expect(result.user.fullName).toBe('Jane Smith');
      expect(result.user.email).toBe('jane@example.com');
    });

    it('should fail signup with duplicate email', async () => {
      await authService.signupCustomer(
        'First User',
        'duplicate@example.com',
        'Password123!'
      );

      await expect(
        authService.signupCustomer(
          'Second User',
          'duplicate@example.com',
          'AnotherPass123!'
        )
      ).rejects.toThrow('already exists');
    });
  });

  describe('Customer Login', () => {
    beforeEach(async () => {
      // Create a test customer
      const customer = new CustomerUser({
        fullName: 'Test Customer',
        email: 'test@customer.com',
        password: 'TestPassword123!',
        phone: '+1-555-999-0000',
        favoriteBusinessIds: []
      });
      await customer.save();
    });

    it('should login existing customer successfully', async () => {
      const result = await authService.loginCustomer(
        'test@customer.com',
        'TestPassword123!'
      );

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('test@customer.com');
      expect(result.user.fullName).toBe('Test Customer');
    });

    it('should fail login with wrong password', async () => {
      await expect(
        authService.loginCustomer('test@customer.com', 'WrongPassword')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should fail login with non-existent email', async () => {
      await expect(
        authService.loginCustomer('nonexistent@example.com', 'Password123!')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should update lastLogin on successful login', async () => {
      const beforeLogin = new Date();
      
      await authService.loginCustomer('test@customer.com', 'TestPassword123!');
      
      const user = await CustomerUser.findOne({ email: 'test@customer.com' });
      expect(user?.lastLogin).toBeDefined();
      expect(user?.lastLogin?.getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
    });
  });

  describe('Token Management', () => {
    let customerId: string;
    let refreshToken: string;

    beforeEach(async () => {
      const result = await authService.signupCustomer(
        'Token Test User',
        'tokentest@example.com',
        'TokenPass123!'
      );
      customerId = result.user.id;
      refreshToken = result.refreshToken;
    });

    it('should refresh access token successfully', async () => {
      const result = await authService.refreshAccessToken(refreshToken, 'customer');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.refreshToken).not.toBe(refreshToken); // Should be a new refresh token
    });

    it('should fail refresh with invalid token', async () => {
      await expect(
        authService.refreshAccessToken('invalid-token', 'customer')
      ).rejects.toThrow();
    });

    it('should logout successfully', async () => {
      // Verify token is in user's refresh tokens
      let user = await CustomerUser.findById(customerId);
      expect(user?.refreshTokens).toContain(refreshToken);

      // Logout
      await authService.logout(refreshToken, 'customer');

      // Verify token is removed
      user = await CustomerUser.findById(customerId);
      expect(user?.refreshTokens).not.toContain(refreshToken);
    });

    it('should logout from all devices', async () => {
      // Create multiple refresh tokens
      const result2 = await authService.refreshAccessToken(refreshToken, 'customer');
      const result3 = await authService.refreshAccessToken(result2.refreshToken, 'customer');

      // Verify user has multiple tokens
      let user = await CustomerUser.findById(customerId);
      expect(user?.refreshTokens.length).toBeGreaterThan(1);

      // Logout from all devices
      await authService.logoutFromAllDevices(customerId, 'customer');

      // Verify all tokens are removed
      user = await CustomerUser.findById(customerId);
      expect(user?.refreshTokens).toEqual([]);
    });

    it('should limit refresh tokens to 5', async () => {
      const customer = await CustomerUser.findById(customerId);
      if (!customer) throw new Error('Customer not found');

      // Add 6 refresh tokens
      for (let i = 0; i < 6; i++) {
        customer.refreshTokens.push(`token-${i}`);
      }
      await customer.save();

      // Login should trigger token cleanup
      await authService.loginCustomer('tokentest@example.com', 'TokenPass123!');

      const updatedCustomer = await CustomerUser.findById(customerId);
      expect(updatedCustomer?.refreshTokens.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Customer Model Validation', () => {
    it('should validate required fields', async () => {
      const customer = new CustomerUser({});
      
      const validation = customer.validateSync();
      expect(validation?.errors.fullName).toBeDefined();
      expect(validation?.errors.email).toBeDefined();
      expect(validation?.errors.password).toBeDefined();
    });

    it('should validate email format', async () => {
      const customer = new CustomerUser({
        fullName: 'Test User',
        email: 'invalid-email',
        password: 'Password123!'
      });

      const validation = customer.validateSync();
      expect(validation?.errors.email).toBeDefined();
    });

    it('should validate phone format', async () => {
      const customer = new CustomerUser({
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        phone: 'invalid-phone'
      });

      const validation = customer.validateSync();
      expect(validation?.errors.phone).toBeDefined();
    });

    it('should accept valid phone formats', async () => {
      const validPhones = [
        '+1-555-123-4567',
        '555-123-4567',
        '+44 20 7946 0958',
        '(555) 123-4567',
        '+1 555 123 4567'
      ];

      for (const phone of validPhones) {
        const customer = new CustomerUser({
          fullName: 'Test User',
          email: `test${phone.replace(/\D/g, '')}@example.com`,
          password: 'Password123!',
          phone
        });

        const validation = customer.validateSync();
        expect(validation?.errors.phone).toBeUndefined();
      }
    });

    it('should set default values correctly', async () => {
      const customer = new CustomerUser({
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'Password123!'
      });

      expect(customer.isActive).toBe(true);
      expect(customer.emailVerified).toBe(false);
      expect(customer.favoriteBusinessIds).toEqual([]);
      expect(customer.refreshTokens).toEqual([]);
    });
  });
});