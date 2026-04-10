import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import prisma from './prisma';
import { rateLimit } from './rate-limit';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email va parol kiritilishi kerak');
        }

        const email = credentials.email.trim().toLowerCase();
        const limitResult = rateLimit(`login:${email}`, 5, 60 * 1000);
        if (!limitResult.success) {
          throw new Error(`Juda ko'p urinish. ${Math.ceil(limitResult.retryAfterMs / 1000)} soniyadan keyin qayta urinib ko'ring`);
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: { organization: true }
        });

        if (!user) {
          throw new Error('Email yoki parol noto\'g\'ri');
        }

        if (user.organization && user.organization.status === 'DELETED') {
          throw new Error('Tashkilot o\'chirilgan');
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error('Email yoki parol noto\'g\'ri');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
          organizationName: user.organization?.name || null,
          orgStatus: user.organization?.status || null
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.organizationName = user.organizationName;
        token.orgStatus = user.orgStatus;
        token.name = user.name;
        token.email = user.email;
      }

      if (trigger === 'update' && session?.user) {
        if (session.user.name !== undefined) token.name = session.user.name;
        if (session.user.email !== undefined) token.email = session.user.email;
        if (session.user.organizationName !== undefined) token.organizationName = session.user.organizationName;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.role = token.role;
        session.user.organizationId = token.organizationId;
        session.user.organizationName = token.organizationName;
        session.user.orgStatus = token.orgStatus;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 soat
  },
  secret: (() => {
    if (!process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET === 'your-super-secret-key-change-in-production') {
      console.error('XAVF: NEXTAUTH_SECRET environment variable sozlanmagan yoki default qiymatda!');
      if (process.env.NODE_ENV === 'production') {
        throw new Error('NEXTAUTH_SECRET must be set in production');
      }
      return 'dev-only-fallback-secret-not-for-production';
    }
    return process.env.NEXTAUTH_SECRET;
  })(),
};
