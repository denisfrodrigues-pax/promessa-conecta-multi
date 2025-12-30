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
  // Estado para controle do menu mobile
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Estado para controle de dropdown desktop - qual está aberto
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Função para fechar menu mobile
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
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
            {/* Container explícito: hidden lg:flex flex-row items-center gap-x-6 */}
            <nav className="hidden lg:flex flex-row items-center gap-x-6">
              
              {/* Item 1: Quem Somos - Com dropdown */}
              <div 
                className="relative"
                onMouseEnter={() => setOpenDropdown("Quem Somos")}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button
                  className={cn(
                    "flex flex-row items-center gap-1 h-10 px-2 text-[13px] font-medium rounded-md transition-colors duration-200 whitespace-nowrap",
                    openDropdown === "Quem Somos" 
                      ? "text-promessa-600 bg-muted" 
                      : "text-foreground hover:text-promessa-600 hover:bg-muted"
                  )}
                >
                  Quem Somos
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", openDropdown === "Quem Somos" && "rotate-180")} />
                </button>
                <div className={cn(
                  "absolute left-0 top-full pt-1 z-50 transition-all duration-200 ease-out",
                  openDropdown === "Quem Somos" ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2 pointer-events-none"
                )}>
                  <ul className="min-w-[280px] bg-white border border-border rounded-lg shadow-lg shadow-black/10 py-2">
                    <li><Link to="#teologia" className="block px-4 py-2.5 text-sm text-foreground hover:text-promessa-600 hover:bg-muted/60 whitespace-nowrap">Nossa Teologia</Link></li>
                    <li><Link to="#missao-visao" className="block px-4 py-2.5 text-sm text-foreground hover:text-promessa-600 hover:bg-muted/60 whitespace-nowrap">Missão e Visão</Link></li>
                    <li><Link to="#historia" className="block px-4 py-2.5 text-sm text-foreground hover:text-promessa-600 hover:bg-muted/60 whitespace-nowrap">Nossa História</Link></li>
                    <li><Link to="#pastores" className="block px-4 py-2.5 text-sm text-foreground hover:text-promessa-600 hover:bg-muted/60 whitespace-nowrap">Pastores</Link></li>
                    <li><Link to="#lideranca" className="block px-4 py-2.5 text-sm text-foreground hover:text-promessa-600 hover:bg-muted/60 whitespace-nowrap">Liderança</Link></li>
                    <li><Link to="#porque-participar" className="block px-4 py-2.5 text-sm text-foreground hover:text-promessa-600 hover:bg-muted/60 whitespace-nowrap">Por que Participar da Igreja da Promessa?</Link></li>
                  </ul>
                </div>
              </div>

              {/* Item 2: Ministérios - Com dropdown */}
              <div 
                className="relative"
                onMouseEnter={() => setOpenDropdown("Ministérios")}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button
                  className={cn(
                    "flex flex-row items-center gap-1 h-10 px-2 text-[13px] font-medium rounded-md transition-colors duration-200 whitespace-nowrap",
                    openDropdown === "Ministérios" 
                      ? "text-promessa-600 bg-muted" 
                      : "text-foreground hover:text-promessa-600 hover:bg-muted"
                  )}
                >
                  Ministérios
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", openDropdown === "Ministérios" && "rotate-180")} />
                </button>
                <div className={cn(
                  "absolute left-0 top-full pt-1 z-50 transition-all duration-200 ease-out",
                  openDropdown === "Ministérios" ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2 pointer-events-none"
                )}>
                  <ul className="min-w-[240px] bg-white border border-border rounded-lg shadow-lg shadow-black/10 py-2">
                    <li><Link to="#kids" className="block px-4 py-2.5 text-sm text-foreground hover:text-promessa-600 hover:bg-muted/60 whitespace-nowrap">Kids</Link></li>
                    <li><Link to="#conectores" className="block px-4 py-2.5 text-sm text-foreground hover:text-promessa-600 hover:bg-muted/60 whitespace-nowrap">Conectores</Link></li>
                    <li><Link to="#midia" className="block px-4 py-2.5 text-sm text-foreground hover:text-promessa-600 hover:bg-muted/60 whitespace-nowrap">Mídia e Comunicação</Link></li>
                    <li><Link to="#musica" className="block px-4 py-2.5 text-sm text-foreground hover:text-promessa-600 hover:bg-muted/60 whitespace-nowrap">Música</Link></li>
                    <li><Link to="#educacao" className="block px-4 py-2.5 text-sm text-foreground hover:text-promessa-600 hover:bg-muted/60 whitespace-nowrap">Educação</Link></li>
                    <li><Link to="/bases" className="block px-4 py-2.5 text-sm text-foreground hover:text-promessa-600 hover:bg-muted/60 whitespace-nowrap">Bases</Link></li>
                  </ul>
                </div>
              </div>

              {/* Item 3: Cadastro - Com dropdown */}
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
                    <li><Link to="/sou-novo" className="block px-4 py-2.5 text-sm text-foreground hover:text-promessa-600 hover:bg-muted/60 whitespace-nowrap">Seja um Voluntário!</Link></li>
                    <li><Link to="/sou-novo" className="block px-4 py-2.5 text-sm text-foreground hover:text-promessa-600 hover:bg-muted/60 whitespace-nowrap">Membros</Link></li>
                    <li><Link to="/sou-novo" className="block px-4 py-2.5 text-sm text-foreground hover:text-promessa-600 hover:bg-muted/60 whitespace-nowrap">Visitantes</Link></li>
                    <li><Link to="/sou-novo" className="block px-4 py-2.5 text-sm text-foreground hover:text-promessa-600 hover:bg-muted/60 whitespace-nowrap">Cadastro Infantil</Link></li>
                  </ul>
                </div>
              </div>

              {/* Item 4: Participe de uma Base - Link direto */}
              <Link
                to="/bases"
                className="flex flex-row items-center h-10 px-2 text-[13px] font-medium text-foreground hover:text-promessa-600 hover:bg-muted rounded-md transition-colors duration-200 whitespace-nowrap"
              >
                Participe de uma Base
              </Link>

              {/* Item 5: Conteúdo - Com dropdown */}
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
                    <li><Link to="#series" className="block px-4 py-2.5 text-sm text-foreground hover:text-promessa-600 hover:bg-muted/60 whitespace-nowrap">Séries de Mensagens</Link></li>
                    <li><Link to="#leituras" className="block px-4 py-2.5 text-sm text-foreground hover:text-promessa-600 hover:bg-muted/60 whitespace-nowrap">Leituras</Link></li>
                  </ul>
                </div>
              </div>

              {/* Item 6: Participe - Com dropdown */}
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
                    <li><Link to="/oracao" className="block px-4 py-2.5 text-sm text-foreground hover:text-promessa-600 hover:bg-muted/60 whitespace-nowrap">Pedidos de Oração</Link></li>
                  </ul>
                </div>
              </div>

              {/* Item 7: Contribua - Link direto, sem destaque especial */}
              <Link
                to="/contribuicoes"
                className="flex flex-row items-center h-10 px-2 text-[13px] font-medium text-foreground hover:text-promessa-600 hover:bg-muted rounded-md transition-colors duration-200 whitespace-nowrap"
              >
                Contribua
              </Link>

              {/* Item 8: Contato - Com dropdown */}
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
                    <li><Link to="#fale-conosco" className="block px-4 py-2.5 text-sm text-foreground hover:text-promessa-600 hover:bg-muted/60 whitespace-nowrap">Fale Conosco</Link></li>
                    <li><Link to="#localizacao" className="block px-4 py-2.5 text-sm text-foreground hover:text-promessa-600 hover:bg-muted/60 whitespace-nowrap">Onde Nos Encontrar</Link></li>
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
            
            {/* Mobile: Quem Somos */}
            <AccordionItem value="Quem Somos" className="border-b border-border/40">
              <AccordionTrigger className="px-5 py-4 text-base font-semibold text-foreground hover:text-promessa-600 hover:no-underline">
                Quem Somos
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <ul className="ml-5 pl-4 border-l-2 border-promessa-200 space-y-1">
                  <li><Link to="#teologia" onClick={closeMobileMenu} className="block py-3 px-4 text-[15px] text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-md">Nossa Teologia</Link></li>
                  <li><Link to="#missao-visao" onClick={closeMobileMenu} className="block py-3 px-4 text-[15px] text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-md">Missão e Visão</Link></li>
                  <li><Link to="#historia" onClick={closeMobileMenu} className="block py-3 px-4 text-[15px] text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-md">Nossa História</Link></li>
                  <li><Link to="#pastores" onClick={closeMobileMenu} className="block py-3 px-4 text-[15px] text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-md">Pastores</Link></li>
                  <li><Link to="#lideranca" onClick={closeMobileMenu} className="block py-3 px-4 text-[15px] text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-md">Liderança</Link></li>
                  <li><Link to="#porque-participar" onClick={closeMobileMenu} className="block py-3 px-4 text-[15px] text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-md">Por que Participar da Igreja da Promessa?</Link></li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Mobile: Ministérios */}
            <AccordionItem value="Ministérios" className="border-b border-border/40">
              <AccordionTrigger className="px-5 py-4 text-base font-semibold text-foreground hover:text-promessa-600 hover:no-underline">
                Ministérios
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <ul className="ml-5 pl-4 border-l-2 border-promessa-200 space-y-1">
                  <li><Link to="#kids" onClick={closeMobileMenu} className="block py-3 px-4 text-[15px] text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-md">Kids</Link></li>
                  <li><Link to="#conectores" onClick={closeMobileMenu} className="block py-3 px-4 text-[15px] text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-md">Conectores</Link></li>
                  <li><Link to="#midia" onClick={closeMobileMenu} className="block py-3 px-4 text-[15px] text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-md">Mídia e Comunicação</Link></li>
                  <li><Link to="#musica" onClick={closeMobileMenu} className="block py-3 px-4 text-[15px] text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-md">Música</Link></li>
                  <li><Link to="#educacao" onClick={closeMobileMenu} className="block py-3 px-4 text-[15px] text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-md">Educação</Link></li>
                  <li><Link to="/bases" onClick={closeMobileMenu} className="block py-3 px-4 text-[15px] text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-md">Bases</Link></li>
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
                  <li><Link to="/sou-novo" onClick={closeMobileMenu} className="block py-3 px-4 text-[15px] text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-md">Seja um Voluntário!</Link></li>
                  <li><Link to="/sou-novo" onClick={closeMobileMenu} className="block py-3 px-4 text-[15px] text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-md">Membros</Link></li>
                  <li><Link to="/sou-novo" onClick={closeMobileMenu} className="block py-3 px-4 text-[15px] text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-md">Visitantes</Link></li>
                  <li><Link to="/sou-novo" onClick={closeMobileMenu} className="block py-3 px-4 text-[15px] text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-md">Cadastro Infantil</Link></li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Mobile: Participe de uma Base - Link direto */}
            <div className="border-b border-border/40">
              <Link to="/bases" onClick={closeMobileMenu} className="block px-5 py-4 text-base font-semibold text-foreground hover:text-promessa-600">
                Participe de uma Base
              </Link>
            </div>

            {/* Mobile: Conteúdo */}
            <AccordionItem value="Conteúdo" className="border-b border-border/40">
              <AccordionTrigger className="px-5 py-4 text-base font-semibold text-foreground hover:text-promessa-600 hover:no-underline">
                Conteúdo
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <ul className="ml-5 pl-4 border-l-2 border-promessa-200 space-y-1">
                  <li><Link to="#series" onClick={closeMobileMenu} className="block py-3 px-4 text-[15px] text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-md">Séries de Mensagens</Link></li>
                  <li><Link to="#leituras" onClick={closeMobileMenu} className="block py-3 px-4 text-[15px] text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-md">Leituras</Link></li>
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
                  <li><Link to="/oracao" onClick={closeMobileMenu} className="block py-3 px-4 text-[15px] text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-md">Pedidos de Oração</Link></li>
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
                  <li><Link to="#fale-conosco" onClick={closeMobileMenu} className="block py-3 px-4 text-[15px] text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-md">Fale Conosco</Link></li>
                  <li><Link to="#localizacao" onClick={closeMobileMenu} className="block py-3 px-4 text-[15px] text-muted-foreground hover:text-promessa-600 hover:bg-promessa-50 rounded-md">Onde Nos Encontrar</Link></li>
                </ul>
              </AccordionContent>
            </AccordionItem>

          </Accordion>

          {/* Mobile Login Button */}
          <div className="px-5 mt-6">
            <Button className="w-full bg-promessa-700 hover:bg-promessa-800 text-primary-foreground h-12 text-base font-medium" asChild>
              <Link to="/auth" onClick={closeMobileMenu}>
                <User className="w-4 h-4 mr-2" />
                Entrar ou Cadastrar
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
