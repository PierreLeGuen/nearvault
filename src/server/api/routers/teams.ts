import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const teamsRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.example.findMany();
  }),

  getTeamsForUser: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.userTeam.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      include: {
        team: true,
      },
    });
  }),

  createTeam: protectedProcedure
    .input(z.object({ teamName: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const newTeam = await ctx.prisma.team.create({
        data: {
          name: input.teamName,
        },
      });

      await ctx.prisma.userTeam.create({
        data: {
          user: {
            connect: {
              id: ctx.session.user.id,
            },
          },
          team: {
            connect: {
              id: newTeam.id,
            },
          },
        },
      });

      return newTeam;
    }),

  getWalletsForTeam: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .query(async ({ input, ctx }) => {
      const userTeam = await ctx.prisma.userTeam.findUnique({
        where: {
          userId_teamId: {
            userId: ctx.session.user.id,
            teamId: input.teamId,
          },
        },
      });

      if (!userTeam) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not part of this team.",
        });
      }

      return await ctx.prisma.wallet.findMany({
        where: {
          teamId: input.teamId,
        },
      });
    }),
});
