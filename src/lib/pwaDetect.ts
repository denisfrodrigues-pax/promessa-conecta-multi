// Funções puras de detecção de plataforma/estado pro fluxo de instalação do
// PWA no iOS (PWAInstallBanner). Em arquivo separado do componente só por
// causa do lint react-refresh/only-export-components (exportar função ao
// lado de componente quebra o fast refresh) — sem isso elas moravam ali.

// Navegadores embutidos (Instagram/Facebook/WhatsApp/Line/TikTok/WeChat/Twitter)
// não suportam "Adicionar à Tela de Início" no iOS — só o Safari de verdade
// suporta esse fluxo. Lista conservadora de propósito: na dúvida (token não
// reconhecido, ex. Chrome/Firefox para iOS), trata como Safari e mostra a
// instrução normal, em vez de arriscar um falso positivo.
const EMBEDDED_BROWSER_RE = /FBAN|FBAV|Instagram|Line\/|MicroMessenger|TikTok|BytedanceWebview|Twitter/i;

/** iPhone/iPod/iPad clássicos, ou iPadOS 13+, que se anuncia como "Macintosh"
 *  no userAgent — maxTouchPoints > 1 é o jeito de distinguir isso de um Mac
 *  de verdade (sem touch), que também contém "Macintosh". */
export function isIOS(userAgent: string, maxTouchPoints: number): boolean {
  if (/iPhone|iPod|iPad/.test(userAgent)) return true;
  return userAgent.includes('Macintosh') && maxTouchPoints > 1;
}

export function isEmbeddedBrowser(userAgent: string): boolean {
  return EMBEDDED_BROWSER_RE.test(userAgent);
}

/** App já instalado/aberto em modo standalone: navigator.standalone (iOS) ou
 *  a media query display-mode (iOS 17+ e demais plataformas). */
export function isStandaloneDisplay(navigatorStandalone: boolean | undefined, matchesStandaloneMedia: boolean): boolean {
  return navigatorStandalone === true || matchesStandaloneMedia;
}
