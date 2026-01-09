import { z } from 'zod';
import { publicProcedure, router } from './_core/trpc';
import { createUser, authenticateUser, getUserById } from './db';
import { TRPCError } from '@trpc/server';

/**
 * Simple authentication router for username+password login
 */
export const simpleAuthRouter = router({
  /**
   * Register a new user
   */
  register: publicProcedure
    .input(
      z.object({
        username: z.string().min(3).max(20),
        password: z.string().min(6).max(50),
        name: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await createUser(input.username, input.password, input.name);
      
      if (!result.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: result.message,
        });
      }

      // Set session cookie
      if (result.userId) {
        ctx.res.cookie('simple_auth_session', JSON.stringify({
          userId: result.userId,
          username: input.username,
        }), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });
      }

      return {
        success: true,
        message: result.message,
        userId: result.userId,
      };
    }),

  /**
   * Login with username and password
   */
  login: publicProcedure
    .input(
      z.object({
        username: z.string(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await authenticateUser(input.username, input.password);
      
      if (!result.success) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: result.message,
        });
      }

      // Set session cookie
      if (result.user) {
        ctx.res.cookie('simple_auth_session', JSON.stringify({
          userId: result.user.id,
          username: result.user.username,
        }), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });
      }

      return {
        success: true,
        message: result.message,
        user: result.user,
      };
    }),

  /**
   * Logout
   */
  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie('simple_auth_session');
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }),

  /**
   * Get current user from session
   */
  me: publicProcedure.query(async ({ ctx }) => {
    const cookies = ctx.req.headers.cookie || '';
    const sessionCookie = cookies
      .split(';')
      .find((c) => c.trim().startsWith('simple_auth_session='));

    if (!sessionCookie) {
      return null;
    }

    try {
      const sessionValue = sessionCookie.split('=')[1];
      const session = JSON.parse(decodeURIComponent(sessionValue));
      
      if (!session.userId) {
        return null;
      }

      const user = await getUserById(session.userId);
      
      if (!user) {
        return null;
      }

      return {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastSignedIn: user.lastSignedIn,
      };
    } catch (error) {
      console.error('[Auth] Failed to parse session:', error);
      return null;
    }
  }),

  /**
   * Check if username is available
   */
  checkUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ input }) => {
      const { getUserByUsername } = await import('./db');
      const user = await getUserByUsername(input.username);
      return {
        available: !user,
      };
    }),
});
