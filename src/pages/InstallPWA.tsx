import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { Download, Smartphone, Monitor, CheckCircle, ArrowLeft, Share, MoreVertical } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if running as installed PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(isStandalone);

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-display">App Instalado!</CardTitle>
            <CardDescription>
              O app já está instalado no seu dispositivo. 
              Você pode acessá-lo pela tela inicial.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/home')} className="w-full">
              Ir para o App
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-hero text-white p-6">
        <Button 
          variant="ghost" 
          className="text-white/80 hover:text-white hover:bg-white/10 -ml-2 mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="flex items-center gap-4">
          <Logo size={50} />
          <div>
            <h1 className="text-2xl font-display font-bold">Instalar App</h1>
            <p className="text-white/70">Igreja da Promessa</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-md mx-auto">
        {/* Benefits */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              Por que instalar?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Acesso Rápido</p>
                <p className="text-sm text-muted-foreground">Abra direto da tela inicial, sem precisar do navegador</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Monitor className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Tela Cheia</p>
                <p className="text-sm text-muted-foreground">Experiência imersiva sem barras do navegador</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Carregamento Rápido</p>
                <p className="text-sm text-muted-foreground">Recursos salvos para acesso mais rápido</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Install Instructions */}
        {deferredPrompt ? (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="text-lg font-display">Instalar Agora</CardTitle>
              <CardDescription>
                Clique no botão abaixo para instalar o app
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleInstallClick} className="w-full" size="lg">
                <Download className="w-5 h-5 mr-2" />
                Instalar App
              </Button>
            </CardContent>
          </Card>
        ) : isIOS ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Share className="w-5 h-5" />
                Como instalar no iPhone/iPad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  1
                </div>
                <p className="text-sm">
                  Toque no ícone <Share className="w-4 h-4 inline mx-1" /> <strong>Compartilhar</strong> na barra inferior do Safari
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  2
                </div>
                <p className="text-sm">
                  Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  3
                </div>
                <p className="text-sm">
                  Toque em <strong>"Adicionar"</strong> no canto superior direito
                </p>
              </div>
            </CardContent>
          </Card>
        ) : isAndroid ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <MoreVertical className="w-5 h-5" />
                Como instalar no Android
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  1
                </div>
                <p className="text-sm">
                  Toque no menu <MoreVertical className="w-4 h-4 inline mx-1" /> no canto superior direito do Chrome
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  2
                </div>
                <p className="text-sm">
                  Toque em <strong>"Instalar app"</strong> ou <strong>"Adicionar à tela inicial"</strong>
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  3
                </div>
                <p className="text-sm">
                  Confirme tocando em <strong>"Instalar"</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display">Como instalar no Desktop</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  1
                </div>
                <p className="text-sm">
                  Procure o ícone de instalação <Download className="w-4 h-4 inline mx-1" /> na barra de endereços
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  2
                </div>
                <p className="text-sm">
                  Clique em <strong>"Instalar"</strong> quando solicitado
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Continue without installing */}
        <div className="text-center">
          <Button variant="ghost" onClick={() => navigate('/auth')}>
            Continuar no navegador
          </Button>
        </div>
      </div>
    </div>
  );
}