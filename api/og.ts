import { ImageResponse } from '@vercel/og';
import { createElement } from 'react';

export const config = {
  runtime: 'nodejs',
};

const FALLBACK_NOME = 'Rede Conect';
const FALLBACK_COR = '#1e3a5f';

// Formato real do request neste runtime, confirmado via log de produção
// (TypeError: request.headers.get is not a function): diferente da Routing
// Middleware (middleware.ts), que sempre usa a Web Fetch API completa, uma
// Vercel Function em runtime nodejs (fora de Next.js) recebe um objeto no
// estilo Node clássico — headers é um objeto simples (chaves em minúsculo,
// valor string ou string[] pra headers repetidos), sem os métodos de
// Headers do padrão Web. request.url também vem como caminho relativo
// (mesmo comportamento de http.IncomingMessage.url).
type NodeStyleRequest = {
  url: string;
  headers: Record<string, string | string[] | undefined>;
};

function headerValue(headers: NodeStyleRequest['headers'], name: string): string | undefined {
  const value = headers[name];
  return Array.isArray(value) ? value[0] : value;
}

function resolveRequestUrl(request: NodeStyleRequest): URL {
  const host =
    headerValue(request.headers, 'host') ?? headerValue(request.headers, 'x-forwarded-host') ?? 'promessa-conecta-multi.vercel.app';
  const proto = headerValue(request.headers, 'x-forwarded-proto') ?? 'https';
  return new URL(request.url, `${proto}://${host}`);
}

export default async function handler(request: NodeStyleRequest) {
  const { searchParams } = resolveRequestUrl(request);
  const nome = (searchParams.get('nome') || FALLBACK_NOME).slice(0, 60);
  const cor = /^#[0-9a-fA-F]{6}$/.test(searchParams.get('cor') || '') ? searchParams.get('cor')! : FALLBACK_COR;

  return new ImageResponse(
    createElement(
      'div',
      {
        style: {
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: cor,
          fontFamily: 'sans-serif',
        },
      },
      createElement(
        'div',
        {
          style: {
            display: 'flex',
            fontSize: 72,
            fontWeight: 700,
            color: '#ffffff',
            textAlign: 'center',
            padding: '0 80px',
            lineHeight: 1.2,
          },
        },
        nome
      ),
      createElement(
        'div',
        {
          style: {
            display: 'flex',
            fontSize: 28,
            color: 'rgba(255,255,255,0.85)',
            marginTop: 24,
          },
        },
        'Rede Conect'
      )
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
