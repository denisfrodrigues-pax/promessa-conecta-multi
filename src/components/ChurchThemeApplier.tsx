import { useEffect } from 'react';
import { useIgrejaConfig } from '@/hooks/useIgrejaConfig';
import { applyChurchTheme } from '@/lib/churchTheme';

/**
 * Componente nulo que aplica as CSS variables da igreja do usuário logado
 * no <html>. Deve ficar dentro do AuthProvider.
 *
 * Atualiza automaticamente todas as classes `text-promessa-*`, `bg-promessa-*`
 * e também expõe `--color-primary-hex` para uso inline.
 *
 * Cobre as rotas autenticadas. Para páginas públicas de /i/:slug/* sem login
 * (ex.: site institucional, tela de login), quem aplica o tema por igreja é
 * IgrejaSlugContext.tsx, que resolve a igreja pelo slug da URL em vez da
 * sessão do usuário — usando a mesma função applyChurchTheme.
 */
export function ChurchThemeApplier() {
  const { config, loading } = useIgrejaConfig();

  useEffect(() => {
    if (loading) return;
    applyChurchTheme(config.cor_primaria, config.cor_secundaria);
  }, [config.cor_primaria, config.cor_secundaria, loading]);

  return null;
}
