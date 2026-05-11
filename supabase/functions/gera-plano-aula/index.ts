import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.27.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const { titulo, turma_nome, data_aula, secao, tipo } = await req.json();
  const isKids = tipo === 'kids';

  const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

  const ctx = [
    titulo && `Título: ${titulo}`,
    turma_nome && (isKids ? `Sala: ${turma_nome}` : `Turma: ${turma_nome}`),
    data_aula && `Data: ${data_aula}`,
  ].filter(Boolean).join('\n');

  const persona = isKids
    ? 'Você é um assistente para professores do ministério infantil/kids de uma igreja. Crie conteúdo bíblico lúdico, envolvente e adequado para crianças, com dinâmicas, ilustrações e linguagem simples.'
    : 'Você é um assistente para professores de cursos bíblicos para adultos. Crie conteúdo teológico claro, profundo e aplicável.';

  let prompt: string;
  if (secao === 'completo') {
    prompt = `${persona} Com base nas informações abaixo, gere um plano de aula completo em português brasileiro.\n\n${ctx}\n\nResponda SOMENTE com um JSON válido:\n{"objetivos": "texto dos objetivos", "conteudo": "texto do conteúdo", "anotacoes": "texto das anotações e observações"}`;
  } else if (secao === 'objetivos') {
    prompt = `${persona} Com base nas informações abaixo, gere os objetivos de aprendizagem da aula em português brasileiro (3 a 5 objetivos em formato de lista).\n\n${ctx}\n\nResponda apenas com o texto dos objetivos, sem JSON.`;
  } else {
    prompt = `${persona} Com base nas informações abaixo, gere o conteúdo da aula em português brasileiro (tópicos, subtópicos e explicações).\n\n${ctx}\n\nResponda apenas com o texto do conteúdo, sem JSON.`;
  }

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = (message.content[0] as { type: string; text: string }).text.trim();

  let body: object;
  if (secao === 'completo') {
    try {
      const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      body = JSON.parse(clean);
    } catch {
      body = { objetivos: text, conteudo: '', anotacoes: '' };
    }
  } else {
    body = { text };
  }

  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
