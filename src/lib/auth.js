import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { sendVerificationRequest } from "@/lib/email";

export const authOptions = {
  adapter: PrismaAdapter(prisma), // Usar adapter padrão temporariamente
  debug: process.env.NODE_ENV === "development",
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASS,
        },
      },
      from: process.env.EMAIL_FROM,
      sendVerificationRequest,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "database",
  },
  pages: {
    // you can customize sign in/out/error etc here
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        console.log("SignIn callback:", {
          user: user?.email,
          account: account?.provider,
          userId: user?.id,
          userIdType: typeof user?.id,
        });
        return true;
      } catch (error) {
        console.error("Erro no callback signIn:", error);
        return false;
      }
    },
    async session({ session, token, user }) {
      try {
        // Primeiro tentar pegar o ID do token
        if (token && token.sub) {
          console.log("Session callback - token.sub:", token.sub);
          session.user.id = token.sub;
        } else if (token && token.id) {
          console.log("Session callback - token.id:", token.id);
          session.user.id = token.id;
        } else if (user && user.id) {
          console.log("Session callback - user.id:", user.id);
          session.user.id = user.id;
        }

        // Se ainda não temos ID, tentar buscar do banco
        if (!session.user.id && session.user.email) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: session.user.email },
              select: { id: true },
            });
            if (dbUser) {
              console.log("Session callback - dbUser.id:", dbUser.id);
              session.user.id = dbUser.id;
            }
          } catch (dbError) {
            console.error("Erro ao buscar ID do usuário no banco:", dbError);
          }
        }

        console.log("Session final user ID:", session.user.id);

        // Adicionar campos do perfil da tabela Usuario
        if (session.user.id) {
          try {
            const profile = await prisma.usuario.findUnique({
              where: { userId: session.user.id },
            });
            if (profile) {
              session.user = {
                ...session.user,
                fullName: profile.fullName,
                birthDate: profile.birthDate,
                cpf: profile.cpf,
                whatsapp: profile.whatsapp,
                whatsappCountryCode: profile.whatsappCountryCode,
                whatsappConsent: profile.whatsappConsent,
              };
            }
          } catch (dbError) {
            console.error("Erro ao buscar dados do usuário no banco:", dbError);
            // Continuar sem os dados extras do perfil
          }
        }
        return session;
      } catch (error) {
        console.error("Erro no callback de sessão:", error);
        // Retornar sessão sem campos extras em caso de erro
        return session;
      }
    },
    async jwt({ token, user, account }) {
      try {
        if (user) {
          console.log("JWT callback - user.id:", user.id, "user object:", user);
          token.id = user.id;
        }

        // Se não temos ID no token mas temos email, buscar do banco
        if (!token.id && token.email) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: token.email },
              select: { id: true },
            });
            if (dbUser) {
              console.log("JWT callback - found user ID from DB:", dbUser.id);
              token.id = dbUser.id;
            }
          } catch (dbError) {
            console.error(
              "Erro ao buscar ID do usuário no JWT callback:",
              dbError
            );
          }
        }

        console.log("JWT final token.id:", token.id);
        return token;
      } catch (error) {
        console.error("Erro no callback JWT:", error);
        return token;
      }
    },
    redirect: async ({ url, baseUrl }) => {
      // Após login, redirecionar para a página inicial (que agora é a welcome)
      return baseUrl;
    },
  },
};
