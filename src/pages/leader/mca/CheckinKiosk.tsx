import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Search, LogOut, Lock, Baby, Clock, X } from 'lucide-react';
import { format } from 'date-fns';
import { useMcaCheckin, todayStr } from '@/hooks/useMcaCheckin';
import type { McaCrianca } from '@/hooks/useMcaCheckin';

function getInitials(nome: string) {
  return nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

// ── Dialog de saída do modo quiosque (exige a senha do usuário logado) ────────

function ExitKioskDialog({ open, onClose, onExited }: { open: boolean; onClose: () => void; onExited: () => void }) {
  const { profile, signIn } = useAuth();
  const [password, setPassword] = useState('');
  const [checking, setChecking] = useState(false);

  const handleConfirm = async () => {
    if (!profile?.email || !password) return;
    setChecking(true);
    try {
      const { error } = await signIn(profile.email, password);
      if (error) {
        toast.error('Senha incorreta');
        return;
      }
      setPassword('');
      onExited();
    } finally {
      setChecking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setPassword(''); onClose(); } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Sair do modo quiosque
          </DialogTitle>
          <DialogDescription>
            Confirme sua senha para voltar à tela normal.
          </DialogDescription>
        </DialogHeader>
        <Input
          type="password"
          placeholder="Sua senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); }}
          autoFocus
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={checking}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={checking || !password}>
            {checking ? 'Verificando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Escolha de sala (quando a criança não tem sala padrão definida) ──────────

function SalaPickerDialog({
  crianca, salas, open, onClose, onConfirm, confirming,
}: {
  crianca: McaCrianca | null;
  salas: { id: string; nome: string }[];
  open: boolean;
  onClose: () => void;
  onConfirm: (salaId: string) => void;
  confirming: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Qual sala para {crianca?.nome}?</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          {salas.map((s) => (
            <Button
              key={s.id}
              variant="outline"
              className="h-16 text-lg"
              disabled={confirming}
              onClick={() => onConfirm(s.id)}
            >
              {s.nome}
            </Button>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={confirming}>Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Modo quiosque ──────────────────────────────────────────────────────────────

export default function CheckinKiosk() {
  const ctx = useOutletContext<{ ministerioId: string } | null>();
  const ministerioId = ctx?.ministerioId ?? '';
  const navigate = useNavigate();

  const [busca, setBusca] = useState('');
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [salaPickerCrianca, setSalaPickerCrianca] = useState<McaCrianca | null>(null);

  const {
    salas, criancasDisponiveis, presentes, checkinMutation, checkoutMutation,
  } = useMcaCheckin(ministerioId, todayStr());

  const buscaLower = busca.trim().toLowerCase();
  const resultados = buscaLower
    ? criancasDisponiveis.filter((c) => c.nome.toLowerCase().includes(buscaLower))
    : criancasDisponiveis;

  function handleTapCrianca(c: McaCrianca) {
    if (checkinMutation.isPending) return;
    if (c.sala_id) {
      checkinMutation.mutate({ salaId: c.sala_id, criancaId: c.id }, {
        onSuccess: () => setBusca(''),
      });
    } else if (salas.length === 1) {
      checkinMutation.mutate({ salaId: salas[0].id, criancaId: c.id }, {
        onSuccess: () => setBusca(''),
      });
    } else {
      setSalaPickerCrianca(c);
    }
  }

  function handleConfirmSala(salaId: string) {
    if (!salaPickerCrianca) return;
    checkinMutation.mutate({ salaId, criancaId: salaPickerCrianca.id }, {
      onSuccess: () => { setSalaPickerCrianca(null); setBusca(''); },
    });
  }

  return (
    <div className="fixed inset-0 z-[100] bg-neutral-50 flex flex-col">
      {/* Topbar do quiosque */}
      <header className="shrink-0 bg-promessa-800 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <Baby className="w-7 h-7" />
          <h1 className="text-2xl font-bold">Check-in Kids</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-bold leading-none">{presentes.length}</p>
            <p className="text-xs text-white/70">presentes agora</p>
          </div>
          <button
            aria-label="Sair do modo quiosque"
            onClick={() => setExitDialogOpen(true)}
            className="w-11 h-11 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Lock className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Busca */}
      <div className="shrink-0 px-6 py-5 bg-white border-b">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar criança pelo nome..."
            className="h-16 pl-14 text-xl rounded-2xl"
            autoFocus
          />
          {busca && (
            <button
              aria-label="Limpar busca"
              onClick={() => setBusca('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Conteúdo: disponíveis (check-in) + presentes (check-out) */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-neutral-700 mb-3">
              Toque para fazer check-in {busca && `— resultados para "${busca}"`}
            </h2>
            {resultados.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground text-lg">
                {busca ? 'Nenhuma criança encontrada.' : 'Todas as crianças já fizeram check-in.'}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {resultados.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleTapCrianca(c)}
                    disabled={checkinMutation.isPending}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-white border-2 border-neutral-200 hover:border-promessa-400 active:bg-promessa-50 transition-colors text-left disabled:opacity-50"
                  >
                    <Avatar className="w-14 h-14 shrink-0">
                      <AvatarImage src={c.foto_url ?? undefined} alt={c.nome} />
                      <AvatarFallback className="bg-promessa-100 text-promessa-700 text-lg font-semibold">
                        {getInitials(c.nome)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-lg font-medium text-neutral-900 truncate">{c.nome}</span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-700 mb-3">
              Presentes agora — toque para check-out
            </h2>
            {presentes.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground text-lg">
                Nenhuma criança presente no momento.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {presentes.map((ci) => (
                  <button
                    key={ci.id}
                    onClick={() => checkoutMutation.mutate(ci.id)}
                    disabled={checkoutMutation.isPending}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-promessa-50 border-2 border-promessa-200 hover:border-red-300 active:bg-red-50 transition-colors text-left disabled:opacity-50"
                  >
                    <Avatar className="w-12 h-12 shrink-0">
                      <AvatarFallback className="bg-promessa-200 text-promessa-800 font-semibold">
                        {getInitials(ci.mca_criancas?.nome ?? ci.observacao ?? '?')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-neutral-900 truncate">
                        {ci.mca_criancas?.nome ?? 'Visitante'}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(ci.checkin_at), 'HH:mm')}
                      </p>
                    </div>
                    <LogOut className="w-5 h-5 text-neutral-400 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <SalaPickerDialog
        crianca={salaPickerCrianca}
        salas={salas}
        open={!!salaPickerCrianca}
        onClose={() => setSalaPickerCrianca(null)}
        onConfirm={handleConfirmSala}
        confirming={checkinMutation.isPending}
      />

      <ExitKioskDialog
        open={exitDialogOpen}
        onClose={() => setExitDialogOpen(false)}
        onExited={() => navigate('..')}
      />
    </div>
  );
}
