import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

const FALLBACK_NOME = 'Rede Conect';
const FALLBACK_COR = '#1e3a5f';

export default async function handler(request: Request) {
  const { searchParams } = new URL(request.url);
  const nome = (searchParams.get('nome') || FALLBACK_NOME).slice(0, 60);
  const cor = /^#[0-9a-fA-F]{6}$/.test(searchParams.get('cor') || '') ? searchParams.get('cor')! : FALLBACK_COR;

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: cor,
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 72,
            fontWeight: 700,
            color: '#ffffff',
            textAlign: 'center',
            padding: '0 80px',
            lineHeight: 1.2,
          }}
        >
          {nome}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 28,
            color: 'rgba(255,255,255,0.85)',
            marginTop: 24,
          }}
        >
          Rede Conect
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
