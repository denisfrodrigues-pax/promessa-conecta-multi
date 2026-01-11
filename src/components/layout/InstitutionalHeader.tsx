import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, LogIn } from "lucide-react";
import logoPromessaHortolandia from "@/assets/logo-promessa-hortolandia.png";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function InstitutionalHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="w-full border-b bg-white relative z-50">
      {/* ================= MOBILE HEADER ================= */}
      <div className="flex items-center justify-between px-4 py-3 lg:hidden">
        {/* Logo */}
        <Link to="/">
          <img
            src={logoPromessaHortolandia}
            alt="Igreja da Promessa"
            className="h-10"
          />
        </Link>

        {/* Botão Hambúrguer */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Abrir menu"
          className="p-2"
        >
          <Menu className="h-7 w-7" />
        </button>
      </div>

      {/* ================= MOBILE MENU FULLSCREEN ================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          {/* Topo */}
          <div className="flex items-center justify-between px-4 py-4 border-b">
            <Link to="/" onClick={closeMenu}>
              <img src={logoPromessaHortolandia} className="h-8" alt="Logo" />
            </Link>
            <button onClick={closeMenu} aria-label="Fechar menu">
              <X className="h-7 w-7" />
            </button>
          </div>

          {/* Navegação */}
          <nav className="flex flex-col px-4 py-6">
            {/* Login - Item independente com destaque no topo */}
            <div className="pb-4 mb-2">
              <Button asChild className="w-full" size="lg">
                <Link onClick={closeMenu} to="/auth" className="flex items-center justify-center gap-2">
                  <LogIn className="w-5 h-5" />
                  Login
                </Link>
              </Button>
            </div>

            <Accordion type="multiple" className="w-full">
              {/* 1. Quem Somos - COM accordion */}
              <AccordionItem value="quem-somos" className="border-b">
                <AccordionTrigger className="text-lg font-medium py-4 hover:no-underline">
                  Quem Somos
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="flex flex-col gap-3 pl-4">
                    <Link onClick={closeMenu} to="/quem-somos/historia" className="text-muted-foreground hover:text-foreground">Nossa História</Link>
                    <Link onClick={closeMenu} to="/quem-somos/missao-visao" className="text-muted-foreground hover:text-foreground">Missão e Visão</Link>
                    <Link onClick={closeMenu} to="/quem-somos/teologia" className="text-muted-foreground hover:text-foreground">Nossa Teologia</Link>
                    <Link onClick={closeMenu} to="/quem-somos/pastores" className="text-muted-foreground hover:text-foreground">Pastores</Link>
                    <Link onClick={closeMenu} to="/quem-somos/lideres-ministerios" className="text-muted-foreground hover:text-foreground">Líderes e Ministérios</Link>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 2. Bases - SIMPLES */}
              <div className="border-b py-4">
                <Link onClick={closeMenu} to="/bases-publicas" className="text-lg font-medium">
                  Bases
                </Link>
              </div>

              {/* 3. Trilha Amar e Servir - SIMPLES (sem destaque) */}
              <div className="border-b py-4">
                <Link onClick={closeMenu} to="/trilha-amar-servir" className="text-lg font-medium">
                  Trilha Amar e Servir
                </Link>
              </div>

              {/* 4. Contribua - SIMPLES */}
              <div className="border-b py-4">
                <Link onClick={closeMenu} to="/contribuicoes" className="text-lg font-medium">
                  Contribua
                </Link>
              </div>

              {/* 5. Contato - SIMPLES */}
              <div className="border-b py-4">
                <Link onClick={closeMenu} to="/contato" className="text-lg font-medium">
                  Contato
                </Link>
              </div>

              {/* 6. Cadastro - COM accordion (Sou Novo + Seja Voluntário) */}
              <AccordionItem value="cadastro" className="border-b">
                <AccordionTrigger className="text-lg font-medium py-4 hover:no-underline">
                  Cadastro
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="flex flex-col gap-3 pl-4">
                    <Link onClick={closeMenu} to="/sou-novo" className="text-muted-foreground hover:text-foreground">Sou Novo</Link>
                    <Link onClick={closeMenu} to="/seja-voluntario" className="text-muted-foreground hover:text-foreground">Seja Voluntário</Link>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 7. Check-in Kids - SIMPLES (independente) - oculto na home pública */}
              {!isHomePage && (
                <div className="border-b py-4">
                  <Link onClick={closeMenu} to="/check-in-kids" className="text-lg font-medium">
                    Check-in Kids
                  </Link>
                </div>
              )}
            </Accordion>
          </nav>
        </div>
      )}

      {/* ================= DESKTOP HEADER ================= */}
      <div className="hidden lg:flex items-center justify-between px-8 py-4 max-w-7xl mx-auto">
        {/* Logo */}
        <Link to="/">
          <img
            src={logoPromessaHortolandia}
            alt="Igreja da Promessa"
            className="h-12"
          />
        </Link>

        {/* Menu Desktop */}
        <nav className="flex items-center gap-6 font-medium">
          {/* 1. Quem Somos - COM dropdown */}
          <div className="relative group/dropdown">
            <button className="flex items-center gap-1 py-2 hover:text-primary transition-colors">
              Quem Somos
              <ChevronDown className="h-4 w-4 transition-transform duration-200 delay-150 group-hover/dropdown:rotate-180" />
            </button>
            {/* Ponte invisível anti-flicker */}
            <div className="absolute top-full left-0 h-2 w-full" />
            {/* Dropdown com delay e transição suave */}
            <div className="absolute top-[calc(100%+0.5rem)] left-0 opacity-0 invisible translate-y-1 group-hover/dropdown:opacity-100 group-hover/dropdown:visible group-hover/dropdown:translate-y-0 transition-all duration-200 delay-150 ease-out z-50">
              <div className="w-64 rounded-lg border bg-white shadow-lg py-2">
                <Link to="/quem-somos/historia" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Nossa História</Link>
                <Link to="/quem-somos/missao-visao" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Missão e Visão</Link>
                <Link to="/quem-somos/teologia" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Nossa Teologia</Link>
                <Link to="/quem-somos/pastores" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Pastores</Link>
                <Link to="/quem-somos/lideres-ministerios" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Líderes e Ministérios</Link>
              </div>
            </div>
          </div>

          {/* 2. Bases - SIMPLES */}
          <Link to="/bases-publicas" className="hover:text-primary transition-colors">Bases</Link>

          {/* 3. Trilha Amar e Servir - SIMPLES (sem destaque) */}
          <Link to="/trilha-amar-servir" className="hover:text-primary transition-colors">Trilha Amar e Servir</Link>

          {/* 4. Contribua - SIMPLES */}
          <Link to="/contribuicoes" className="hover:text-primary transition-colors">Contribua</Link>

          {/* 5. Contato - SIMPLES */}
          <Link to="/contato" className="hover:text-primary transition-colors">Contato</Link>

          {/* 6. Cadastro - COM dropdown (Sou Novo + Seja Voluntário) */}
          <div className="relative group/cadastro">
            <button className="flex items-center gap-1 py-2 hover:text-primary transition-colors">
              Cadastro
              <ChevronDown className="h-4 w-4 transition-transform duration-200 delay-150 group-hover/cadastro:rotate-180" />
            </button>
            {/* Ponte invisível anti-flicker */}
            <div className="absolute top-full left-0 h-2 w-full" />
            {/* Dropdown com delay e transição suave */}
            <div className="absolute top-[calc(100%+0.5rem)] left-0 opacity-0 invisible translate-y-1 group-hover/cadastro:opacity-100 group-hover/cadastro:visible group-hover/cadastro:translate-y-0 transition-all duration-200 delay-150 ease-out z-50">
              <div className="w-48 rounded-lg border bg-white shadow-lg py-2">
                <Link to="/sou-novo" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Sou Novo</Link>
                <Link to="/seja-voluntario" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Seja Voluntário</Link>
              </div>
            </div>
          </div>

          {/* 7. Check-in Kids - SIMPLES (independente) - oculto na home pública */}
          {!isHomePage && (
            <Link to="/check-in-kids" className="hover:text-primary transition-colors">Check-in Kids</Link>
          )}

          {/* 8. Login - Botão independente */}
          <Button asChild variant="outline" size="sm" className="ml-2">
            <Link to="/auth" className="flex items-center gap-2">
              <LogIn className="w-4 h-4" />
              Login
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

export default InstitutionalHeader;
