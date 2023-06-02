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

  // WALLET ROUTES
  addWalletForTeam: protectedProcedure
    .input(z.object({ walletAddress: z.string(), teamId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Check if the user is part of the team they are trying to add a wallet to
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
          message: "You are not authorized to add a wallet to this team.",
        });
      }

      // Create the new wallet
      const newWallet = await ctx.prisma.wallet.create({
        data: {
          walletAddress: input.walletAddress,
          team: {
            connect: {
              id: input.teamId,
            },
          },
        },
      });

      return newWallet;
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

  // BENEFICIARY ROUTES

  addBeneficiaryForTeam: protectedProcedure
    .input(
      z.object({
        walletAddress: z.string(),
        teamId: z.string(),
        firstName: z.string(),
        lastName: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if the user is part of the team
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
          message: "You are not authorized to add a beneficiary to this team.",
        });
      }

      const newWallet = await ctx.prisma.beneficiary.create({
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          walletAddress: input.walletAddress,
          team: {
            connect: {
              id: input.teamId,
            },
          },
        },
      });

      return newWallet;
    }),
  getBeneficiariesForTeam: protectedProcedure
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

      return await ctx.prisma.beneficiary.findMany({
        where: {
          teamId: input.teamId,
        },
      });
    }),
  deleteBeneficiaryForTeam: protectedProcedure
    .input(
      z.object({
        beneficiaryId: z.string(),
        teamId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if the user is part of the team
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
          message:
            "You are not authorized to delete a beneficiary from this team.",
        });
      }

      const beneficiary = await ctx.prisma.beneficiary.findUnique({
        where: {
          id: input.beneficiaryId,
        },
      });

      if (!beneficiary) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Beneficiary not found",
        });
      }

      await ctx.prisma.beneficiary.delete({
        where: {
          id: input.beneficiaryId,
        },
      });

      return {
        message: "Beneficiary successfully deleted",
      };
    }),
});
