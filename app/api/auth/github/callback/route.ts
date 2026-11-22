import { NextRequest, NextResponse } from "next/server";
import { exchangeGitHubAuthCode } from "@/lib/github";
import { encryptToken } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(
      `${appUrl}/auth/login?error=${encodeURIComponent(
        errorDescription || error
      )}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${appUrl}/auth/login?error=Missing_github_authorization_code`
    );
  }

  try {
    const redirectUri =
      process.env.NEXT_PUBLIC_GITHUB_REDIRECT_URI ||
      `${appUrl}/api/auth/github/callback`;

    // 1. Exchange code for GitHub access token & user profile
    const authResult = await exchangeGitHubAuthCode(code, redirectUri);
    const { gitHubUser } = authResult;

    const accessTokenEncrypted = encryptToken(authResult.accessToken);
    const email =
      gitHubUser.email || `${gitHubUser.id}@github.livehub.me`;
    const username = gitHubUser.login.toLowerCase().replace(/[^a-z0-9_]/g, "_");
    const displayName = gitHubUser.name || gitHubUser.login;

    // 2. Find or create User and BioProfile
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          username: `${username}_${Math.floor(100 + Math.random() * 900)}`,
          role: "CREATOR",
          profile: {
            create: {
              displayName,
              avatarUrl: gitHubUser.avatar_url,
              bio: gitHubUser.bio || `Developer & Creator • ${gitHubUser.public_repos} repos on GitHub`,
              accentColor: "#24292e", // GitHub Dark
            },
          },
        },
      });
    }

    // 3. Upsert OAuthConnection
    await prisma.oAuthConnection.upsert({
      where: {
        userId_provider: {
          userId: user.id,
          provider: "GITHUB",
        },
      },
      update: {
        providerAccountId: gitHubUser.id.toString(),
        accessTokenEncrypted,
        scope: "read:user user:email",
      },
      create: {
        userId: user.id,
        provider: "GITHUB",
        providerAccountId: gitHubUser.id.toString(),
        accessTokenEncrypted,
        scope: "read:user user:email",
      },
    });

    const response = NextResponse.redirect(
      `${appUrl}/dashboard/editor?connected=github&username=${encodeURIComponent(
        user.username
      )}`
    );

    response.cookies.set("livehub_user_id", user.id, {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err: any) {
    console.error("[GitHub OAuth Callback Error]:", err);
    return NextResponse.redirect(
      `${appUrl}/auth/login?error=${encodeURIComponent(
        err.message || "Failed to authenticate with GitHub"
      )}`
    );
  }
}
