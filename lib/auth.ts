import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabase } from './supabase';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Get user from database
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', credentials.email)
          .single();

        if (error || !user) {
          return null;
        }

        // Verify password
        if (!user.password_hash) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password_hash);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || user.full_name,
          image: user.picture_url || user.avatar_url,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        // Create or update user in database
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', user.email)
          .single();

        if (!existingUser) {
          // Create new user
          const { error } = await supabase.from('users').insert({
            email: user.email,
            name: user.name,
            full_name: user.name,
            picture_url: user.image,
            avatar_url: user.image,
            google_id: profile?.sub,
            subscription_status: 'trialing',
            trial_transcriptions_used: 0,
            trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          });

          if (error) {
            console.error('[Auth] Error creating user:', error);
            return false;
          }
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        // Get user ID from database
        const { data: dbUser } = await supabase
          .from('users')
          .select('id, subscription_status')
          .eq('email', user.email)
          .single();

        if (dbUser) {
          token.id = dbUser.id;
          token.subscriptionStatus = dbUser.subscription_status;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).subscriptionStatus = token.subscriptionStatus;
      }

      return session;
    },
  },
  pages: {
    signIn: '/signin',
    signUp: '/signup',
    error: '/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
