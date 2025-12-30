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
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

// Menu structure with submenus
const menuItems = [
  {
    label: "QUEM SOMOS",
    href: "#quem-somos",
    subItems: [
      { label: "Teologia", href: "#teologia" },
      { label: "Valores", href: "#valores" },
      { label: "História", href: "#historia" },
      { label: "Pastores", href: "#pastores" },
      { label: "Liderança", href: "#lideranca" },
      { label: "Por que participar da Igreja da Promessa Hortolândia?", href: "#por-que-participar" },
      { label: "Nosso discipulado", href: "#discipulado" },
    ],
  },
  {
    label: "MINISTÉRIOS",
    href: "#ministerios",
    subItems: [
      { label: "Kids", href: "#kids" },
      { label: "Conecta", href: "#conecta" },
      { label: "Mídia e Comunicação", href: "#midia" },
      { label: "Música", href: "#musica" },
      { label: "Educação", href: "#educacao" },
      { label: "Bases", href: "#bases" },
    ],
  },
  {
    label: "CADASTROS",
    href: "#cadastros",
    subItems: [
      { label: "Seja um voluntário!", href: "#voluntario" },
      { label: "Membros e visitantes", href: "/sou-novo" },
      { label: "Cadastro infantil", href: "#cadastro-infantil" },
    ],
  },
  {
    label: "Participe de uma Base",
    href: "/bases",
    subItems: null,
  },
  {
    label: "CONTEÚDO",
    href: "#conteudo",
    subItems: [
      { label: "Séries de Mensagens", href: "#series" },
      { label: "Leituras", href: "#leituras" },
      { label: "Downloads", href: "#downloads" },
    ],
  },
  {
    label: "PARTICIPE",
    href: "#participe",
    subItems: [
      { label: "Eventos", href: "/eventos" },
      { label: "Oração", href: "/oracao" },
    ],
  },
  {
    label: "CONTRIBUA",
    href: "#contribua",
    subItems: null,
  },
  {
    label: "CONTATO",
    href: "#contato",
    subItems: [
      { label: "Fale conosco", href: "#fale-conosco" },
      { label: "Onde nos encontrar", href: "#localizacao" },
    ],
  },
];

const socialLinks = [
  { icon: Instagram, href: "https://instagram.com/igrejadapromessa", label: "Instagram" },
  { icon: Youtube, href: "https://youtube.com/@igrejadapromessa", label: "YouTube" },
  { icon: Music2, href: "https://open.spotify.com/user/igrejadapromessa", label: "Spotify" },
  { icon: Facebook, href: "https://facebook.com/igrejadapromessa", label: "Facebook" },
];

export function InstitutionalHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMobileItem, setExpandedMobileItem] = useState<string | null>(null);

  const toggleMobileSubmenu = (label: string) => {
    setExpandedMobileItem(expandedMobileItem === label ? null : label);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Top Bar */}
      <div className="bg-promessa-700 text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-10">
            {/* Social Icons */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>

            {/* Login Button */}
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-foreground hover:bg-primary-foreground/10 gap-2 text-sm font-medium"
              asChild
            >
              <Link to="/auth">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Fazer login ou se inscrever</span>
                <span className="sm:hidden">Entrar</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-card border-b border-border shadow-soft">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo and Church Name */}
            <Link to="/" className="flex items-center gap-3">
              <Logo size={48} />
              <div className="hidden sm:block">
                <p className="font-display font-semibold text-foreground text-lg leading-tight">
                  Igreja da Promessa
                </p>
                <p className="text-muted-foreground text-xs">
                  Hortolândia
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden xl:block">
              <NavigationMenu>
                <NavigationMenuList className="gap-0">
                  {menuItems.map((item) => (
                    <NavigationMenuItem key={item.label}>
                      {item.subItems ? (
                        <>
                          <NavigationMenuTrigger className="text-xs font-medium text-foreground bg-transparent hover:bg-muted/50 data-[state=open]:bg-muted/50 px-3 py-2">
                            {item.label}
                          </NavigationMenuTrigger>
                          <NavigationMenuContent>
                            <ul className="grid w-[280px] gap-1 p-3 bg-popover border border-border rounded-lg shadow-elevated">
                              {item.subItems.map((subItem) => (
                                <li key={subItem.label}>
                                  <NavigationMenuLink asChild>
                                    <Link
                                      to={subItem.href}
                                      className="block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-sm text-foreground"
                                    >
                                      {subItem.label}
                                    </Link>
                                  </NavigationMenuLink>
                                </li>
                              ))}
                            </ul>
                          </NavigationMenuContent>
                        </>
                      ) : (
                        <NavigationMenuLink asChild>
                          <Link
                            to={item.href}
                            className={cn(
                              "text-xs font-medium px-3 py-2 rounded-md transition-colors",
                              item.label === "CONTRIBUA"
                                ? "bg-promessa-600 text-primary-foreground hover:bg-promessa-700"
                                : "text-foreground hover:bg-muted/50"
                            )}
                          >
                            {item.label}
                          </Link>
                        </NavigationMenuLink>
                      )}
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-md hover:bg-muted transition-colors"
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

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-card border-b border-border shadow-elevated max-h-[calc(100vh-104px)] overflow-y-auto">
          <nav className="container mx-auto px-4 py-4">
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.label}>
                  {item.subItems ? (
                    <div>
                      <button
                        onClick={() => toggleMobileSubmenu(item.label)}
                        className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors"
                      >
                        {item.label}
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 transition-transform",
                            expandedMobileItem === item.label && "rotate-180"
                          )}
                        />
                      </button>
                      {expandedMobileItem === item.label && (
                        <ul className="ml-4 mt-1 space-y-1 border-l-2 border-promessa-200 pl-4">
                          {item.subItems.map((subItem) => (
                            <li key={subItem.label}>
                              <Link
                                to={subItem.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                              >
                                {subItem.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <Link
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "block px-4 py-3 text-sm font-medium rounded-md transition-colors",
                        item.label === "CONTRIBUA"
                          ? "bg-promessa-600 text-primary-foreground hover:bg-promessa-700 text-center"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>

            {/* Mobile Login Button */}
            <div className="mt-4 pt-4 border-t border-border">
              <Button
                className="w-full bg-promessa-700 hover:bg-promessa-800 text-primary-foreground"
                asChild
              >
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <User className="w-4 h-4 mr-2" />
                  Fazer login ou se inscrever
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
