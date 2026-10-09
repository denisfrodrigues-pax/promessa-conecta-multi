import { Navigate, Outlet, useOutletContext, useParams } from 'react-router-dom';
import { useIgrejaSlug } from '@/contexts/IgrejaSlugContext';

interface VolunteerOutletCtx {
  ministerioId: string;
  ministerioNome: string;
  papel: string;
  minhasPermissoes: string[];
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
  const pode = (ctx.minhasPermissoes ?? []).includes(permission);

  if (!pode) return <Navigate to={p(`/volunteer/${slug}`)} replace />;

  return <Outlet context={ctx} />;
}
