import { Component, ErrorInfo, ReactNode } from "react";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Todas as páginas são carregadas via lazy()/code-splitting (App.tsx) — se o
// chunk de uma rota específica não está no cache do navegador e a rede falha
// (app reaberto sem internet, por exemplo), o import() rejeita com uma dessas
// mensagens dependendo do browser. Sem tratar isso à parte, quem só está sem
// conexão via um "Algo deu errado" com stack trace, como se fosse bug do app.
function isOfflineChunkError(error: Error): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  return /dynamically imported module|Importing a module script failed|Failed to fetch/i.test(
    error.message,
  );
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.state.error && isOfflineChunkError(this.state.error)) {
        return (
          <div className="min-h-screen flex items-center justify-center p-8 bg-background">
            <div className="max-w-md w-full text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <WifiOff className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-xl font-bold">Sem conexão</h1>
              <p className="text-sm text-muted-foreground">
                Não foi possível carregar esta página. Verifique sua internet e tente novamente.
              </p>
              <Button onClick={() => window.location.reload()}>
                Tentar novamente
              </Button>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-background">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-xl font-bold">Algo deu errado</h1>
            <p className="text-sm text-muted-foreground">
              Ocorreu um erro inesperado. Você pode tentar recarregar a página.
            </p>
            {this.state.error && (
              <p className="text-xs text-muted-foreground font-mono bg-muted rounded p-2 text-left break-all">
                {this.state.error.message}
              </p>
            )}
            <Button onClick={() => window.location.reload()}>
              Recarregar página
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
