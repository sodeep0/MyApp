type BackCapableRouter = {
  canGoBack: () => boolean;
  back: () => void;
  replace: (href: any) => void;
};

export function safeBack(router: BackCapableRouter, fallbackHref: string) {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallbackHref as any);
}
