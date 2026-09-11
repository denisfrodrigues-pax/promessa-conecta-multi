import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HandHeart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ContribuicaoForm } from '@/components/contribuicao/ContribuicaoForm';
import { useIgrejaSlug } from '@/contexts/IgrejaSlugContext';

export default function Contribuir() {
  const { profile } = useAuth();
  const { p } = useIgrejaSlug();

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="border-b border-stone-200 bg-gradient-to-b from-primary/5 to-stone-50">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]">
              <Link to={p('/app/contribuicoes')} aria-label="Voltar">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <HandHeart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-stone-900">Nova Contribuição</h1>
                <p className="text-sm text-stone-500 leading-relaxed">
                  Registre sua oferta ou dízimo
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <main className="py-8 md:py-12">
        <ContribuicaoForm
          origem="app"
          backUrl={p('/app/contribuicoes')}
          backLabel="Voltar para Contribuições"
          showHeader={false}
          profileId={profile?.id}
          profileNome={profile?.nome}
          profileEmail={profile?.email}
        />
      </main>
    </div>
  );
}
