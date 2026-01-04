import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import logoPromessaHortolandia from "@/assets/logo-promessa-hortolandia.png";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function InstitutionalHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            <Accordion type="multiple" className="w-full">
              {/* 1. Quem Somos - COM accordion */}
              <AccordionItem value="quem-somos" className="border-b">
                <AccordionTrigger className="text-lg font-medium py-4 hover:no-underline">
                  Quem Somos
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="flex flex-col gap-3 pl-4">
                    <Link onClick={closeMenu} to="/quem-somos/teologia" className="text-muted-foreground hover:text-foreground">Nossa Teologia</Link>
                    <Link onClick={closeMenu} to="/quem-somos/missao-visao" className="text-muted-foreground hover:text-foreground">Missão e Visão</Link>
                    <Link onClick={closeMenu} to="/quem-somos/historia" className="text-muted-foreground hover:text-foreground">Nossa História</Link>
                    <Link onClick={closeMenu} to="/quem-somos/pastores" className="text-muted-foreground hover:text-foreground">Pastores</Link>
                    <Link onClick={closeMenu} to="/quem-somos/lideranca" className="text-muted-foreground hover:text-foreground">Liderança</Link>
                    <Link onClick={closeMenu} to="/quem-somos/ministerios" className="text-muted-foreground hover:text-foreground">Ministérios</Link>
                    <Link onClick={closeMenu} to="/quem-somos/por-que-participar" className="text-muted-foreground hover:text-foreground">Por que participar</Link>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 2. Participe de uma Base - SIMPLES */}
              <div className="border-b py-4">
                <Link onClick={closeMenu} to="/bases" className="text-lg font-medium">
                  Participe de uma Base
                </Link>
              </div>

              {/* 3. Conteúdo - COM accordion */}
              <AccordionItem value="conteudo" className="border-b">
                <AccordionTrigger className="text-lg font-medium py-4 hover:no-underline">
                  Conteúdo
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="flex flex-col gap-3 pl-4">
                    <Link onClick={closeMenu} to="/conteudo/pregacoes" className="text-muted-foreground hover:text-foreground">Pregações</Link>
                    <Link onClick={closeMenu} to="/conteudo/estudos" className="text-muted-foreground hover:text-foreground">Estudos</Link>
                    <Link onClick={closeMenu} to="/conteudo/devocionais" className="text-muted-foreground hover:text-foreground">Devocionais</Link>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 4. Participe - COM accordion */}
              <AccordionItem value="participe" className="border-b">
                <AccordionTrigger className="text-lg font-medium py-4 hover:no-underline">
                  Participe
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="flex flex-col gap-3 pl-4">
                    <Link onClick={closeMenu} to="/eventos" className="text-muted-foreground hover:text-foreground">Eventos</Link>
                    <Link onClick={closeMenu} to="/oracao" className="text-muted-foreground hover:text-foreground">Pedidos de Oração</Link>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 5. Contribua - SIMPLES */}
              <div className="border-b py-4">
                <Link onClick={closeMenu} to="/contribuicoes" className="text-lg font-medium">
                  Contribua
                </Link>
              </div>

              {/* 6. Contato - COM accordion */}
              <AccordionItem value="contato" className="border-b">
                <AccordionTrigger className="text-lg font-medium py-4 hover:no-underline">
                  Contato
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="flex flex-col gap-3 pl-4">
                    <Link onClick={closeMenu} to="/contato" className="text-muted-foreground hover:text-foreground">Fale Conosco</Link>
                    <Link onClick={closeMenu} to="/contato#localizacao" className="text-muted-foreground hover:text-foreground">Onde Estamos</Link>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 7. Cadastro - COM accordion */}
              <AccordionItem value="cadastro" className="border-b">
                <AccordionTrigger className="text-lg font-medium py-4 hover:no-underline">
                  Cadastro
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="flex flex-col gap-3 pl-4">
                    <Link onClick={closeMenu} to="/sou-novo" className="text-muted-foreground hover:text-foreground">Sou Novo</Link>
                    <Link onClick={closeMenu} to="/auth" className="text-muted-foreground hover:text-foreground">Entrar</Link>
                  </div>
                </AccordionContent>
              </AccordionItem>
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
          <div className="relative group">
            <button className="flex items-center gap-1 hover:text-primary transition-colors">
              Quem Somos
              <ChevronDown className="h-4 w-4 transition-transform duration-200 group-hover:rotate-180" />
            </button>
            <div className="absolute top-full left-0 mt-2 hidden group-hover:block z-50">
              <div className="w-64 rounded-lg border bg-white shadow-lg py-2">
                <Link to="/quem-somos/teologia" className="block px-4 py-2 text-sm hover:bg-muted">Nossa Teologia</Link>
                <Link to="/quem-somos/missao-visao" className="block px-4 py-2 text-sm hover:bg-muted">Missão e Visão</Link>
                <Link to="/quem-somos/historia" className="block px-4 py-2 text-sm hover:bg-muted">Nossa História</Link>
                <Link to="/quem-somos/pastores" className="block px-4 py-2 text-sm hover:bg-muted">Pastores</Link>
                <Link to="/quem-somos/lideranca" className="block px-4 py-2 text-sm hover:bg-muted">Liderança</Link>
                <Link to="/quem-somos/ministerios" className="block px-4 py-2 text-sm hover:bg-muted">Ministérios</Link>
                <Link to="/quem-somos/por-que-participar" className="block px-4 py-2 text-sm hover:bg-muted">Por que participar</Link>
              </div>
            </div>
          </div>

          {/* 2. Base - SIMPLES */}
          <Link to="/bases" className="hover:text-primary transition-colors">Base</Link>

          {/* 3. Conteúdo - SIMPLES */}
          <Link to="/conteudo" className="hover:text-primary transition-colors">Conteúdo</Link>

          {/* 4. Eventos - SIMPLES */}
          <Link to="/eventos" className="hover:text-primary transition-colors">Eventos</Link>

          {/* 5. Contribua - SIMPLES */}
          <Link to="/contribuicoes" className="hover:text-primary transition-colors">Contribua</Link>

          {/* 6. Contato - SIMPLES */}
          <Link to="/contato" className="hover:text-primary transition-colors">Contato</Link>

          {/* 7. Cadastro - SIMPLES */}
          <Link to="/sou-novo" className="hover:text-primary transition-colors">Cadastro</Link>
        </nav>
      </div>
    </header>
  );
}

export default InstitutionalHeader;
