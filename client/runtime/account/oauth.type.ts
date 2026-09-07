export enum IdentityProvider {
  Domain = "domain",
  Email = "email",
  Phone = "phone",
  RealHuman = "realhuman",
  Google = "google.com",
  Apple = "apple.com",
  Github = "github.com",
  Dribbble = "dribbble.com",
  Stackoverflow = "stackoverflow.com",
  Linkedin = "linkedin.com",
  GenericLink = "generic-link",
  Twitter = "twitter.com",
  Facebook = "facebook.com",
  Instagram = "instagram.com",
  Youtube = "youtube.com",
  Twitch = "twitch.com",
  Reddit = "reddit.com",
  Medium = "medium.com",
  Devto = "devto",
  Hashnode = "hashnode",
  Producthunt = "producthunt.com",
  Behance = "behance.net",
  Gitlab = "gitlab.com",
  Bitbucket = "bitbucket.org",
  Codepen = "codepen",
  Kaggle = "kaggle.com",
  Kaggle2 = "kaggle2",
  FiveHundredPx = "500px.com",
  Spotify = "open.spotify.com",
  SoundCloud = "soundcloud.com",
  Substack = "substack.com",
  Unknown = "unknown"
}

export type OAuthProviderConfig = {
  provider: IdentityProvider;
  client_id: string;
  scope: string;
  authorise_url: string;
  oauth_slug: string;
  token_url?: string;
  userdata_url?: string;
  accept_format?: string;
  authority?: string;
  response_type?: string;
  response_mode?: "form_post" | "query";
  code_challenge_method?: "plain" | "S256";
  isRedirectToClient?: boolean;
  isUseAuthClient?: boolean;
};
