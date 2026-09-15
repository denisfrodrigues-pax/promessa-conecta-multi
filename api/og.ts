import { ImageResponse } from '@vercel/og';
import { createElement } from 'react';

export const config = {
  runtime: 'nodejs',
};

const FALLBACK_NOME = 'Rede Conect';
const FALLBACK_COR = '#1e3a5f';

function resolveRequestUrl(request: Request): URL {
  // No runtime nodejs (fora de Next.js), request.url pode vir como caminho
  // relativo (ex: "/api/og?nome=...") em vez de absoluto — ao contrário do
  // runtime edge, que sempre entrega uma URL completa. new URL() exige uma
  // base explícita nesse caso; se request.url já for absoluta, a base é
  // simplesmente ignorada (comportamento padrão da própria API URL).
  const host = request.headers.get('host') ?? request.headers.get('x-forwarded-host') ?? 'promessa-conecta-multi.vercel.app';
  const proto = request.headers.get('x-forwarded-proto') ?? 'https';
  return new URL(request.url, `${proto}://${host}`);
}

export default async function handler(request: Request) {
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
