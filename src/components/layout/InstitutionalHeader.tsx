import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, LogIn, Church } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIgrejaSlug } from "@/contexts/IgrejaSlugContext";
import { useIgrejaBySlug } from "@/hooks/useIgrejaBySlug";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/** Logo da igreja atual (por slug); cai num placeholder neutro se a igreja
 *  não tiver logo cadastrada — nunca a logo de uma igreja real específica. */
function HeaderLogo({
  logoUrl,
  nome,
  loading,
  size,
}: {
  logoUrl: string | null | undefined;
  nome: string | null | undefined;
  loading: boolean;
  size: number;
}) {
  if (loading) {
    return <div className="animate-pulse bg-muted rounded-xl" style={{ height: size, width: size }} />;
  }
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={nome || "Logo"}
        style={{ height: size }}
        className="w-auto object-contain"
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-xl bg-muted text-muted-foreground"
      style={{ height: size, width: size }}
    >
      <Church style={{ width: size * 0.55, height: size * 0.55 }} />
    </div>
  );
}

export function InstitutionalHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const { slug, p } = useIgrejaSlug();
  const { church, loading: churchLoading } = useIgrejaBySlug(slug);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="w-full border-b border-stone-200 bg-white relative z-50">
      {/* ================= MOBILE HEADER ================= */}
      <div className="flex items-center justify-between px-4 py-4 lg:hidden">
        {/* Logo */}
        <Link to={p('/publico')} className="flex items-center justify-center min-w-[44px] min-h-[44px] -m-1.5">
          <HeaderLogo logoUrl={church?.logo_url} nome={church?.nome} loading={churchLoading} size={40} />
        </Link>

        {/* Botão Hambúrguer */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Abrir menu"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl"
        >
          <Menu className="h-7 w-7" />
        </button>
      </div>

      {/* ================= MOBILE MENU FULLSCREEN ================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          {/* Topo */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-stone-200">
            <Link to={p('/publico')} onClick={closeMenu}>
              <HeaderLogo logoUrl={church?.logo_url} nome={church?.nome} loading={churchLoading} size={32} />
            </Link>
            <button onClick={closeMenu} aria-label="Fechar menu" className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl">
              <X className="h-7 w-7" />
            </button>
          </div>

          {/* Navegação */}
          <nav className="flex flex-col px-6 py-8">
            {/* Login - Item independente com destaque no topo */}
            <div className="pb-6 mb-2">
              <Button asChild className="w-full rounded-xl" size="lg">
                <Link onClick={closeMenu} to={p('/login')} className="flex items-center justify-center gap-2">
                  <LogIn className="w-5 h-5" />
                  Login
                </Link>
              </Button>
            </div>

            <Accordion type="multiple" className="w-full">
              {/* 1. Quem Somos - COM accordion */}
              <AccordionItem value="quem-somos" className="border-b border-stone-200">
                <AccordionTrigger className="text-lg font-semibold py-4 hover:no-underline">
                  Quem Somos
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="flex flex-col gap-1 pl-4">
                    <Link onClick={closeMenu} to={p('/quem-somos/historia')} className="text-stone-600 hover:text-stone-900 py-2.5">Nossa História</Link>
                    <Link onClick={closeMenu} to={p('/quem-somos/missao-visao')} className="text-stone-600 hover:text-stone-900 py-2.5">Missão e Visão</Link>
                    <Link onClick={closeMenu} to={p('/quem-somos/teologia')} className="text-stone-600 hover:text-stone-900 py-2.5">Nossa Teologia</Link>
                    <Link onClick={closeMenu} to={p('/quem-somos/pastores')} className="text-stone-600 hover:text-stone-900 py-2.5">Pastores</Link>
                    <Link onClick={closeMenu} to={p('/quem-somos/lideres-ministerios')} className="text-stone-600 hover:text-stone-900 py-2.5">Líderes e Ministérios</Link>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 2. Bases - SIMPLES */}
              <div className="border-b border-stone-200 py-2">
                <Link onClick={closeMenu} to={p('/bases-publicas')} className="text-lg font-semibold block py-2">
                  Bases
                </Link>
              </div>

              {/* 3. Trilha Amar e Servir - SIMPLES (sem destaque) */}
              <div className="border-b border-stone-200 py-2">
                <Link onClick={closeMenu} to={p('/trilha-amar-servir')} className="text-lg font-semibold block py-2">
                  Trilha Amar e Servir
                </Link>
              </div>

              {/* 4. Contribua - SIMPLES */}
              <div className="border-b border-stone-200 py-2">
                <Link onClick={closeMenu} to={p('/contribuicoes')} className="text-lg font-semibold block py-2">
                  Contribua
                </Link>
              </div>

              {/* 5. Contato - SIMPLES */}
              <div className="border-b border-stone-200 py-2">
                <Link onClick={closeMenu} to={p('/contato')} className="text-lg font-semibold block py-2">
                  Contato
                </Link>
              </div>

              {/* 6. Cadastro - COM accordion (Sou Novo + Seja Voluntário) */}
              <AccordionItem value="cadastro" className="border-b border-stone-200">
                <AccordionTrigger className="text-lg font-semibold py-4 hover:no-underline">
                  Cadastro
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="flex flex-col gap-1 pl-4">
                    <Link onClick={closeMenu} to={p('/sou-novo')} className="text-stone-600 hover:text-stone-900 py-2.5">Sou Novo</Link>
                    <Link onClick={closeMenu} to={p('/seja-voluntario')} className="text-stone-600 hover:text-stone-900 py-2.5">Seja Voluntário</Link>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Check-in Kids removido do menu público - disponível apenas no app para voluntários do ministério Kids */}
            </Accordion>
          </nav>
        </div>
      )}

      {/* ================= DESKTOP HEADER ================= */}
      <div className="hidden lg:flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        {/* Logo */}
        <Link to={p('/publico')}>
          <HeaderLogo logoUrl={church?.logo_url} nome={church?.nome} loading={churchLoading} size={48} />
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
              <div className="w-64 rounded-2xl border border-stone-200 bg-white shadow-elevated py-3">
                <Link to={p('/quem-somos/historia')} className="block px-4 py-2 text-sm hover:bg-stone-100 transition-colors">Nossa História</Link>
                <Link to={p('/quem-somos/missao-visao')} className="block px-4 py-2 text-sm hover:bg-stone-100 transition-colors">Missão e Visão</Link>
                <Link to={p('/quem-somos/teologia')} className="block px-4 py-2 text-sm hover:bg-stone-100 transition-colors">Nossa Teologia</Link>
                <Link to={p('/quem-somos/pastores')} className="block px-4 py-2 text-sm hover:bg-stone-100 transition-colors">Pastores</Link>
                <Link to={p('/quem-somos/lideres-ministerios')} className="block px-4 py-2 text-sm hover:bg-stone-100 transition-colors">Líderes e Ministérios</Link>
              </div>
            </div>
          </div>

          {/* 2. Bases - SIMPLES */}
          <Link to={p('/bases-publicas')} className="hover:text-primary transition-colors">Bases</Link>

          {/* 3. Trilha Amar e Servir - SIMPLES (sem destaque) */}
          <Link to={p('/trilha-amar-servir')} className="hover:text-primary transition-colors">Trilha Amar e Servir</Link>

          {/* 4. Contribua - SIMPLES */}
          <Link to={p('/contribuicoes')} className="hover:text-primary transition-colors">Contribua</Link>

          {/* 5. Contato - SIMPLES */}
          <Link to={p('/contato')} className="hover:text-primary transition-colors">Contato</Link>

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
              <div className="w-48 rounded-2xl border border-stone-200 bg-white shadow-elevated py-3">
                <Link to={p('/sou-novo')} className="block px-4 py-2 text-sm hover:bg-stone-100 transition-colors">Sou Novo</Link>
                <Link to={p('/seja-voluntario')} className="block px-4 py-2 text-sm hover:bg-stone-100 transition-colors">Seja Voluntário</Link>
              </div>
            </div>
          </div>

          {/* Check-in Kids removido do menu público - disponível apenas no app para voluntários do ministério Kids */}

          {/* 8. Login - Botão independente */}
          <Button asChild variant="outline" size="sm" className="ml-2 rounded-xl">
            <Link to={p('/login')} className="flex items-center gap-2">
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
