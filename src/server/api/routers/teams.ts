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

  getMembersForTeam: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .query(async ({ input, ctx }) => {
      // Check if the user is part of the team they are trying to get members for
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
          message: "You are not authorized to view members of this team.",
        });
      }

      // Get all user-teams with the specified team ID
      const teamMembers = await ctx.prisma.userTeam.findMany({
        where: {
          teamId: input.teamId,
        },
        include: {
          user: true, // Include user data in the result
        },
      });

      // Return only the user data for each team member
      return teamMembers.map((member) => member.user);
    }),

  // WALLET ROUTES
  addWalletsForTeam: protectedProcedure
    .input(
      z.object({ walletAddresses: z.array(z.string()), teamId: z.string() })
    )
    .mutation(async ({ input, ctx }) => {
      const { walletAddresses, teamId } = input;

      // Check if the user is part of the team they are trying to add wallets to
      const userTeam = await ctx.prisma.userTeam.findUnique({
        where: {
          userId_teamId: {
            userId: ctx.session.user.id,
            teamId,
          },
        },
      });

      if (!userTeam) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to add wallets to this team.",
        });
      }

      const newWallets = [];
      const errors = [];

      for (const walletAddress of walletAddresses) {
        try {
          // Check if the wallet already exists for the team
          const existingWallet = await ctx.prisma.wallet.findFirst({
            where: {
              walletAddress,
              teamId,
            },
          });

          if (existingWallet) {
            errors.push(
              `The wallet ${walletAddress} already exists for this team.`
            );
            continue;
          }

          // Create the new wallet
          const newWallet = await ctx.prisma.wallet.create({
            data: {
              walletAddress,
              team: {
                connect: {
                  id: teamId,
                },
              },
            },
          });

          newWallets.push(newWallet);
        } catch (error: any) {
          errors.push(
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-member-access
            `Error processing wallet ${walletAddress}: ${error.message}`
          );
        }
      }

      return { newWallets, errors };
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

  deleteWalletForTeam: protectedProcedure
    .input(z.object({ walletId: z.string(), teamId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Check if the user is part of the team they are trying to delete a wallet from
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
          message: "You are not authorized to delete a wallet from this team.",
        });
      }

      // Fetch the wallet to be deleted
      const wallet = await ctx.prisma.wallet.findUnique({
        where: {
          id: input.walletId,
        },
      });

      if (!wallet) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Wallet not found.",
        });
      }

      // Check if the wallet belongs to the team
      if (wallet.teamId !== input.teamId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The wallet does not belong to this team.",
        });
      }

      // Delete the wallet
      await ctx.prisma.wallet.delete({
        where: {
          id: input.walletId,
        },
      });

      return {
        message: "Wallet successfully deleted",
      };
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

  getInvitationsForUser: protectedProcedure.query(async ({ ctx }) => {
    // Fetch all team invitations for the logged-in user
    return ctx.prisma.teamInvitation.findMany({
      where: {
        invitedUserId: ctx.session.user.id,
      },
      include: {
        team: true,
      },
    });
  }),

  inviteToTeam: protectedProcedure
    .input(
      z.object({
        invitedEmail: z.string(),
        teamId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
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
          message: "You are not authorized to invite a user to this team.",
        });
      }

      const invitedUser = await ctx.prisma.user.findUnique({
        where: {
          email: input.invitedEmail,
        },
      });

      let invitedUserId = null;

      if (invitedUser) {
        invitedUserId = invitedUser.id;
      }

      const newInvitation = await ctx.prisma.teamInvitation.create({
        data: {
          invitedEmail: input.invitedEmail,
          invitedBy: {
            connect: {
              id: ctx.session.user.id,
            },
          },
          invitedUser: invitedUserId
            ? {
                connect: {
                  id: invitedUserId,
                },
              }
            : undefined,
          team: {
            connect: {
              id: input.teamId,
            },
          },
        },
      });

      return newInvitation;
    }),

  deleteInvitation: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Fetch the invitation to be deleted
      const invitation = await ctx.prisma.teamInvitation.findUnique({
        where: {
          id: input.invitationId,
        },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found.",
        });
      }

      // Check if the logged-in user is the one who created the invitation
      if (invitation.invitedById !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to delete this invitation.",
        });
      }

      // Delete the invitation
      await ctx.prisma.teamInvitation.delete({
        where: {
          id: input.invitationId,
        },
      });

      return {
        message: "Invitation successfully deleted",
      };
    }),

  acceptOrRejectInvitation: protectedProcedure
    .input(
      z.object({
        invitationId: z.string(),
        status: z.enum(["ACCEPTED", "REJECTED"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Fetch the invitation to be updated
      const invitation = await ctx.prisma.teamInvitation.findUnique({
        where: {
          id: input.invitationId,
        },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found.",
        });
      }
      console.log(invitation);

      // Check if the logged-in user is the invited user
      if (invitation.invitedEmail !== ctx.session.user.email) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to update this invitation.",
        });
      }

      // Check if the invitation has already been accepted or rejected
      if (invitation.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "You cannot modify an invitation that's been accepted or rejected.",
        });
      }

      // Update the invitation status
      const updatedInvitation = await ctx.prisma.teamInvitation.update({
        where: {
          id: input.invitationId,
        },
        data: {
          status: input.status,
          ...(input.status === "ACCEPTED" && { acceptedAt: new Date() }),
          ...(input.status === "REJECTED" && { rejectedAt: new Date() }),
        },
      });

      // If the status is "ACCEPTED", connect the user with the team in the UserTeam table
      if (input.status === "ACCEPTED") {
        await ctx.prisma.userTeam.create({
          data: {
            user: {
              connect: {
                id: ctx.session.user.id,
              },
            },
            team: {
              connect: {
                id: invitation.teamId,
              },
            },
          },
        });
      }

      return updatedInvitation;
    }),

  getInvitationsForTeam: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .query(async ({ input, ctx }) => {
      // Check if the user is part of the team they are trying to get invitations for
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
          message: "You are not authorized to view invitations of this team.",
        });
      }

      // Fetch all team invitations for the specified team
      return ctx.prisma.teamInvitation.findMany({
        where: {
          teamId: input.teamId,
          status: "PENDING",
        },
        include: {
          team: true,
          invitedBy: true,
          invitedUser: true,
        },
      });
    }),

  getTeamTransactionsHistory: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .query(async ({ input, ctx }) => {
      // Check if the user is part of the team they are trying to get transactions for
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
          message: "You are not authorized to view transactions of this team.",
        });
      }

      // Fetch all transactions for the specified team
      return ctx.prisma.transferHistory.findMany({
        where: {
          teamId: input.teamId,
        },
        include: {
          team: true,
          creator: true,
        },
      });
    }),
});
