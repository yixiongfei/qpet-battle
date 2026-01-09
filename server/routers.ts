import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { petRouter } from "./petRouter";
import { friendRouter } from "./friendRouter";
import { petCustomizationRouter } from "./petCustomizationRouter";
import { turnBasedBattleRouter } from "./turnBasedBattleRouter";
import { lobbyRouter } from "./lobbyRouter";
import { evolutionRouter } from "./evolutionRouter";
import { simpleAuthRouter } from "./simpleAuthRouter";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie('simple_auth_session');
      return {
        success: true,
      } as const;
    }),
  }),
  simpleAuth: simpleAuthRouter,

  pet: petRouter,
  petCustomization: petCustomizationRouter,
  turnBasedBattle: turnBasedBattleRouter,
  friend: friendRouter,
  lobby: lobbyRouter,
  evolution: evolutionRouter,
});

export type AppRouter = typeof appRouter;
