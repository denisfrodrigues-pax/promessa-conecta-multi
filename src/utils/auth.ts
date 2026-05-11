import { supabase } from '@/integrations/supabase/client';

export async function getEmailByCPF(cpf: string): Promise<string | null> {
  const cpfLimpo = cpf.replace(/\D/g, '');
  const { data, error } = await (supabase as any)
    .from('profiles')
    .select('email')
    .eq('cpf', cpfLimpo)
    .maybeSingle();

  if (error || !data) return null;
  return (data.email as string) ?? null;
}
