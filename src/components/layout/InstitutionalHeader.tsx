import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import logoPromessaHortolandia from "@/assets/logo-promessa-hortolandia.png";

export function InstitutionalHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            <Link to="/" onClick={() => setMobileMenuOpen(false)}>
              <img src={logoPromessaHortolandia} className="h-8" alt="Logo" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Fechar menu"
            >
              <X className="h-7 w-7" />
            </button>
          </div>

          {/* Navegação */}
          <nav className="flex flex-col gap-6 px-6 py-8 text-lg font-medium">
            <Link onClick={() => setMobileMenuOpen(false)} to="/quem-somos">Quem Somos</Link>
            <Link onClick={() => setMobileMenuOpen(false)} to="/bases">Participe de uma Base</Link>
            <Link onClick={() => setMobileMenuOpen(false)} to="/conteudo">Conteúdo</Link>
            <Link onClick={() => setMobileMenuOpen(false)} to="/eventos">Eventos</Link>
            <Link onClick={() => setMobileMenuOpen(false)} to="/oracao">Pedidos de Oração</Link>
            <Link onClick={() => setMobileMenuOpen(false)} to="/contribuicoes">Contribua</Link>
            <Link onClick={() => setMobileMenuOpen(false)} to="/contato">Contato</Link>
            <Link onClick={() => setMobileMenuOpen(false)} to="/sou-novo">Cadastro</Link>
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

          {/* 2. Participe de uma Base - SIMPLES */}
          <Link to="/bases" className="hover:text-primary transition-colors">Participe de uma Base</Link>

          {/* 3. Conteúdo - COM dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1 hover:text-primary transition-colors">
              Conteúdo
            </button>
            <div className="absolute top-full left-0 mt-2 hidden group-hover:block z-50">
              <div className="w-64 rounded-lg border bg-white shadow-lg py-2">
                <Link to="/conteudo/pregacoes" className="block px-4 py-2 text-sm hover:bg-muted">Pregações</Link>
                <Link to="/conteudo/estudos" className="block px-4 py-2 text-sm hover:bg-muted">Estudos</Link>
                <Link to="/conteudo/devocionais" className="block px-4 py-2 text-sm hover:bg-muted">Devocionais</Link>
              </div>
            </div>
          </div>

          {/* 4. Participe - COM dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1 hover:text-primary transition-colors">
              Participe
            </button>
            <div className="absolute top-full left-0 mt-2 hidden group-hover:block z-50">
              <div className="w-64 rounded-lg border bg-white shadow-lg py-2">
                <Link to="/eventos" className="block px-4 py-2 text-sm hover:bg-muted">Eventos</Link>
                <Link to="/oracao" className="block px-4 py-2 text-sm hover:bg-muted">Pedidos de Oração</Link>
              </div>
            </div>
          </div>

          {/* 5. Contribua - SIMPLES */}
          <Link to="/contribuicoes" className="hover:text-primary transition-colors">Contribua</Link>

          {/* 6. Contato - COM dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1 hover:text-primary transition-colors">
              Contato
            </button>
            <div className="absolute top-full left-0 mt-2 hidden group-hover:block z-50">
              <div className="w-64 rounded-lg border bg-white shadow-lg py-2">
                <Link to="/contato" className="block px-4 py-2 text-sm hover:bg-muted">Fale Conosco</Link>
                <Link to="/contato#localizacao" className="block px-4 py-2 text-sm hover:bg-muted">Onde Estamos</Link>
              </div>
            </div>
          </div>

          {/* 7. Cadastro - COM dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1 hover:text-primary transition-colors">
              Cadastro
            </button>
            <div className="absolute top-full left-0 mt-2 hidden group-hover:block z-50">
              <div className="w-64 rounded-lg border bg-white shadow-lg py-2">
                <Link to="/sou-novo" className="block px-4 py-2 text-sm hover:bg-muted">Sou Novo</Link>
                <Link to="/auth" className="block px-4 py-2 text-sm hover:bg-muted">Entrar</Link>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default InstitutionalHeader;
