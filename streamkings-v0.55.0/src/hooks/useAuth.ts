import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { api } from '@/lib/api';

export function useAuth() {
  const { connected, publicKey } = useWallet();
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      if (!connected || !publicKey) {
        setIsNewUser(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(api.users.get(publicKey.toBase58()));
        setIsNewUser(response.ok ? false : true);
      } catch {
        setIsNewUser(true);
      }
      setIsLoading(false);
    };

    checkUser();
  }, [connected, publicKey]);

  return { isNewUser, isLoading, connected, publicKey, setIsNewUser };
}
