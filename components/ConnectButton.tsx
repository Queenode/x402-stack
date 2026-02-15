'use client';

import { useState, useEffect } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { useWalletStore } from '@/lib/store';
// Imports removed (dynamic import used inside handler)

interface ConnectButtonProps extends ButtonProps {
    label?: string;
    onConnect?: () => void;
}

export default function ConnectButton({ children, label = 'Connect Wallet', onConnect, className, ...props }: ConnectButtonProps & { children?: React.ReactNode }) {
    const { setWallet } = useWalletStore();
    const [loading, setLoading] = useState(false);

    const handleConnect = async () => { // Added async
        setLoading(true);
        try {
            const { showConnect, AppConfig, UserSession } = await import('@stacks/connect'); // Dynamic import inside handler for extra safety

            const appConfig = new AppConfig(['store_write', 'publish_data']);
            const userSession = new UserSession({ appConfig });

            showConnect({
                appDetails: {
                    name: 'PartyStacker',
                    icon: window.location.origin + '/placeholder-logo.svg',
                },
                redirectTo: '/',
                onFinish: () => {
                    const userData = userSession.loadUserData();
                    const stxAddress = userData.profile.stxAddress.testnet; // Default to testnet
                    setWallet(`stacks-connect-${stxAddress}`, stxAddress);
                    setLoading(false);
                    if (onConnect) onConnect();
                },
                onCancel: () => {
                    setLoading(false);
                },
                // create-react-app style env vars or just defaults
            });
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    };

    return (
        <Button
            onClick={handleConnect}
            disabled={loading}
            className={className}
            {...props}
        >
            <Wallet className="w-4 h-4 mr-2" />
            {loading ? 'Connecting...' : (children || label)}
        </Button>
    );
}
