import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./lib/db";

const GoogleClientId = process.env.GOOGLE_CLIENT_ID;
const GoogleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!GoogleClientId || !GoogleClientSecret) {
  throw new Error(
    "Please provide GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment variables",
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) {
          throw new Error("Please provide both email and password");
        }

        const user = await db.user.findUnique({
          where: {
            email,
          },
        });

        if (!user) {
          throw new Error("User not registered");
        }

        if (!user.password) {
          throw new Error("Invalid email or password");
        }

        // matching password
        const isMatchedPassword = await bcrypt.compare(password, user.password);

        if (!isMatchedPassword) {
          throw new Error("Invalid email or password");
        }
        return {
          firstName: user.firstName,
          lastName: user.lastName,
          id: user.id,
          email: user.email,
        };
      },
    }),
    Google({
      clientId: GoogleClientId,
      clientSecret: GoogleClientSecret,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    },  
  ),
  ],
  session: {
    strategy: "jwt",
    maxAge: 1 * 24 * 60 * 60,
  },
  jwt: {},
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = {
          _id: user.id,
          email: user.email,
          name: user.name,
          image: user.image
        }
      }
      return token;
    },
    async session({ session, token }: {session: any, token: any}) {
      if (token && session.user) {
        session.user = token.user;
      }
      return session;
    },
    signIn: async ({ user, account, profile }) => {
      if (account?.provider === "google") {
        // console.log(profile)
        try {
          const userExists = await db.user.findUnique({
            where: {
              email: profile?.email as string,
            },
          });

          if (!userExists) {
            const newUser = await db.user.create({
              data: {
                email: profile?.email as string,
                firstName: profile?.given_name,
                lastName: profile?.family_name,
                imageUrl: profile?.picture,
              },
            });
            if (newUser) return true;
          }
          return true;
        } catch (err) {
          console.log(err);
          return false;
        }
        // user exists
        return true; // Allow Google sign-in
      }
      if (account?.provider === "credentials") {
        return true;
      }
      return false;
    },
  },
});

// {
//   iss: 'https://accounts.google.com',
//   azp: '582190175829-pjjhprbnqje44o7cieg01v12g9334eu8.apps.googleusercontent.com',
//   aud: '582190175829-pjjhprbnqje44o7cieg01v12g9334eu8.apps.googleusercontent.com',
//   sub: '108177614826807946421',
//   email: 'chauhananiket2004@gmail.com',
//   email_verified: true,
//   at_hash: 'fL_uIudzqU9ZiIt200pIzw',
//   name: 'Aniket Chauhan',
//   picture: 'https://lh3.googleusercontent.com/a/ACg8ocKeNIW1v5whmRy_lPX7Y8Q-a-sSC1XD8si7BlX4p8IOkOVet-kS=s96-c',
//   given_name: 'Aniket',
//   family_name: 'Chauhan',
//   iat: 1725798861,
//   exp: 1725802461
// }
