/**
 * Componentes compartilhados para blocos de configuração de cultos/encontros.
 * Definidos fora do render de qualquer componente pai para evitar perda de foco
 * nos inputs quando o estado do pai atualiza.
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

export interface CultoBlock   { ativo: boolean; nome: string; dia: string; horario: string; }
export interface PgBlock       { ativo: boolean; nome: string; descricao: string; }
export interface CultosConfig {
  culto_principal: CultoBlock;
  escola_biblica:  CultoBlock;
  pequenos_grupos: PgBlock;
}

export const DEFAULT_CULTOS_CONFIG: CultosConfig = {
  culto_principal: { ativo: true, nome: 'Culto de Celebração', dia: 'sabado', horario: '19:00' },
  escola_biblica:  { ativo: true, nome: 'Escola Bíblica',      dia: 'sabado', horario: '18:00' },
  pequenos_grupos: { ativo: true, nome: 'Pequenos Grupos',     descricao: 'Durante a semana' },
};

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

// ─── CultoNameInput (local state → sync onBlur, sem re-render do pai) ─────────

export function CultoNameInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);
  return <Input value={local} onChange={e => setLocal(e.target.value)} onBlur={() => onChange(local)} />;
}

// ─── CultoDescInput ───────────────────────────────────────────────────────────

export function CultoDescInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);
  return <Input value={local} onChange={e => setLocal(e.target.value)} onBlur={() => onChange(local)} placeholder={placeholder} />;
}

// ─── Bloco completo pronto para renderizar ────────────────────────────────────

interface CultoPrincipalBlockProps {
  config: CultoBlock;
  onChange: (field: string, value: unknown) => void;
}

export function CultoPrincipalBlock({ config, onChange }: CultoPrincipalBlockProps) {
  return (
    <CultoToggleBlock title="Culto Principal" ativo={config.ativo} onToggle={v => onChange('ativo', v)}>
      <div className="space-y-1"><Label className="text-xs">Nome</Label>
        <CultoNameInput value={config.nome} onChange={v => onChange('nome', v)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label className="text-xs">Dia da semana</Label>
          <Select value={config.dia} onValueChange={v => onChange('dia', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{DIAS_SEMANA.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">Horário</Label>
          <Input type="time" value={config.horario} onChange={e => onChange('horario', e.target.value)} />
        </div>
      </div>
    </CultoToggleBlock>
  );
}

export function EscolaBiblicaBlock({ config, onChange }: CultoPrincipalBlockProps) {
  return (
    <CultoToggleBlock title="Escola Bíblica" ativo={config.ativo} onToggle={v => onChange('ativo', v)}>
      <div className="space-y-1"><Label className="text-xs">Nome</Label>
        <CultoNameInput value={config.nome} onChange={v => onChange('nome', v)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label className="text-xs">Dia da semana</Label>
          <Select value={config.dia} onValueChange={v => onChange('dia', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{DIAS_SEMANA.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">Horário</Label>
          <Input type="time" value={config.horario} onChange={e => onChange('horario', e.target.value)} />
        </div>
      </div>
    </CultoToggleBlock>
  );
}

interface PgBlockProps { config: PgBlock; onChange: (field: string, value: unknown) => void; }

export function PequenosGruposBlock({ config, onChange }: PgBlockProps) {
  return (
    <CultoToggleBlock title="Pequenos Grupos" ativo={config.ativo} onToggle={v => onChange('ativo', v)}>
      <div className="space-y-1"><Label className="text-xs">Nome</Label>
        <CultoNameInput value={config.nome} onChange={v => onChange('nome', v)} />
      </div>
      <div className="space-y-1"><Label className="text-xs">Descrição</Label>
        <CultoDescInput value={config.descricao} onChange={v => onChange('descricao', v)} placeholder="Ex: Durante a semana" />
      </div>
    </CultoToggleBlock>
  );
}
