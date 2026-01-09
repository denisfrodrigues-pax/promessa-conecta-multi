import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { InstitutionalHeader } from '@/components/layout/InstitutionalHeader';
import { ContribuicaoForm } from '@/components/contribuicao/ContribuicaoForm';

export default function Contribuicoes() {
  const { user, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const origem = searchParams.get('origem');
  
  // Determine back URL based on auth state and origin
  const getBackUrl = () => {
    if (!user) return '/';
    if (origem === 'contribuicoes') return '/app/minhas-contribuicoes';
    return '/app';
  };
  
  const backUrl = getBackUrl();
  const backLabel = user ? 'Voltar' : 'Voltar para a Home';

  return (
    <div className="min-h-screen bg-background">
      <InstitutionalHeader />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-8 bg-gradient-to-b from-primary/5 to-background">
        {/* Content handled by ContribuicaoForm header */}
      </section>

      {/* Main Content */}
      <main>
        <ContribuicaoForm
          origem="publica"
          backUrl={backUrl}
          backLabel={backLabel}
          showHeader={true}
          profileId={profile?.id}
          profileNome={profile?.nome}
          profileEmail={profile?.email}
        />
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-muted/30">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Igreja Adventista da Promessa de Hortolândia. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
