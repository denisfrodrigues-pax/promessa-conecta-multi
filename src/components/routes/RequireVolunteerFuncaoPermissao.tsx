import { Navigate, Outlet, useOutletContext, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useIgrejaSlug } from '@/contexts/IgrejaSlugContext';

interface VolunteerOutletCtx {
  ministerioId: string;
  ministerioNome: string;
  papel: string;
  minhasPermissoes: string[];
  permissoesCarregadas: boolean;
}

/**
 * Guarda de rota pra filhas de /volunteer/:slug que exigem uma permissão de
 * função específica (ex.: mca.checkin.qualquer_sala) — não o papel. Checa só
 * a permissão (minhasPermissoes vem de get_my_funcao_permissoes, calculado em
 * VolunteerMinisterioLayout), sem bypass por papel líder/admin: quem lidera
 * um ministério já usa a rota de líder (/leader/:slug/...) pra isso; esta
 * rota é especificamente o atalho do voluntário com função.
 *
 * Sem a permissão → volta pro painel do voluntário (índice de /volunteer/:slug),
 * sem chegar a renderizar a tela.
 */
export default function RequireVolunteerFuncaoPermissao({ permission }: { permission: string }) {
  const ctx = useOutletContext<VolunteerOutletCtx>();
  const { p } = useIgrejaSlug();
  const { slug } = useParams<{ slug: string }>();

  // Enquanto minhasPermissoes ainda não carregou (RPC assíncrona em
  // VolunteerMinisterioLayout), nem permite nem redireciona — faria isso com
  // o estado inicial [] antes da resposta chegar (ex.: entrar direto em
  // /volunteer/mca/checkin por link, F5 ou reload do quiosque num tablet).
  // Mesmo spinner do layout, pra não trocar de visual no meio da navegação.
  if (!ctx.permissoesCarregadas) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const pode = (ctx.minhasPermissoes ?? []).includes(permission);
  if (!pode) return <Navigate to={p(`/volunteer/${slug}`)} replace />;

  return <Outlet context={ctx} />;
}
