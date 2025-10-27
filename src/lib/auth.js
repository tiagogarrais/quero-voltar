import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { sendVerificationRequest } from "@/lib/email";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
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
        console.log("SignIn callback:", { user: user?.email, account: account?.provider });
        return true;
      } catch (error) {
        console.error("Erro no callback signIn:", error);
        return false;
      }
    },
    async session({ session, token }) {
      try {
        if (token && token.id) {
          session.user.id = token.id;
          // Adicionar campos do perfil
          try {
            const user = await prisma.user.findUnique({
              where: { id: token.id },
              select: {
                fullName: true,
                birthDate: true,
                cpf: true,
                whatsapp: true,
                whatsappCountryCode: true,
                whatsappConsent: true,
              },
            });
            if (user) {
              session.user = { ...session.user, ...user };
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
    async jwt({ token, user }) {
      try {
        if (user) {
          token.id = user.id;
        }
        return token;
      } catch (error) {
        console.error("Erro no callback JWT:", error);
        return token;
      }
    },
  },
};
