import { Agent } from "../account/account.type";
import { frameNonSensitiveUserInfo } from "../account/account.utils";
import { generateUserToken, validateToken } from "./auth.utils";
import { IUserProfileInfo } from "@nucleum/schema/account/profile.type";

export async function authorize(props: { token: string; host?: string }) {
  try {
    //TODO - additional security checks
    const key = process.env.TOKEN_PRIVATE_KEY;
    if (!props.token) return false;
    if (key) {
      const decoded = await validateToken(props);
      if (decoded) return decoded;
    }
    return authorizeAuthFnSession(props);
  } catch (err) {
    console.log(err);
    return false;
  }
}

async function authorizeAuthFnSession(props: {
  token: string;
  host?: string;
}): Promise<Agent | false> {
  const accountUrl = resolveAccountServiceUrl();
  if (!accountUrl) return false;
  const response = await fetch(`${accountUrl.replace(/\/$/, "")}/auth/session`, {
    headers: {
      Authorization: `Bearer ${props.token}`,
      ...(props.host ? { "x-nucleus-host": props.host } : {})
    }
  });
  if (!response.ok) return false;
  const envelope = await response.json();
  const session = envelope?.ok ? envelope.data?.session : null;
  if (!session?.actorId) return false;
  const actorId = String(session.actorId);
  const userId = actorId.startsWith("user:") ? actorId.split("user:")[1] : actorId;
  const region = session.regionId ?? session.subject?.regionId ?? "global";
  return {
    id: userId,
    context: "USER",
    db: userId,
    region,
    scope: "authfn",
    ns: process.env.USER_NS,
    tk: "authfn",
    iss: accountUrl
  };
}

function resolveAccountServiceUrl() {
  return (
    process.env.AUTHFN_ACCOUNT_URL ??
    process.env.ACCOUNT_SERVICE_URL ??
    process.env.NUCLEUS_ACCOUNT_URL
  );
}

export async function generateToken(
  userId: string,
  userInfo: IUserProfileInfo,
  params: { isTrusted?: boolean; isSignup?: boolean; host?: string } = {
    isTrusted: false,
    isSignup: false,
    host: "blank"
  }
) {
  const nonSensitiveUserInfo = frameNonSensitiveUserInfo(userInfo);
  const tokenExpiration = params.isTrusted ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
  const isUseThirdPartyAuthMethod = process.env.USE_THIRDPARTY_AUTH_METHOD;
  if (isUseThirdPartyAuthMethod == "true") {
    const token = await generateUserToken({
      id: userId,
      region: userInfo.region,
      expiration: tokenExpiration,
      host: params.host
    });
    return {
      userInfo: nonSensitiveUserInfo,
      token,
      isSignup: params.isSignup ?? false
    };
  } else {
    let token;
    // if (params.isSignup) {
    //   token = await signupSystemUser(userId, userInfo.passhash);
    // } else {
    //   token = await signinSystemUser(userId, userInfo.passhash);
    // }
    return {
      userInfo: nonSensitiveUserInfo,
      token,
      isSignup: params.isSignup ?? false
    };
  }
}
