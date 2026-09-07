interface TwitterWidget {
  widgets: {
    createTweet(
      tweetId: string,
      element: HTMLElement | null,
      options?: {
        theme?: string;
        width?: number;
        conversation?: string;
        cards?: string;
      }
    ): Promise<any>;
  };
}

declare global {
  interface Window {
    twttr: TwitterWidget;
  }
}
