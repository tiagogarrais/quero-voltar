import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { sendVerificationRequest } from "@/lib/email";
import { randomUUID } from "crypto";

// Adapter customizado para garantir geração correta de UUIDs
const CustomPrismaAdapter = (p) => {
  const adapter = PrismaAdapter(p);

  return {
    ...adapter,
    createUser: async (data) => {
      console.log("Creating user with data:", data);
      // Garantir que o ID seja gerado como UUID e seja uma string
      const userData = {
        ...data,
        id: typeof data.id === "string" ? data.id : randomUUID(),
      };
      console.log("User data with ID:", userData);
      console.log("ID type:", typeof userData.id, "ID value:", userData.id);

      // Verificar se o ID é realmente uma string UUID válida
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userData.id)) {
        console.error("ID gerado não é um UUID válido:", userData.id);
        userData.id = randomUUID();
        console.log("Novo ID gerado:", userData.id);
      }

      // Remover campos que não pertencem à tabela User (autenticação)
      const {
        fullName,
        birthDate,
        cpf,
        whatsapp,
        whatsappCountryCode,
        whatsappConsent,
        ...cleanUserData
      } = userData;

      return p.user.create({ data: cleanUserData });
    },
  };
};

export const authOptions = {
  adapter: CustomPrismaAdapter(prisma),
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
    async session({ session, token }) {
      try {
        if (token && token.id) {
          console.log(
            "Session callback - token.id:",
            token.id,
            "type:",
            typeof token.id
          );
          session.user.id = token.id;
          // Adicionar campos do perfil da tabela Usuario
          try {
            const profile = await prisma.usuario.findUnique({
              where: { userId: token.id },
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
    async jwt({ token, user }) {
      try {
        if (user) {
          console.log(
            "JWT callback - user.id:",
            user.id,
            "type:",
            typeof user.id
          );
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
