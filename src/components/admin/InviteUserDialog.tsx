import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Mail } from 'lucide-react';

// Mesmo conjunto de papéis atribuíveis por um admin comum na Edge Function
// invite-admin (ADMIN_ASSIGNABLE_ROLES) e em ROLE_OPTIONS (admin/Usuarios.tsx)
// — 'superadmin' nunca aparece aqui, em nenhuma das duas listas.
const INVITE_ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'lider', label: 'Líder' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'voluntario', label: 'Voluntário' },
  { value: 'membro', label: 'Membro' },
];

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  churchId: string;
  defaultEmail?: string;
  defaultNome?: string;
  defaultRole?: string;
  onInvited?: () => void;
}

export function InviteUserDialog({
  open, onOpenChange, churchId, defaultEmail = '', defaultNome = '', defaultRole = 'admin', onInvited,
}: InviteUserDialogProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [nome, setNome] = useState(defaultNome);
  const [role, setRole] = useState(defaultRole);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      setEmail(defaultEmail);
      setNome(defaultNome);
      setRole(defaultRole);
    }
  }, [open, defaultEmail, defaultNome, defaultRole]);

  const handleInvite = async () => {
    if (!email.trim() || !nome.trim()) {
      toast.error('Preencha nome e e-mail');
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-admin', {
        body: {
          email: email.trim(),
          nome: nome.trim(),
          church_id: churchId,
          role,
          redirectTo: `${window.location.origin}/reset-password`,
        },
      });

      if (error) {
        let message = error.message;
        try {
          const body = await error.context?.json();
          if (body?.error) message = body.error;
        } catch {
          // resposta sem corpo JSON legível — mantém a mensagem genérica
        }
        throw new Error(message);
      }
      if (data?.error) throw new Error(data.error);

      toast.success(`Convite enviado para ${email.trim()}`);
      onOpenChange(false);
      onInvited?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao convidar usuário');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !sending && onOpenChange(v)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Convidar Usuário
          </DialogTitle>
          <DialogDescription>
            Envia um e-mail de convite para o usuário definir a própria senha e acessar o sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-nome">Nome</Label>
            <Input
              id="invite-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome completo"
              disabled={sending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-email">E-mail</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              disabled={sending}
            />
          </div>
          <div className="space-y-2">
            <Label>Papel</Label>
            <Select value={role} onValueChange={setRole} disabled={sending}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {INVITE_ROLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancelar
          </Button>
          <Button onClick={handleInvite} disabled={sending}>
            {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
            {sending ? 'Enviando...' : 'Enviar Convite'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default InviteUserDialog;
