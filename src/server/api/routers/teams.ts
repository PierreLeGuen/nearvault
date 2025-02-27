import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const teamsRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
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

  assertCurrentTeam: protectedProcedure.query(async ({ ctx }) => {
    const userWithTeam = await ctx.prisma.user.findUnique({
      where: {
        id: ctx.session.user.id,
      },
      include: {
        currentTeam: true,
      },
    });

    if (!userWithTeam) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Current user not found.",
      });
    }

    let team = userWithTeam.currentTeam;

    if (!team) {
      const userTeam = await ctx.prisma.userTeam.findFirst({
        where: {
          userId: ctx.session.user.id,
        },
        include: {
          team: true,
        },
      });

      if (!userTeam) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User is not part of any team.",
        });
      }

      await ctx.prisma.user.update({
        where: {
          id: ctx.session.user.id,
        },
        data: {
          currentTeam: {
            connect: {
              id: userTeam.teamId,
            },
          },
        },
      });
      team = userTeam.team;
    }

    return team;
  }),

  switchTeam: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Check if the user is part of the team they want to switch to
      const isMember = await ctx.prisma.userTeam.findUnique({
        where: {
          userId_teamId: {
            userId: ctx.session.user.id,
            teamId: input.teamId,
          },
        },
      });

      // If not a member, throw an error
      if (!isMember) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this team.",
        });
      }

      // If the user is a member, update their currentTeamId
      const updatedUser = await ctx.prisma.user.update({
        where: {
          id: ctx.session.user.id,
        },
        data: {
          currentTeamId: input.teamId,
        },
      });

      // Return some kind of success message or the updated user object
      return {
        message: "Team switched successfully",
        teamId: updatedUser.currentTeamId,
      };
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
      z.object({ walletAddresses: z.array(z.string()), teamId: z.string() }),
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
              `The wallet ${walletAddress} already exists for this team.`,
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
        } catch (error) {
          errors.push(
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-member-access
            `Error processing wallet ${walletAddress}: ${(error as Error).message
            }`,
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
      }),
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
      }),
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

  getPendingInvitationsForUser: protectedProcedure.query(async ({ ctx }) => {
    // Fetch all team invitations for the logged-in user
    return ctx.prisma.teamInvitation.findMany({
      where: {
        invitedEmail: ctx.session.user.email,
        status: "PENDING",
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
      }),
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

      let invitedUserId = "";

      if (invitedUser) {
        invitedUserId = invitedUser.id;

        // Check if the user is already part of the team
        const existingMember = await ctx.prisma.userTeam.findUnique({
          where: {
            userId_teamId: {
              userId: invitedUserId,
              teamId: input.teamId,
            },
          },
        });

        if (existingMember) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "The user is already a member of the team.",
          });
        }
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

      const member = await ctx.prisma.userTeam.findUnique({
        where: {
          userId_teamId: {
            userId: ctx.session.user.id,
            teamId: invitation.teamId,
          },
        },
      });

      if (!member) {
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
      }),
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

      await ctx.prisma.teamInvitation.delete({
        where: {
          id: input.invitationId,
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

  deleteTeamMember: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        memberId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Fetch the member to be deleted
      const initiatingMember = await ctx.prisma.userTeam.findUnique({
        where: {
          userId_teamId: {
            userId: ctx.session.user.id,
            teamId: input.teamId,
          },
        },
      });

      if (!initiatingMember) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to update members of that team.",
        });
      }

      const member = await ctx.prisma.userTeam.findUnique({
        where: {
          userId_teamId: {
            userId: input.memberId,
            teamId: input.teamId,
          },
        },
      });

      if (!member) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found.",
        });
      }

      // Delete the member
      await ctx.prisma.userTeam.delete({
        where: {
          userId_teamId: {
            userId: input.memberId,
            teamId: input.teamId,
          },
        },
      });

      return {
        message: "Member successfully deleted",
      };
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
          wallet: true,
        },
      });
    }),


  setRpcUrl: protectedProcedure
    .input(z.object({ teamId: z.string(), rpcUrl: z.string() }))
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
          message: "You are not authorized to update this team's RPC URL.",
        });
      }

      return ctx.prisma.team.update({
        where: { id: input.teamId },
        data: {
          rpcUrl: input.rpcUrl,
        },
      });
    }),

  getRpcUrl: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.team.findUnique({
        where: { id: input.teamId },
      });
    }),

  insertTransferHistory: protectedProcedure
    .input(
      z.object({
        walletId: z.string(),
        tokenAddress: z.string(),
        amount: z.string(),
        createRequestTxnId: z.string(),
        memo: z.string().optional(),
        teamId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Check if the user is part of the team they are trying to create a transaction for
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
            "You are not authorized to create a transaction for this team.",
        });
      }

      const creatorEmail = ctx.session.user.email;

      // Insert new transaction
      const newTransaction = await ctx.prisma.transferHistory.create({
        data: {
          token: input.tokenAddress,
          amount: input.amount,
          createRequestTxnId: input.createRequestTxnId,
          memo: input.memo,
          team: {
            connect: {
              id: input.teamId,
            },
          },
          creator: {
            connect: {
              email: creatorEmail,
            },
          },
          wallet: {
            connect: {
              id: input.walletId,
            },
          },
        },
      });

      return newTransaction;
    }),
});
