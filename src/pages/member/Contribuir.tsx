import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HandHeart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ContribuicaoForm } from '@/components/contribuicao/ContribuicaoForm';

export default function Contribuir() {
  const { profile } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="icon">
              <Link to="/app/contribuicoes">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <HandHeart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold">Nova Contribuição</h1>
                <p className="text-sm text-muted-foreground">
                  Registre sua oferta ou dízimo
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <main className="py-8">
        <ContribuicaoForm
          origem="app"
          backUrl="/app/contribuicoes"
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
