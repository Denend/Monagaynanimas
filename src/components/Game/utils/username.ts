export const MONAD_ID_PROVIDER_ID = 'cmd8euall0037le0my79qpz42';

export const getMonadIdWallet = (user: any): string | undefined => {
  const crossApp = user?.linkedAccounts?.find((acc: any) => acc?.type === 'cross_app' && acc?.providerApp?.id === MONAD_ID_PROVIDER_ID);
  return crossApp?.embeddedWallets?.[0]?.address;
};

export const checkUsername = async (walletAddress: string) => {
  const resp = await fetch(`https://monad-games-id-site.vercel.app/api/check-wallet?wallet=${walletAddress}`);
  return resp.json();
};


