# `leader/ensino/` — dois sistemas diferentes, mesma pasta

Os arquivos aqui usam duas famílias de tabelas que **não têm relação entre si**
e não devem ser fundidas/"corrigidas" para convergir. Elas só compartilham
esta pasta porque ambas aparecem no menu "Ensino" do líder.

## `eb_*` — Escola Bíblica formal

Estrutura fixa e hierárquica, com matrícula de longo prazo:

```
eb_ciclos → eb_disciplinas (uma por mês) → eb_aulas (dentro de cada disciplina)
eb_matriculas   — vínculo perfil ↔ ciclo, existe antes de qualquer aula acontecer
eb_presencas    — presença por aula, só faz sentido pra quem está matriculado
eb_aula_arquivos — materiais anexados a uma aula
```

Usado em: `leader/ensino/EscolaBiblica.tsx`, `admin/Ensino.tsx`,
`app/MeuEnsino.tsx`.

## `ensino_*` — aula avulsa por ministério

Sem matrícula prévia — qualquer membro pode aparecer numa turma e ser
registrado ali mesmo, ministério a ministério:

```
ensino_turmas       — uma turma por ministério/período
ensino_planos_aula  — plano de aula avulso dentro de uma turma
ensino_plano_arquivos — materiais anexados a um plano de aula
ensino_checkins / ensino_presencas — presença registrada na hora, sem matrícula prévia
```

Usado em: `leader/ensino/Turmas.tsx`, `Planos.tsx`, `PlanoDetalhe.tsx`,
`Chamada.tsx`.

## Por que não unificar

São modelos de dados propositalmente diferentes pra necessidades diferentes
(currículo fixo vs. aula pontual). Um arquivo nunca faz `from('eb_...')` e
`from('ensino_...')` ao mesmo tempo — se um PR futuro parecer estar
"corrigindo uma inconsistência" ao misturar os dois, é sinal de que o PR
está errado, não o código.
