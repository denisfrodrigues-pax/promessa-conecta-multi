import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logoPromessaHortolandia from "@/assets/logo-promessa-hortolandia.png";
import {
  Instagram,
  Youtube,
  Facebook,
  Menu,
  X,
  ChevronDown,
  User,
  Music2,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const socialLinks = [
  { icon: Instagram, href: "https://instagram.com/igrejadapromessa", label: "Instagram" },
  { icon: Youtube, href: "https://youtube.com/@igrejadapromessa", label: "YouTube" },
  { icon: Music2, href: "https://open.spotify.com/user/igrejadapromessa", label: "Spotify" },
  { icon: Facebook, href: "https://facebook.com/igrejadapromessa", label: "Facebook" },
];

export function InstitutionalHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 left-0 right-0 z-50">
      {/* Top Bar - Desktop only */}
      <div className="hidden lg:block bg-promessa-700 text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="flex flex-row items-center justify-between h-8">
            <div className="flex flex-row items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors duration-200"
                  aria-label={social.label}
                >
                  <social.icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-foreground/90 hover:text-primary-foreground hover:bg-white/10 gap-2 text-xs font-medium h-7 px-3"
              asChild
            >
              <Link to="/auth">
                <User className="w-3.5 h-3.5" />
                <span>Entrar</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white border-b border-border/50 shadow-sm shadow-black/5">
        <div className="container mx-auto px-4">
          <div className="flex flex-row items-center justify-between h-14 lg:h-16">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center flex-shrink-0"
            >
              <img
                src={logoPromessaHortolandia}
                alt="Promessa Hortolândia"
                className="h-10 lg:h-12 w-auto object-contain shrink-0"
              />
            </Link>

            {/* ========== DESKTOP NAVIGATION ========== */}
            <nav className="hidden lg:flex flex-row items-center gap-x-6">
              
              {/* Item 1: Quem somos - Com dropdown */}
              <div 
                className="relative"
                onMouseEnter={() => setOpenDropdown("Quem somos")}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button
                  className={cn(
                    "flex flex-row items-center gap-1 h-10 px-2 text-[13px] font-medium rounded-md transition-colors duration-200 whitespace-nowrap",
                    openDropdown === "Quem somos" 
                      ? "text-promessa-600 bg-muted" 
                      : "text-foreground hover:text-promessa-600 hover:bg-muted"
                  )}
                >
                  Quem somos
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", openDropdown === "Quem somos" && "rotate-180")} />
                </button>
                <div className={cn(
                  "absolute left-0 top-full pt-1 z-50 transition-all duration-200 ease-out",
                  openDropdown === "Quem somos" ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2 pointer-events-none"
                )}>
                  <ul className="min-w-[300px] bg-white border border-border rounded-lg shadow-lg shadow-black/10 py-2">
                    <li><Link to="/quem-somos/teologia" className="block px-4 py-2.5 text-sm text-foreground hover:text-promessa-600 hover:bg-muted/60 whitespace-nowrap">Nossa teologia</Link></li>
                    <li><Link to="/quem-somos/missao-visao" className="block px-4 py-2.5 text-sm text-foreground hover:text-promessa-600 hover:bg-muted/60 whitespace-nowrap">Missão e visão</Link></li>
                    <li><Link to="/quem-somos/historia" className="block px-4 py-2.5 text-sm text-foreground hover:text-promessa-600 hover:bg-muted/60 whitespace-nowrap">Nossa história</Link></li>
                    <li><Link to="/quem-somos/pastores" className="block px-4 py-2.5 text-sm text-foreground hover:text-promessa-600 hover:bg-muted/60 whitespace-nowrap">Pastores</Link></li>
                    <li><Link to="/quem-somos/lideranca" className="block px-4 py-2.5 text-sm text-foreground hover:text-promessa-600 hover:bg-muted/60 whitespace-nowrap">Liderança</Link></li>
                    <li><Link to="/quem-somos/ministerios" className="block px-4 py-2.5 text-sm text-foreground hover:text-promessa-600 hover:bg-muted/60 whitespace-nowrap">Ministérios</Link></li>
                    <li><Link to="/quem-somos/por-que-participar" className="block px-4 py-2.5 text-sm text-foreground hover:text-promessa-600 hover:bg-muted/60 whitespace-nowrap">Por que participar da Igreja da Promessa</Link></li>
                  </ul>
                </div>
              </div>

              {/* Item 2: Participe de uma base - Link direto */}
              <Link
                to="/bases"
                className="flex flex-row items-center h-10 px-2 text-[13px] font-medium text-foreground hover:text-promessa-600 hover:bg-muted rounded-md transition-colors duration-200 whitespace-nowrap"
              >
                Participe de uma base
              </Link>

              {/* Item 3: Conteúdo - Com dropdown */}
              <div 
                className="relative"
                onMouseEnter={() => setOpenDropdown("Conteúdo")}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button
                  className={cn(
                    "flex flex-row items-center gap-1 h-10 px-2 text-[13px] font-medium rounded-md transition-colors duration-200 whitespace-nowrap",
                    openDropdown === "Conteúdo" 
                      ? "text-promessa-600 bg-muted" 
                      : "text-foreground hover:text-promessa-600 hover:bg-muted"
                  )}
                >
                  Conteúdo
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", openDropdown === "Conteúdo" && "rotate-180")} />
                </button>
                <div className={cn(
                  "absolute left-0 top-full pt-1 z-50 transition-all duration-200 ease-out",
                  openDropdown === "Conteúdo" ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2 pointer-events-none"
                )}>
                  <ul className="min-w-[240px] bg-white border border-border rounded-lg shadow-lg shadow-black/10 py-2">
                    <li><Link to="/conteudo/series" className="block px-4 py-2.5 text-sm text-foreground hover:text-promessa-600 hover:bg-muted/60 whitespace-nowrap">Séries de mensagens</Link></li>
                    <li><Link to="/conteudo/leituras" className="block px-4 py-2.5 text-sm text-foreground hover:text-promessa-600 hover:bg-muted/60 whitespace-nowrap">Leituras</Link></li>
                  </ul>
                </div>
              </div>

              {/* Item 4: Participe - Com dropdown */}
              <div 
                className="relative"
                onMouseEnter={() => setOpenDropdown("Participe")}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button
                  className={cn(
                    "flex flex-row items-center gap-1 h-10 px-2 text-[13px] font-medium rounded-md transition-colors duration-200 whitespace-nowrap",
                    openDropdown === "Participe" 
                      ? "text-promessa-600 bg-muted" 
                      : "text-foreground hover:text-promessa-600 hover:bg-muted"
                  )}
                >
                  Participe
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", openDropdown === "Participe" && "rotate-180")} />
                </button>
                <div className={cn(
                  "absolute left-0 top-full pt-1 z-50 transition-all duration-200 ease-out",
                  openDropdown === "Participe" ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2 pointer-events-none"
                )}>
                  <ul className="min-w-[240px] bg-white border border-border rounded-lg shadow-lg shadow-black/10 py-2">
                    <li><Link to="/eventos" className="block px-4 py-2.5 text-sm text-foreground hover:text-promessa-600 hover:bg-muted/60 whitespace-nowrap">Eventos</Link></li>
                    <li><Link to="/oracao" className="block px-4 py-2.5 text-sm text-foreground hover:text-promessa-600 hover:bg-muted/60 whitespace-nowrap">Pedidos de oração</Link></li>
                  </ul>
                </div>
              </div>

              {/* Item 5: Contribua - Link direto, sem destaque especial */}
              <Link
                to="/contribuicoes"
                className="flex flex-row items-center h-10 px-2 text-[13px] font-medium text-foreground hover:text-promessa-600 hover:bg-muted rounded-md transition-colors duration-200 whitespace-nowrap"
              >
                Contribua
              </Link>

              {/* Item 6: Contato - Com dropdown */}
              <div 
                className="relative"
                onMouseEnter={() => setOpenDropdown("Contato")}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button
                  className={cn(
                    "flex flex-row items-center gap-1 h-10 px-2 text-[13px] font-medium rounded-md transition-colors duration-200 whitespace-nowrap",
                    openDropdown === "Contato" 
                      ? "text-promessa-600 bg-muted" 
                      : "text-foreground hover:text-promessa-600 hover:bg-muted"
                  )}
                >
                  Contato
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", openDropdown === "Contato" && "rotate-180")} />
                </button>
                <div className={cn(
                  "absolute left-0 top-full pt-1 z-50 transition-all duration-200 ease-out",
                  openDropdown === "Contato" ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2 pointer-events-none"
                )}>
                  <ul className="min-w-[240px] bg-white border border-border rounded-lg shadow-lg shadow-black/10 py-2">
                    <li><Link to="/contato/fale-conosco" className="block px-4 py-2.5 text-sm text-foreground hover:text-promessa-600 hover:bg-muted/60 whitespace-nowrap">Fale conosco</Link></li>
                    <li><Link to="/contato/onde-estamos" className="block px-4 py-2.5 text-sm text-foreground hover:text-promessa-600 hover:bg-muted/60 whitespace-nowrap">Onde estamos</Link></li>
                  </ul>
                </div>
              </div>

              {/* Item 7: Cadastro - Com dropdown */}
              <div 
                className="relative"
                onMouseEnter={() => setOpenDropdown("Cadastro")}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button
                  className={cn(
                    "flex flex-row items-center gap-1 h-10 px-2 text-[13px] font-medium rounded-md transition-colors duration-200 whitespace-nowrap",
                    openDropdown === "Cadastro" 
                      ? "text-promessa-600 bg-muted" 
                      : "text-foreground hover:text-promessa-600 hover:bg-muted"
                  )}
                >
                  Cadastro
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", openDropdown === "Cadastro" && "rotate-180")} />
                </button>
                <div className={cn(
                  "absolute left-0 top-full pt-1 z-50 transition-all duration-200 ease-out",
                  openDropdown === "Cadastro" ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2 pointer-events-none"
                )}>
                  <ul className="min-w-[240px] bg-white border border-border rounded-lg shadow-lg shadow-black/10 py-2">
                    <li><Link to="/sou-novo?tipo=membro" className="block px-4 py-2.5 text-sm text-foreground hover:text-promessa-600 hover:bg-muted/60 whitespace-nowrap">Membros</Link></li>
                    <li><Link to="/sou-novo?tipo=visitante" className="block px-4 py-2.5 text-sm text-foreground hover:text-promessa-600 hover:bg-muted/60 whitespace-nowrap">Visitantes</Link></li>
                    <li><Link to="/sou-novo?tipo=infantil" className="block px-4 py-2.5 text-sm text-foreground hover:text-promessa-600 hover:bg-muted/60 whitespace-nowrap">Cadastro infantil</Link></li>
                  </ul>
                </div>
              </div>

            </nav>
            {/* ========== FIM DESKTOP NAVIGATION ========== */}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors duration-200"
              aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-foreground" />
              ) : (
                <Menu className="w-6 h-6 text-foreground" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div 
        className={cn(
          "lg:hidden fixed inset-0 top-14 bg-black/40 z-40 transition-opacity duration-300",
          mobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        )}
        onClick={closeMobileMenu}
      />

      {/* ========== MOBILE NAVIGATION DRAWER ========== */}
      <div 
        className={cn(
          "lg:hidden fixed top-14 left-0 right-0 bottom-0 w-full bg-white z-50 transform transition-transform duration-300 ease-out",
          mobileMenuOpen ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <nav className="h-full w-full overflow-y-auto py-2">
          <Accordion type="single" collapsible className="w-full">
            
            {/* Mobile: Quem somos */}
            <AccordionItem value="Quem somos" className="border-b border-border/40">
              <AccordionTrigger className="px-5 py-4 text-base font-semibold text-foreground hover:text-promessa-600 hover:no-underline">
                Quem somos
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <ul className="ml-5 pl-4 border-l-2 border-promessa-200 space-y-1">
                  <li><Link to="/quem-somos/teologia" onClick={closeMobileMenu} className="block py-3 px-4 text-[15px] text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-md">Nossa teologia</Link></li>
                  <li><Link to="/quem-somos/missao-visao" onClick={closeMobileMenu} className="block py-3 px-4 text-[15px] text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-md">Missão e visão</Link></li>
                  <li><Link to="/quem-somos/historia" onClick={closeMobileMenu} className="block py-3 px-4 text-[15px] text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-md">Nossa história</Link></li>
                  <li><Link to="/quem-somos/pastores" onClick={closeMobileMenu} className="block py-3 px-4 text-[15px] text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-md">Pastores</Link></li>
                  <li><Link to="/quem-somos/lideranca" onClick={closeMobileMenu} className="block py-3 px-4 text-[15px] text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-md">Liderança</Link></li>
                  <li><Link to="/quem-somos/ministerios" onClick={closeMobileMenu} className="block py-3 px-4 text-[15px] text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-md">Ministérios</Link></li>
                  <li><Link to="/quem-somos/por-que-participar" onClick={closeMobileMenu} className="block py-3 px-4 text-[15px] text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-md">Por que participar da Igreja da Promessa</Link></li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Mobile: Participe de uma base - Link direto */}
            <div className="border-b border-border/40">
              <Link to="/bases" onClick={closeMobileMenu} className="block px-5 py-4 text-base font-semibold text-foreground hover:text-promessa-600">
                Participe de uma base
              </Link>
            </div>

            {/* Mobile: Conteúdo */}
            <AccordionItem value="Conteúdo" className="border-b border-border/40">
              <AccordionTrigger className="px-5 py-4 text-base font-semibold text-foreground hover:text-promessa-600 hover:no-underline">
                Conteúdo
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <ul className="ml-5 pl-4 border-l-2 border-promessa-200 space-y-1">
                  <li><Link to="/conteudo/series" onClick={closeMobileMenu} className="block py-3 px-4 text-[15px] text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-md">Séries de mensagens</Link></li>
                  <li><Link to="/conteudo/leituras" onClick={closeMobileMenu} className="block py-3 px-4 text-[15px] text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-md">Leituras</Link></li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Mobile: Participe */}
            <AccordionItem value="Participe" className="border-b border-border/40">
              <AccordionTrigger className="px-5 py-4 text-base font-semibold text-foreground hover:text-promessa-600 hover:no-underline">
                Participe
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <ul className="ml-5 pl-4 border-l-2 border-promessa-200 space-y-1">
                  <li><Link to="/eventos" onClick={closeMobileMenu} className="block py-3 px-4 text-[15px] text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-md">Eventos</Link></li>
                  <li><Link to="/oracao" onClick={closeMobileMenu} className="block py-3 px-4 text-[15px] text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-md">Pedidos de oração</Link></li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Mobile: Contribua - Link direto */}
            <div className="border-b border-border/40">
              <Link to="/contribuicoes" onClick={closeMobileMenu} className="block px-5 py-4 text-base font-semibold text-foreground hover:text-promessa-600">
                Contribua
              </Link>
            </div>

            {/* Mobile: Contato */}
            <AccordionItem value="Contato" className="border-b border-border/40">
              <AccordionTrigger className="px-5 py-4 text-base font-semibold text-foreground hover:text-promessa-600 hover:no-underline">
                Contato
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <ul className="ml-5 pl-4 border-l-2 border-promessa-200 space-y-1">
                  <li><Link to="/contato/fale-conosco" onClick={closeMobileMenu} className="block py-3 px-4 text-[15px] text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-md">Fale conosco</Link></li>
                  <li><Link to="/contato/onde-estamos" onClick={closeMobileMenu} className="block py-3 px-4 text-[15px] text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-md">Onde estamos</Link></li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Mobile: Cadastro */}
            <AccordionItem value="Cadastro" className="border-b border-border/40">
              <AccordionTrigger className="px-5 py-4 text-base font-semibold text-foreground hover:text-promessa-600 hover:no-underline">
                Cadastro
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <ul className="ml-5 pl-4 border-l-2 border-promessa-200 space-y-1">
                  <li><Link to="/sou-novo?tipo=membro" onClick={closeMobileMenu} className="block py-3 px-4 text-[15px] text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-md">Membros</Link></li>
                  <li><Link to="/sou-novo?tipo=visitante" onClick={closeMobileMenu} className="block py-3 px-4 text-[15px] text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-md">Visitantes</Link></li>
                  <li><Link to="/sou-novo?tipo=infantil" onClick={closeMobileMenu} className="block py-3 px-4 text-[15px] text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-md">Cadastro infantil</Link></li>
                </ul>
              </AccordionContent>
            </AccordionItem>

          </Accordion>

          {/* Mobile Login Button */}
          <div className="px-5 mt-6">
            <Button className="w-full bg-promessa-700 hover:bg-promessa-800 text-primary-foreground h-12 text-base font-medium" asChild>
              <Link to="/auth" onClick={closeMobileMenu}>
                <User className="w-4 h-4 mr-2" />
                Entrar ou cadastrar
              </Link>
            </Button>
          </div>

          {/* Mobile Social Links */}
          <div className="px-5 mt-8 pt-6 border-t border-border/40">
            <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider font-medium">Siga-nos</p>
            <div className="flex flex-row items-center gap-5">
              {socialLinks.map((social) => (
                <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-promessa-600 transition-colors duration-200" aria-label={social.label}>
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </nav>
      </div>
      {/* ========== FIM MOBILE NAVIGATION DRAWER ========== */}
    </header>
  );
}
