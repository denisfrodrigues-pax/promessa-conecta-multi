import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function LeaderEntry() {
  const { myMinistries, myMinistriesLoading, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || myMinistriesLoading) return;

    const led = myMinistries.filter(m => m.papel === 'lider');

    if (led.length === 0) {
      navigate('/app', { replace: true });
    } else if (led.length === 1 && led[0].slug) {
      navigate(`/ministerio/${led[0].slug}`, { replace: true });
    } else {
      navigate('/voluntario', { replace: true });
    }
  }, [loading, myMinistriesLoading, myMinistries, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
