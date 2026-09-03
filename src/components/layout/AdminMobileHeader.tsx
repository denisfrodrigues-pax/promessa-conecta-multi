import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ChurchLogo } from '@/components/ChurchLogo';
import { useIgrejaConfig } from '@/hooks/useIgrejaConfig';
import AdminSidebar from './AdminSidebar';

/** Topbar + hamburger/Sheet drawer shown only below the md breakpoint, so the
 * fixed AdminSidebar (desktop-only, see AdminLayout) doesn't have to fight
 * for space on a phone screen. */
export default function AdminMobileHeader() {
  const [open, setOpen] = useState(false);
  const { config } = useIgrejaConfig();
  const hasCustomLogo = config?.logo_url && !config.logo_url.includes('placeholder');
  const churchName = config?.nome || 'Igreja';

  return (
    <header className="md:hidden sticky top-0 z-40 flex items-center gap-3 h-14 px-4 bg-white border-b border-gray-100">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Abrir menu">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[85vw] max-w-xs p-0">
          <SheetTitle className="sr-only">Menu administrativo</SheetTitle>
          <AdminSidebar variant="mobile" onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      {hasCustomLogo ? (
        <img src={config.logo_url!} alt={churchName} className="h-8 max-w-[110px] object-contain rounded" />
      ) : (
        <ChurchLogo size={28} />
      )}
      <span className="text-sm font-semibold text-gray-800 truncate">{churchName}</span>
    </header>
  );
}
