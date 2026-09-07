/**
 * Web URLs that only support screen shots. Options like save page, text highlighter, summarize will all be disabled for these pages.
 */
export const screenShotOnlyPages = [
  /^https:\/\/app\.[^\/]+\/.*/,
  /^https:\/\/(?:twitter\.com|x\.com)\/(?:(i|jobs|explore|home|settings|messages|notifications|search|hashtag|compose)(?:\/(.+))?|([^\/]+)\/lists)?\/?$/,
  /^https:\/\/bsky\.app\/?$/,
  /^https:\/\/www\.linkedin\.com\/feed\/?$/,
  /^https:\/\/www\.linkedin\.com\/mynetwork\/?$/,
  /^https:\/\/www\.linkedin\.com\/jobs\/?$/,
  /^https:\/\/www\.threads\.com\/?$/
];

/**
 * Web URLs that only support saving page and screenshot. Options like text highlighter, summarize will be disabled for these pages.
 */
export const saveOnlyPages = [
  /^https?:\/\/(?:www\.|)?figma\.com\/(?:design|files)\/.+/,
  /^https?:\/\/(?:www\.)?(youtube\.com|youtu\.be)\/.*/
];

/**
 * @deprecated - use commonMetadata instead
 */
export const minimalMetadataPages = [
  "wikipedia.org",
  "youtube.com",
  "facebook.com",
  "instagram.com",
  "twitter.com",
  "reddit.com",
  "pinterest.com",
  "tiktok.com",
  "linkedin.com",
  "medium.com",
  "github.com",
  "stackoverflow.com",
  "google.com",
  "amazon.com",
  "apple.com",
  "microsoft.com",
  "ebay.com",
  "tumblr.com",
  "wordpress.com",
  "discord.com",
  "twitch.tv",
  "patreon.com",
  "soundcloud.com"
];


export const memotronUrlsList = [
  /^https:\/\/(?:.*\.)?memotron\.io(?:\/.*)?$/,
  /^https:\/\/(?:.*\.)?memotron\.app(?:\/.*)?$/,
  /^https:\/\/(?:.*\.)?tidigit\.dev(?:\/.*)?$/
];
export const unavailableUrlsList = [
  /^https:\/\/app\.memotron\.io(?:\/.*)?$/,
  /^https:\/\/web\.memotron\.app(?:\/.*)?$/,
  /^https:\/\/pre\.memotron\.app(?:\/.*)?$/,
  /^https:\/\/dev\.memotron\.app(?:\/.*)?$/,
  /^https:\/\/memotron\.tidigit\.dev(?:\/.*)?$/,
  /^https:\/\/pointron\.tidigit\.dev(?:\/.*)?$/,
  /^https?:\/\/localhost(?::[0-9]+)?(?:\/.*)?$/,
  /^https:\/\/accounts\.google\.com(?:\/.*)?$/,
  /^https:\/\/appleid\.apple\.com(?:\/.*)?$/
 
];

export const blankUrls = [
  /^chrome:\/\/newtab\//,
  /^about:newtab$/,
  /^about:blank$/
];

export const sidePanelUnavailableUrlsList = [
  ...unavailableUrlsList,
  ...blankUrls,
  /^https:\/\/(?:www\.)?(twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/status\/(\d+)\/?$/,
  /^https:\/\/(?:.*\.)?amazon\.[a-z]{2,3}(?:\/.*)?$/,
  /^https:\/\/(?:.*\.)?twitter\.[a-z]{2,3}(?:\/.*)?$/,
  /^https:\/\/(?:.*\.)?x\.[a-z]{2,3}(?:\/.*)?$/,
  /^https:\/\/(?:.*\.)?bsky\.app(?:\/.*)?$/,
  /^https:\/\/(?:.*\.)?threads\.[a-z]{2,3}(?:\/.*)?$/,
  /^https:\/\/(?:.*\.)?linkedin\.[a-z]{2,3}(?:\/.*)?$/,
  /^https:\/\/(?:.*\.)?instagram\.[a-z]{2,3}(?:\/.*)?$/,
  /^https:\/\/(?:.*\.)?facebook\.[a-z]{2,3}(?:\/.*)?$/,
  /^https:\/\/(?:.*\.)?reddit\.[a-z]{2,3}(?:\/.*)?$/
]

export const toolbarUnavailableUrlsList = [
  ...unavailableUrlsList,
]