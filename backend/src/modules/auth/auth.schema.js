import { z } from 'zod';

const DISPOSABLE_DOMAINS = [
  'tempmail.com', 'mailinator.com', '10minutemail.com', 'dispostable.com',
  'guerrillamail.com', 'throwawaymail.com', 'fake.com', 'test.com',
  'example.com', 'foo.com', 'bar.com', 'asdf.com', 'abc.com', '123.com', 'yopmail.com'
];

const emailValidator = z.string()
  .email('Please enter a valid email address (e.g. name@gmail.com)')
  .refine((email) => {
    const domain = email.split('@')[1]?.toLowerCase();
    return domain && !DISPOSABLE_DOMAINS.includes(domain);
  }, { message: 'Disposable or dummy email domains are not allowed. Please enter a valid Google (@gmail.com) or verified email.' })
  .refine((email) => {
    const parts = email.split('@');
    if (parts.length !== 2) return false;
    const domainParts = parts[1].split('.');
    return domainParts.length >= 2 && domainParts[domainParts.length - 1].length >= 2;
  }, { message: 'Email must contain a valid domain extension (e.g. .com, .ai, .org)' });

export const RegisterSchema = z.object({
  email: emailValidator,
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  role: z.enum(['admin', 'user']).optional(),
});

export const LoginSchema = z.object({
  email: emailValidator,
  password: z.string().min(1, 'Password is required'),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
