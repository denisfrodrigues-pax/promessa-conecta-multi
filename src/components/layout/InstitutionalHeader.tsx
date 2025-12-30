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

export function InstitutionalHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Top Bar - Desktop only */}
      <div className="hidden lg:block bg-promessa-700 text-primary-foreground">
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
                <span>Entrar</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white border-b border-border/50 shadow-sm shadow-black/5">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14 lg:h-16">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center gap-2.5 group flex-shrink-0"
            >
              <Logo size={40} />
              <div className="hidden sm:block">
                <p className="font-display font-semibold text-foreground text-sm leading-tight group-hover:text-promessa-600 transition-colors duration-200">
                  Igreja da Promessa
                </p>
                <p className="text-muted-foreground text-[10px]">
                  Hortolândia
                </p>
              </div>
            </Link>

            {/* Desktop Navigation - Horizontal layout */}
            <nav className="hidden lg:flex items-center">
              <NavigationMenu>
                <NavigationMenuList className="flex flex-row items-center gap-x-1">
                  {menuItems.map((item) => (
                    <NavigationMenuItem key={item.label} className="relative">
                      {item.subItems ? (
                        <>
                          <NavigationMenuTrigger 
                            className="h-auto text-[13px] font-medium text-foreground bg-transparent px-2.5 py-1.5 hover:bg-muted hover:text-promessa-600 data-[state=open]:bg-muted data-[state=open]:text-promessa-600 transition-colors duration-200 whitespace-nowrap"
                          >
                            {item.label}
                          </NavigationMenuTrigger>
                          <NavigationMenuContent>
                            <ul className="min-w-[220px] p-2 bg-white border border-border rounded-lg shadow-lg">
                              {item.subItems.map((subItem) => (
                                <li key={subItem.label}>
                                  <NavigationMenuLink asChild>
                                    <Link
                                      to={subItem.href}
                                      className="block select-none rounded-md px-3 py-2.5 text-sm text-foreground hover:bg-muted hover:text-promessa-600 transition-colors duration-200 whitespace-nowrap"
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
                            className="text-[13px] font-medium text-foreground px-2.5 py-1.5 rounded-md hover:bg-muted hover:text-promessa-600 transition-colors duration-200 whitespace-nowrap inline-flex items-center"
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

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 top-14 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Navigation Drawer */}
      <div 
        className={cn(
          "lg:hidden fixed top-14 right-0 bottom-0 w-full max-w-sm bg-white shadow-xl z-50 transform transition-transform duration-300 ease-out overflow-hidden",
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <nav className="h-full overflow-y-auto py-4 px-4">
          <Accordion type="single" collapsible className="w-full">
            {menuItems.map((item) => (
              item.subItems ? (
                <AccordionItem 
                  key={item.label} 
                  value={item.label}
                  className="border-b border-border/50"
                >
                  <AccordionTrigger 
                    className="py-4 text-base font-medium text-foreground hover:text-promessa-600 hover:no-underline"
                  >
                    {item.label}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <ul className="space-y-1 pl-4 border-l-2 border-promessa-200">
                      {item.subItems.map((subItem) => (
                        <li key={subItem.label}>
                          <Link
                            to={subItem.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className="block py-2.5 px-3 text-sm text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-md transition-colors duration-200"
                          >
                            {subItem.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ) : (
                <div key={item.label} className="border-b border-border/50">
                  <Link
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-4 text-base font-medium text-foreground hover:text-promessa-600 transition-colors duration-200"
                  >
                    {item.label}
                  </Link>
                </div>
              )
            ))}
          </Accordion>

          {/* Mobile Login Button */}
          <div className="mt-6 pt-4 border-t border-border">
            <Button
              className="w-full bg-promessa-700 hover:bg-promessa-800 text-primary-foreground"
              asChild
            >
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                <User className="w-4 h-4 mr-2" />
                Entrar ou Cadastrar
              </Link>
            </Button>
          </div>

          {/* Mobile Social Links */}
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3">Siga-nos</p>
            <div className="flex items-center gap-4">
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
