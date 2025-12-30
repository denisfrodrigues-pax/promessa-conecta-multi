import { useState } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
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

// Menu structure following Igreja Plena model - Title Case
const menuItems = [
  {
    label: "Quem Somos",
    href: "#quem-somos",
    subItems: [
      { label: "Nossa Teologia", href: "#teologia" },
      { label: "Missão e Visão", href: "#missao-visao" },
      { label: "Nossa História", href: "#historia" },
      { label: "Pastores", href: "#pastores" },
      { label: "Liderança", href: "#lideranca" },
      { label: "Por que Participar da Igreja da Promessa?", href: "#porque-participar" },
    ],
  },
  {
    label: "Ministérios",
    href: "#ministerios",
    subItems: [
      { label: "Kids", href: "#kids" },
      { label: "Conectores", href: "#conectores" },
      { label: "Mídia e Comunicação", href: "#midia" },
      { label: "Música", href: "#musica" },
      { label: "Educação", href: "#educacao" },
      { label: "Bases", href: "/bases" },
    ],
  },
  {
    label: "Cadastro",
    href: "#cadastro",
    subItems: [
      { label: "Seja um Voluntário!", href: "/sou-novo" },
      { label: "Membros", href: "/sou-novo" },
      { label: "Visitantes", href: "/sou-novo" },
      { label: "Cadastro Infantil", href: "/sou-novo" },
    ],
  },
  {
    label: "Participe de uma Base",
    href: "/bases",
    subItems: null,
  },
  {
    label: "Conteúdo",
    href: "#conteudo",
    subItems: [
      { label: "Séries de Mensagens", href: "#series" },
      { label: "Leituras", href: "#leituras" },
    ],
  },
  {
    label: "Participe",
    href: "#participe",
    subItems: [
      { label: "Eventos", href: "/eventos" },
      { label: "Pedidos de Oração", href: "/oracao" },
    ],
  },
  {
    label: "Contribua",
    href: "/contribuicoes",
    subItems: null,
  },
  {
    label: "Contato",
    href: "#contato",
    subItems: [
      { label: "Fale Conosco", href: "#fale-conosco" },
      { label: "Onde Nos Encontrar", href: "#localizacao" },
    ],
  },
];

const socialLinks = [
  { icon: Instagram, href: "https://instagram.com/igrejadapromessa", label: "Instagram" },
  { icon: Youtube, href: "https://youtube.com/@igrejadapromessa", label: "YouTube" },
  { icon: Music2, href: "https://open.spotify.com/user/igrejadapromessa", label: "Spotify" },
  { icon: Facebook, href: "https://facebook.com/igrejadapromessa", label: "Facebook" },
];

// Desktop Dropdown Item Component
function DesktopNavItem({ item }: { item: typeof menuItems[0] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!item.subItems) {
    return (
      <Link
        to={item.href}
        className="inline-flex items-center px-3 py-2 text-[13px] font-medium text-foreground hover:text-promessa-600 hover:bg-muted rounded-md transition-colors duration-200 whitespace-nowrap"
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        className={cn(
          "inline-flex items-center gap-1 px-3 py-2 text-[13px] font-medium rounded-md transition-colors duration-200 whitespace-nowrap",
          isOpen 
            ? "text-promessa-600 bg-muted" 
            : "text-foreground hover:text-promessa-600 hover:bg-muted"
        )}
      >
        {item.label}
        <ChevronDown 
          className={cn(
            "w-3.5 h-3.5 transition-transform duration-200",
            isOpen && "rotate-180"
          )} 
        />
      </button>

      {/* Dropdown */}
      <div
        className={cn(
          "absolute left-0 top-full pt-1 z-50 transition-all duration-200",
          isOpen 
            ? "opacity-100 visible translate-y-0" 
            : "opacity-0 invisible -translate-y-1"
        )}
      >
        <ul className="min-w-[220px] bg-white border border-border/80 rounded-lg shadow-lg shadow-black/10 py-2">
          {item.subItems.map((subItem) => (
            <li key={subItem.label}>
              <Link
                to={subItem.href}
                className="block px-4 py-2.5 text-sm text-foreground hover:text-promessa-600 hover:bg-muted/60 transition-colors duration-150 whitespace-nowrap"
              >
                {subItem.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function InstitutionalHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Top Bar - Desktop only */}
      <div className="hidden lg:block bg-promessa-700 text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-8">
            {/* Social Icons */}
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

            {/* Login Button */}
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
              className="flex flex-row items-center gap-2.5 group flex-shrink-0"
            >
              <Logo size={38} />
              <div className="hidden sm:block">
                <p className="font-display font-semibold text-foreground text-sm leading-tight group-hover:text-promessa-600 transition-colors duration-200">
                  Igreja da Promessa
                </p>
                <p className="text-muted-foreground text-[10px]">
                  Hortolândia
                </p>
              </div>
            </Link>

            {/* Desktop Navigation - Explicit horizontal layout */}
            <nav className="hidden lg:flex flex-row items-center gap-x-1">
              {menuItems.map((item) => (
                <DesktopNavItem key={item.label} item={item} />
              ))}
            </nav>

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
          mobileMenuOpen 
            ? "opacity-100 visible" 
            : "opacity-0 invisible pointer-events-none"
        )}
        onClick={closeMobileMenu}
      />

      {/* Mobile Navigation Drawer - Full width */}
      <div 
        className={cn(
          "lg:hidden fixed top-14 left-0 right-0 bottom-0 w-full bg-white z-50 transform transition-transform duration-300 ease-out overflow-hidden",
          mobileMenuOpen ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <nav className="h-full overflow-y-auto py-2">
          <Accordion type="single" collapsible className="w-full">
            {menuItems.map((item) => (
              item.subItems ? (
                <AccordionItem 
                  key={item.label} 
                  value={item.label}
                  className="border-b border-border/40 px-4"
                >
                  <AccordionTrigger 
                    className="py-4 text-base font-medium text-foreground hover:text-promessa-600 hover:no-underline [&[data-state=open]]:text-promessa-600"
                  >
                    {item.label}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <ul className="space-y-0.5 ml-3 pl-4 border-l-2 border-promessa-200">
                      {item.subItems.map((subItem) => (
                        <li key={subItem.label}>
                          <Link
                            to={subItem.href}
                            onClick={closeMobileMenu}
                            className="block py-3 px-3 text-[15px] text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-md transition-colors duration-200"
                          >
                            {subItem.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ) : (
                <div key={item.label} className="border-b border-border/40 px-4">
                  <Link
                    to={item.href}
                    onClick={closeMobileMenu}
                    className="block py-4 text-base font-medium text-foreground hover:text-promessa-600 transition-colors duration-200"
                  >
                    {item.label}
                  </Link>
                </div>
              )
            ))}
          </Accordion>

          {/* Mobile Login Button */}
          <div className="px-4 mt-6">
            <Button
              className="w-full bg-promessa-700 hover:bg-promessa-800 text-primary-foreground h-12 text-base"
              asChild
            >
              <Link to="/auth" onClick={closeMobileMenu}>
                <User className="w-4 h-4 mr-2" />
                Entrar ou Cadastrar
              </Link>
            </Button>
          </div>

          {/* Mobile Social Links */}
          <div className="px-4 mt-8 pt-6 border-t border-border/40">
            <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wide">Siga-nos</p>
            <div className="flex flex-row items-center gap-5">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-promessa-600 transition-colors duration-200"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
