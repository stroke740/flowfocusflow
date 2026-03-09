import { useState } from 'react';
import { Wallet, ChevronDown, Copy, LogOut, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useWallet } from './WalletProvider';
import { toast } from 'sonner';

export function WalletButton() {
  const { connected, connecting, account, balance, connect, disconnect, refreshBalance } = useWallet();
  const [open, setOpen] = useState(false);

  const handleConnect = async () => {
    try {
      await connect();
      toast.success('Wallet connected');
    } catch (error) {
      toast.error('Failed to connect wallet');
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    setOpen(false);
    toast.success('Wallet disconnected');
  };

  const copyAddress = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address);
      toast.success('Address copied');
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (!connected) {
    return (
      <Button 
        onClick={handleConnect} 
        disabled={connecting}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Wallet className="h-4 w-4" />
        {connecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Wallet className="h-4 w-4" />
          {truncateAddress(account?.address || '')}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Solana Wallet
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Account Info */}
          <div className="rounded-lg bg-muted p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Address</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono">
                  {truncateAddress(account?.address || '')}
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyAddress}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            
            {account?.label && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Label</span>
                <span className="text-sm">{account.label}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Balance</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  {balance !== null ? `${balance.toFixed(4)} SOL` : 'Loading...'}
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={refreshBalance}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Network</span>
              <span className="text-sm text-amber-500 font-medium">Devnet</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => {
                if (account?.address) {
                  window.open(`https://explorer.solana.com/address/${account.address}`, '_blank');
                }
              }}
            >
              <ExternalLink className="h-4 w-4" />
              View on Explorer
            </Button>
            
            <Button
              variant="destructive"
              className="justify-start gap-2"
              onClick={handleDisconnect}
            >
              <LogOut className="h-4 w-4" />
              Disconnect
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
