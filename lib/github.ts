import { encryptToken, decryptToken } from "./crypto";
import { prisma } from "./prisma";

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  email: string | null;
}

interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  error?: string;
  error_description?: string;
}

/**
 * Exchanges GitHub OAuth2 authorization code for Access Token
 * Official Docs: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
 */
export async function exchangeGitHubAuthCode(
  code: string,
  redirectUri: string
): Promise<{
  accessToken: string;
  gitHubUser: GitHubUser;
}> {
  const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing GitHub OAuth credentials in environment variables");
  }

  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  const tokenData = (await res.json()) as GitHubTokenResponse;

  if (!res.ok || tokenData.error) {
    throw new Error(
      `GitHub OAuth exchange failed: ${tokenData.error_description || tokenData.error}`
    );
  }

  // Fetch GitHub User Profile
  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      "User-Agent": "LiveHub-Creator-Platform",
      Accept: "application/vnd.github+json",
    },
  });

  if (!userRes.ok) {
    throw new Error("Failed to fetch GitHub user profile");
  }

  const gitHubUser = (await userRes.json()) as GitHubUser;

  // If email is private on GitHub profile, fetch from /user/emails
  if (!gitHubUser.email) {
    try {
      const emailRes = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          "User-Agent": "LiveHub-Creator-Platform",
        },
      });
      if (emailRes.ok) {
        const emails = (await emailRes.json()) as Array<{
          email: string;
          primary: boolean;
          verified: boolean;
        }>;
        const primary = emails.find((e) => e.primary && e.verified) || emails[0];
        if (primary) gitHubUser.email = primary.email;
      }
    } catch {
      // Fallback email
    }
  }

  return {
    accessToken: tokenData.access_token,
    gitHubUser,
  };
}
