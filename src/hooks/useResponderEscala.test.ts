import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useResponderEscala, getMinhaConfirmacaoInfo } from './useResponderEscala';

const { updateMock, eqMock } = vi.hoisted(() => ({
  updateMock: vi.fn(),
  eqMock: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: () => ({ update: updateMock }) },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { toast } from 'sonner';

function mockUpdateResult(result: { error: unknown }) {
  eqMock.mockResolvedValue(result);
  updateMock.mockReturnValue({ eq: eqMock });
}

describe('getMinhaConfirmacaoInfo', () => {
  const voluntarios = [
    { voluntario_id: 'eu', status: 'pendente' },
    { voluntario_id: 'outro', status: 'pendente' },
  ];

  it('botões só aparecem pra linha do próprio usuário: não encontra outro voluntário como "minha" entrada', () => {
    const { myEntry, podeResponder } = getMinhaConfirmacaoInfo(voluntarios, 'outro', '2099-01-01');
    expect(myEntry?.voluntario_id).toBe('outro');
    // é "minha" confirmação do ponto de vista de quem está logado como 'outro' — mas
    // nunca retorna a entrada de um TERCEIRO: confirma que o match é estritamente por id.
    const semMatch = getMinhaConfirmacaoInfo(voluntarios, 'ninguem-com-esse-id', '2099-01-01');
    expect(semMatch.myEntry).toBeNull();
    expect(semMatch.podeResponder).toBe(false);
  });

  it('só habilita resposta quando o status é pendente', () => {
    const confirmado = [{ voluntario_id: 'eu', status: 'confirmado' }];
    const { podeResponder } = getMinhaConfirmacaoInfo(confirmado, 'eu', '2099-01-01');
    expect(podeResponder).toBe(false);
  });

  it('data no passado desabilita resposta mesmo com status pendente', () => {
    const { podeResponder } = getMinhaConfirmacaoInfo(voluntarios, 'eu', '2000-01-01');
    expect(podeResponder).toBe(false);
  });

  it('data futura com status pendente habilita resposta', () => {
    const { podeResponder } = getMinhaConfirmacaoInfo(voluntarios, 'eu', '2099-01-01');
    expect(podeResponder).toBe(true);
  });
});

describe('useResponderEscala', () => {
  beforeEach(() => {
    updateMock.mockReset();
    eqMock.mockReset();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('confirmar envia status "confirmado" + confirmado_em e chama onResponded', async () => {
    mockUpdateResult({ error: null });
    const onResponded = vi.fn();
    const { result } = renderHook(() => useResponderEscala({ onResponded }));

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.confirmar('escala-1');
    });

    expect(ok).toBe(true);
    expect(updateMock).toHaveBeenCalledTimes(1);
    const payload = updateMock.mock.calls[0][0];
    expect(payload.status).toBe('confirmado');
    expect(typeof payload.confirmado_em).toBe('string');
    expect(eqMock).toHaveBeenCalledWith('id', 'escala-1');
    expect(toast.success).toHaveBeenCalledWith('Escala confirmada com sucesso!');
    expect(onResponded).toHaveBeenCalledTimes(1);
  });

  it('recusar sem justificativa não envia nada e avisa', async () => {
    const onResponded = vi.fn();
    const { result } = renderHook(() => useResponderEscala({ onResponded }));

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.recusar('escala-1', '   ');
    });

    expect(ok).toBe(false);
    expect(updateMock).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Informe uma justificativa');
    expect(onResponded).not.toHaveBeenCalled();
  });

  it('recusar com justificativa envia status "ausente" + a justificativa + confirmado_em', async () => {
    mockUpdateResult({ error: null });
    const onResponded = vi.fn();
    const { result } = renderHook(() => useResponderEscala({ onResponded }));

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.recusar('escala-1', 'Vou viajar nesse fim de semana');
    });

    expect(ok).toBe(true);
    const payload = updateMock.mock.calls[0][0];
    expect(payload).toMatchObject({ status: 'ausente', justificativa: 'Vou viajar nesse fim de semana' });
    expect(typeof payload.confirmado_em).toBe('string');
    expect(toast.success).toHaveBeenCalledWith('Resposta registrada');
    expect(onResponded).toHaveBeenCalledTimes(1);
  });

  it('erro do Supabase (ex.: RLS) ao confirmar: mostra toast de erro, devolve false e não quebra', async () => {
    mockUpdateResult({ error: { message: 'new row violates row-level security policy' } });
    const onResponded = vi.fn();
    const { result } = renderHook(() => useResponderEscala({ onResponded }));

    let ok: boolean | undefined;
    await expect(
      act(async () => {
        ok = await result.current.confirmar('escala-1');
      })
    ).resolves.not.toThrow();

    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('Erro ao confirmar escala');
    expect(onResponded).not.toHaveBeenCalled();
    await waitFor(() => expect(result.current.isConfirming).toBe(false));
  });

  it('erro do Supabase (ex.: RLS) ao recusar: mostra toast de erro, devolve false e não quebra', async () => {
    mockUpdateResult({ error: { message: 'permission denied' } });
    const onResponded = vi.fn();
    const { result } = renderHook(() => useResponderEscala({ onResponded }));

    let ok: boolean | undefined;
    await expect(
      act(async () => {
        ok = await result.current.recusar('escala-1', 'Não vou poder ir');
      })
    ).resolves.not.toThrow();

    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('Erro ao recusar escala');
    expect(onResponded).not.toHaveBeenCalled();
    await waitFor(() => expect(result.current.isRecusing).toBe(false));
  });
});
