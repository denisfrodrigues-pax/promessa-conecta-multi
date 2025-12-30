import { useState, useEffect } from "react";
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

// Menu structure with submenus - Title Case standardization
const menuItems = [
  {
    label: "Quem Somos",
    href: "#quem-somos",
    subItems: [
      { label: "Teologia", href: "#teologia" },
      { label: "Valores", href: "#valores" },
      { label: "História", href: "#historia" },
      { label: "Pastores", href: "#pastores" },
      { label: "Liderança", href: "#lideranca" },
    ],
  },
  {
    label: "Ministérios",
    href: "#ministerios",
    subItems: [
      { label: "Kids", href: "#kids" },
      { label: "Conecta", href: "#conecta" },
      { label: "Mídia e Comunicação", href: "#midia" },
      { label: "Música", href: "#musica" },
      { label: "Bases", href: "/bases" },
    ],
  },
  {
    label: "Eventos",
    href: "/eventos",
    subItems: null,
  },
  {
    label: "Contribuições",
    href: "/contribuicoes",
    subItems: null,
  },
  {
    label: "Contato",
    href: "#contato",
    subItems: null,
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
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileSubmenu = (label: string) => {
    setExpandedMobileItem(expandedMobileItem === label ? null : label);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Top Bar - Compact social bar */}
      <div className="bg-promessa-700 text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-8">
            {/* Social Icons */}
            <div className="flex items-center gap-3">
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
                <span className="hidden sm:inline">Entrar</span>
                <span className="sm:hidden">Entrar</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Header - Solid background, high contrast */}
      <div 
        className={cn(
          "bg-white border-b border-border transition-all duration-300",
          isScrolled && "shadow-md"
        )}
      >
        <div className="container mx-auto px-4">
          <div 
            className={cn(
              "flex items-center justify-between transition-all duration-500",
              isScrolled ? "h-14" : "h-16 lg:h-20"
            )}
          >
            {/* Logo and Church Name */}
            <Link 
              to="/" 
              className="flex items-center gap-3 group"
            >
              <div className={cn(
                "transition-all duration-500",
                isScrolled ? "scale-90" : "scale-100"
              )}>
                <Logo size={isScrolled ? 40 : 48} />
              </div>
              <div className="hidden sm:block">
                <p className="font-display font-semibold text-foreground text-lg leading-tight group-hover:text-promessa-600 transition-colors duration-300">
                  Igreja da Promessa
                </p>
                <p className="text-muted-foreground text-xs">
                  Hortolândia
                </p>
              </div>
            </Link>

            {/* Desktop Navigation - All items same weight */}
            <nav className="hidden lg:block">
              <NavigationMenu>
                <NavigationMenuList className="gap-1">
                  {menuItems.map((item) => (
                    <NavigationMenuItem key={item.label}>
                      {item.subItems ? (
                        <>
                          <NavigationMenuTrigger 
                            className="text-sm font-medium text-foreground bg-transparent px-3 py-2 hover:bg-muted hover:text-promessa-600 data-[state=open]:bg-muted data-[state=open]:text-promessa-600 transition-colors duration-200"
                          >
                            {item.label}
                          </NavigationMenuTrigger>
                          <NavigationMenuContent>
                            <ul className="grid w-[220px] gap-1 p-2 bg-white border border-border rounded-lg shadow-lg">
                              {item.subItems.map((subItem) => (
                                <li key={subItem.label}>
                                  <NavigationMenuLink asChild>
                                    <Link
                                      to={subItem.href}
                                      className="block select-none rounded-md p-3 text-sm text-foreground hover:bg-muted hover:text-promessa-600 transition-colors duration-200"
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
                            className="text-sm font-medium text-foreground px-3 py-2 rounded-md hover:bg-muted hover:text-promessa-600 transition-colors duration-200"
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

      {/* Mobile Navigation */}
      <div 
        className={cn(
          "lg:hidden bg-white border-b border-border overflow-hidden transition-all duration-300",
          mobileMenuOpen 
            ? "max-h-[calc(100vh-104px)]" 
            : "max-h-0"
        )}
      >
        <nav className="container mx-auto px-4 py-4 overflow-y-auto max-h-[calc(100vh-140px)]">
          <ul className="space-y-1">
            {menuItems.map((item, index) => (
              <li 
                key={item.label}
                className={cn(
                  "transition-all duration-300",
                  mobileMenuOpen 
                    ? "opacity-100 translate-y-0" 
                    : "opacity-0 translate-y-2"
                )}
                style={{ transitionDelay: mobileMenuOpen ? `${index * 50}ms` : "0ms" }}
              >
                {item.subItems ? (
                  <div>
                    <button
                      onClick={() => toggleMobileSubmenu(item.label)}
                      className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/80 rounded-lg transition-all duration-300"
                    >
                      {item.label}
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 transition-transform duration-300",
                          expandedMobileItem === item.label && "rotate-180"
                        )}
                      />
                    </button>
                    <div 
                      className={cn(
                        "overflow-hidden transition-all duration-300 ease-out",
                        expandedMobileItem === item.label 
                          ? "max-h-96 opacity-100" 
                          : "max-h-0 opacity-0"
                      )}
                    >
                      <ul className="ml-4 mt-1 space-y-1 border-l-2 border-promessa-200 pl-4">
                        {item.subItems.map((subItem, subIndex) => (
                          <li 
                            key={subItem.label}
                            className={cn(
                              "transition-all duration-200",
                              expandedMobileItem === item.label 
                                ? "opacity-100 translate-x-0" 
                                : "opacity-0 -translate-x-2"
                            )}
                            style={{ transitionDelay: expandedMobileItem === item.label ? `${subIndex * 30}ms` : "0ms" }}
                          >
                            <Link
                              to={subItem.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block px-4 py-2.5 text-sm text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-lg transition-all duration-300"
                            >
                              {subItem.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <Link
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 text-sm font-medium rounded-lg text-foreground hover:bg-muted transition-colors duration-200"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>

          {/* Mobile Login Button */}
          <div 
            className={cn(
              "mt-4 pt-4 border-t border-border/50 transition-all duration-300",
              mobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
            style={{ transitionDelay: mobileMenuOpen ? "400ms" : "0ms" }}
          >
            <Button
              className="w-full bg-promessa-700 hover:bg-promessa-800 text-primary-foreground transition-all duration-300 hover:shadow-lg"
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
    </header>
  );
}
