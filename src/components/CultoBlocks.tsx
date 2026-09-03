/**
 * Componentes compartilhados para blocos de configuração de cultos/encontros.
 * Definidos fora do render de qualquer componente pai para evitar perda de foco
 * nos inputs quando o estado do pai atualiza.
 *
 * O nome exibido para cada encontro (Culto, Escola Bíblica, Pequenos Grupos)
 * vem de nome_modulo_culto/nome_modulo_escola_biblica/nome_modulo_pequenos_grupos
 * (aba Módulos) — fonte única, usada tanto no menu de navegação quanto nos
 * cards públicos. Estes blocos só cuidam de dia/horário/descrição/ativo.
 */
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

export const DIAS_SEMANA = [
  { value: 'domingo',  label: 'Domingo' },
  { value: 'segunda',  label: 'Segunda-feira' },
  { value: 'terca',    label: 'Terça-feira' },
  { value: 'quarta',   label: 'Quarta-feira' },
  { value: 'quinta',   label: 'Quinta-feira' },
  { value: 'sexta',    label: 'Sexta-feira' },
  { value: 'sabado',   label: 'Sábado' },
];

export interface CultoBlock   { ativo: boolean; dia: string; horario: string; }
export interface PgBlock       { ativo: boolean; descricao: string; }
export interface CultosConfig {
  culto_principal: CultoBlock;
  escola_biblica:  CultoBlock;
  pequenos_grupos: PgBlock;
}

export const DEFAULT_CULTOS_CONFIG: CultosConfig = {
  culto_principal: { ativo: true, dia: 'sabado', horario: '19:00' },
  escola_biblica:  { ativo: true, dia: 'sabado', horario: '18:00' },
  pequenos_grupos: { ativo: true, descricao: 'Durante a semana' },
};

/**
 * Garante um CultosConfig completo a partir do valor bruto vindo do banco.
 * igrejas.cultos_config tem default '{}'::jsonb (não null) — uma igreja nova
 * (ex.: criada via Onboarding.tsx, que não popula essa coluna no insert) chega
 * aqui como objeto vazio. Um simples `?? DEFAULT_CULTOS_CONFIG` não pega esse
 * caso (só cobre null/undefined), então os blocos abaixo recebiam
 * culto_principal/escola_biblica/pequenos_grupos undefined e quebravam ao ler
 * .ativo/.dia/.horario/.descricao. Preenche por chave (e por campo dentro de
 * cada chave), preservando o que já existir.
 */
export function normalizeCultosConfig(raw: unknown): CultosConfig {
  const r = (raw && typeof raw === 'object' && !Array.isArray(raw)) ? raw as Partial<CultosConfig> : {};
  return {
    culto_principal: { ...DEFAULT_CULTOS_CONFIG.culto_principal, ...(r.culto_principal ?? {}) },
    escola_biblica:  { ...DEFAULT_CULTOS_CONFIG.escola_biblica,  ...(r.escola_biblica  ?? {}) },
    pequenos_grupos: { ...DEFAULT_CULTOS_CONFIG.pequenos_grupos, ...(r.pequenos_grupos ?? {}) },
  };
}

// ─── CultoToggleBlock ─────────────────────────────────────────────────────────

interface CultoToggleBlockProps {
  title: string;
  ativo: boolean;
  onToggle: (v: boolean) => void;
  children: React.ReactNode;
}

export function CultoToggleBlock({ title, ativo, onToggle, children }: CultoToggleBlockProps) {
  return (
    <div className={`border rounded-xl p-4 transition-all ${ativo ? 'border-emerald-300 bg-emerald-50/50' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-sm text-gray-700">{title}</span>
        <Switch checked={ativo} onCheckedChange={onToggle} />
      </div>
      {ativo && <div className="space-y-3">{children}</div>}
    </div>
  );
}

// ─── CultoDescInput ───────────────────────────────────────────────────────────

export function CultoDescInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);
  return <Input value={local} onChange={e => setLocal(e.target.value)} onBlur={() => onChange(local)} placeholder={placeholder} />;
}

// ─── Bloco completo pronto para renderizar ────────────────────────────────────

interface CultoPrincipalBlockProps {
  config: CultoBlock | undefined;
  /** Nome exibido — vem de nome_modulo_culto/nome_modulo_escola_biblica (aba Módulos). Só leitura aqui. */
  nome: string;
  onChange: (field: string, value: unknown) => void;
}

export function CultoPrincipalBlock({ config, nome, onChange }: CultoPrincipalBlockProps) {
  // Guarda em runtime além do tipo: config pode chegar undefined se algum
  // chamador ainda não passar por normalizeCultosConfig (ex.: dado legado
  // vindo de `as any`, que o TypeScript não pega em tempo de compilação).
  const safe = config ?? DEFAULT_CULTOS_CONFIG.culto_principal;
  return (
    <CultoToggleBlock title={nome} ativo={safe.ativo} onToggle={v => onChange('ativo', v)}>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label className="text-xs">Dia da semana</Label>
          <Select value={safe.dia} onValueChange={v => onChange('dia', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{DIAS_SEMANA.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">Horário</Label>
          <Input type="time" value={safe.horario} onChange={e => onChange('horario', e.target.value)} />
        </div>
      </div>
    </CultoToggleBlock>
  );
}

export function EscolaBiblicaBlock({ config, nome, onChange }: CultoPrincipalBlockProps) {
  const safe = config ?? DEFAULT_CULTOS_CONFIG.escola_biblica;
  return (
    <CultoToggleBlock title={nome} ativo={safe.ativo} onToggle={v => onChange('ativo', v)}>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label className="text-xs">Dia da semana</Label>
          <Select value={safe.dia} onValueChange={v => onChange('dia', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{DIAS_SEMANA.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">Horário</Label>
          <Input type="time" value={safe.horario} onChange={e => onChange('horario', e.target.value)} />
        </div>
      </div>
    </CultoToggleBlock>
  );
}

interface PgBlockProps {
  config: PgBlock | undefined;
  /** Nome exibido — vem de nome_modulo_pequenos_grupos (aba Módulos). Só leitura aqui. */
  nome: string;
  onChange: (field: string, value: unknown) => void;
}

export function PequenosGruposBlock({ config, nome, onChange }: PgBlockProps) {
  const safe = config ?? DEFAULT_CULTOS_CONFIG.pequenos_grupos;
  return (
    <CultoToggleBlock title={nome} ativo={safe.ativo} onToggle={v => onChange('ativo', v)}>
      <div className="space-y-1"><Label className="text-xs">Descrição</Label>
        <CultoDescInput value={safe.descricao} onChange={v => onChange('descricao', v)} placeholder="Ex: Durante a semana" />
      </div>
    </CultoToggleBlock>
  );
}
