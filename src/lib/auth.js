import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { sendVerificationRequest } from "@/lib/email";

// Adapter customizado seguindo a documentação do PrismaAdapter
const CustomPrismaAdapter = (p) => {
  const adapter = PrismaAdapter(p);

  return {
    ...adapter,
    // Simplificar createUser para seguir a documentação
    createUser: async (data) => {
      console.log("Criando usuário:", data);
      // Usar apenas os campos que pertencem à tabela User
      const userData = {
        id: data.id || undefined, // Deixar o Prisma gerar se não fornecido
        name: data.name,
        email: data.email,
        emailVerified: data.emailVerified,
        image: data.image,
      };

      console.log("Dados do usuário a serem criados:", userData);
      return p.user.create({ data: userData });
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
