export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      acompanhamentos: {
        Row: {
          base_id: string
          created_at: string
          id: string
          observacao: string | null
          status: string
          updated_at: string
          visitante_id: string
        }
        Insert: {
          base_id: string
          created_at?: string
          id?: string
          observacao?: string | null
          status: string
          updated_at?: string
          visitante_id: string
        }
        Update: {
          base_id?: string
          created_at?: string
          id?: string
          observacao?: string | null
          status?: string
          updated_at?: string
          visitante_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acompanhamentos_base_id_fkey"
            columns: ["base_id"]
            isOneToOne: false
            referencedRelation: "bases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acompanhamentos_visitante_id_fkey"
            columns: ["visitante_id"]
            isOneToOne: false
            referencedRelation: "visitantes"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria_financeira: {
        Row: {
          acao: string
          created_at: string | null
          entidade: string
          entidade_id: string | null
          id: string
          payload: Json | null
          usuario_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string | null
          entidade: string
          entidade_id?: string | null
          id?: string
          payload?: Json | null
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string | null
          entidade?: string
          entidade_id?: string | null
          id?: string
          payload?: Json | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_financeira_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      avisos: {
        Row: {
          conteudo: string
          created_at: string | null
          criado_por: string | null
          data_publicacao: string | null
          id: string
          publico: boolean | null
          segmentos: Json | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          conteudo: string
          created_at?: string | null
          criado_por?: string | null
          data_publicacao?: string | null
          id?: string
          publico?: boolean | null
          segmentos?: Json | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          conteudo?: string
          created_at?: string | null
          criado_por?: string | null
          data_publicacao?: string | null
          id?: string
          publico?: boolean | null
          segmentos?: Json | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "avisos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      avisos_culto: {
        Row: {
          aviso_id: string
          created_at: string
          created_by: string | null
          evento_id: string
          id: string
          ministerio_id: string
          ordem: number
        }
        Insert: {
          aviso_id: string
          created_at?: string
          created_by?: string | null
          evento_id: string
          id?: string
          ministerio_id: string
          ordem?: number
        }
        Update: {
          aviso_id?: string
          created_at?: string
          created_by?: string | null
          evento_id?: string
          id?: string
          ministerio_id?: string
          ordem?: number
        }
        Relationships: [
          {
            foreignKeyName: "avisos_culto_aviso_id_fkey"
            columns: ["aviso_id"]
            isOneToOne: false
            referencedRelation: "avisos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avisos_culto_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos_escala"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avisos_culto_ministerio_id_fkey"
            columns: ["ministerio_id"]
            isOneToOne: false
            referencedRelation: "ministerios"
            referencedColumns: ["id"]
          },
        ]
      }
      bases: {
        Row: {
          anfitrioes: string | null
          bairro: string | null
          capacidade: number | null
          cidade: string | null
          created_at: string | null
          data_criacao: string | null
          descricao: string | null
          dia_semana: string | null
          foto_url: string | null
          horario: string | null
          id: string
          lider_id: string | null
          local: string | null
          ministerio_id: string | null
          nome: string
          numero: string | null
          observacoes: string | null
          rua: string | null
          status: string | null
          uf: string | null
          updated_at: string | null
          visibilidade: string | null
          whatsapp_lider: string | null
        }
        Insert: {
          anfitrioes?: string | null
          bairro?: string | null
          capacidade?: number | null
          cidade?: string | null
          created_at?: string | null
          data_criacao?: string | null
          descricao?: string | null
          dia_semana?: string | null
          foto_url?: string | null
          horario?: string | null
          id?: string
          lider_id?: string | null
          local?: string | null
          ministerio_id?: string | null
          nome: string
          numero?: string | null
          observacoes?: string | null
          rua?: string | null
          status?: string | null
          uf?: string | null
          updated_at?: string | null
          visibilidade?: string | null
          whatsapp_lider?: string | null
        }
        Update: {
          anfitrioes?: string | null
          bairro?: string | null
          capacidade?: number | null
          cidade?: string | null
          created_at?: string | null
          data_criacao?: string | null
          descricao?: string | null
          dia_semana?: string | null
          foto_url?: string | null
          horario?: string | null
          id?: string
          lider_id?: string | null
          local?: string | null
          ministerio_id?: string | null
          nome?: string
          numero?: string | null
          observacoes?: string | null
          rua?: string | null
          status?: string | null
          uf?: string | null
          updated_at?: string | null
          visibilidade?: string | null
          whatsapp_lider?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bases_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bases_ministerio_id_fkey"
            columns: ["ministerio_id"]
            isOneToOne: false
            referencedRelation: "ministerios"
            referencedColumns: ["id"]
          },
        ]
      }
      bases_membros: {
        Row: {
          base_id: string
          created_at: string | null
          data_entrada: string | null
          data_saida: string | null
          id: string
          membro_id: string | null
          observacao: string | null
          profile_id: string | null
          status: string | null
          updated_at: string | null
          visitante_id: string | null
        }
        Insert: {
          base_id: string
          created_at?: string | null
          data_entrada?: string | null
          data_saida?: string | null
          id?: string
          membro_id?: string | null
          observacao?: string | null
          profile_id?: string | null
          status?: string | null
          updated_at?: string | null
          visitante_id?: string | null
        }
        Update: {
          base_id?: string
          created_at?: string | null
          data_entrada?: string | null
          data_saida?: string | null
          id?: string
          membro_id?: string | null
          observacao?: string | null
          profile_id?: string | null
          status?: string | null
          updated_at?: string | null
          visitante_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bases_membros_base_id_fkey"
            columns: ["base_id"]
            isOneToOne: false
            referencedRelation: "bases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bases_membros_membro_id_fkey"
            columns: ["membro_id"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bases_membros_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bases_membros_visitante_id_fkey"
            columns: ["visitante_id"]
            isOneToOne: false
            referencedRelation: "visitantes"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_financeiras: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          natureza: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          natureza: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          natureza?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      checkins_kids: {
        Row: {
          checkin_at: string
          checkout_at: string | null
          checkout_responsavel_id: string | null
          created_at: string
          crianca_id: string
          id: string
          observacao: string | null
          responsavel_id: string | null
          sala_id: string
          status: string
          updated_at: string
        }
        Insert: {
          checkin_at?: string
          checkout_at?: string | null
          checkout_responsavel_id?: string | null
          created_at?: string
          crianca_id: string
          id?: string
          observacao?: string | null
          responsavel_id?: string | null
          sala_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          checkin_at?: string
          checkout_at?: string | null
          checkout_responsavel_id?: string | null
          created_at?: string
          crianca_id?: string
          id?: string
          observacao?: string | null
          responsavel_id?: string | null
          sala_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkins_kids_checkout_responsavel_id_fkey"
            columns: ["checkout_responsavel_id"]
            isOneToOne: false
            referencedRelation: "responsaveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_kids_crianca_id_fkey"
            columns: ["crianca_id"]
            isOneToOne: false
            referencedRelation: "criancas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_kids_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "responsaveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_kids_sala_id_fkey"
            columns: ["sala_id"]
            isOneToOne: false
            referencedRelation: "salas"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_instituicao: {
        Row: {
          banner_home_url: string | null
          banner_sou_novo_url: string | null
          bases_publicas: boolean | null
          capacidade_base_padrao: number | null
          chave_whatsapp: string | null
          cores: Json | null
          created_at: string | null
          email: string | null
          endereco: string | null
          facebook: string | null
          favicon_url: string | null
          google_calendar_embed_url: string | null
          google_maps_url: string | null
          horario_culto: string | null
          horario_ebd: string | null
          id: string
          logo_monochrome_url: string | null
          logo_url: string | null
          membros_editam_perfil: boolean | null
          nome_igreja: string | null
          notificacoes_email: boolean | null
          notificacoes_lideres: boolean | null
          notificacoes_push: boolean | null
          pix_info: Json | null
          telefone: string | null
          updated_at: string | null
          urls_transmissao: Json | null
          visitantes_auto: boolean | null
        }
        Insert: {
          banner_home_url?: string | null
          banner_sou_novo_url?: string | null
          bases_publicas?: boolean | null
          capacidade_base_padrao?: number | null
          chave_whatsapp?: string | null
          cores?: Json | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          facebook?: string | null
          favicon_url?: string | null
          google_calendar_embed_url?: string | null
          google_maps_url?: string | null
          horario_culto?: string | null
          horario_ebd?: string | null
          id?: string
          logo_monochrome_url?: string | null
          logo_url?: string | null
          membros_editam_perfil?: boolean | null
          nome_igreja?: string | null
          notificacoes_email?: boolean | null
          notificacoes_lideres?: boolean | null
          notificacoes_push?: boolean | null
          pix_info?: Json | null
          telefone?: string | null
          updated_at?: string | null
          urls_transmissao?: Json | null
          visitantes_auto?: boolean | null
        }
        Update: {
          banner_home_url?: string | null
          banner_sou_novo_url?: string | null
          bases_publicas?: boolean | null
          capacidade_base_padrao?: number | null
          chave_whatsapp?: string | null
          cores?: Json | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          facebook?: string | null
          favicon_url?: string | null
          google_calendar_embed_url?: string | null
          google_maps_url?: string | null
          horario_culto?: string | null
          horario_ebd?: string | null
          id?: string
          logo_monochrome_url?: string | null
          logo_url?: string | null
          membros_editam_perfil?: boolean | null
          nome_igreja?: string | null
          notificacoes_email?: boolean | null
          notificacoes_lideres?: boolean | null
          notificacoes_push?: boolean | null
          pix_info?: Json | null
          telefone?: string | null
          updated_at?: string | null
          urls_transmissao?: Json | null
          visitantes_auto?: boolean | null
        }
        Relationships: []
      }
      contas_financeiras: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          moeda: string | null
          nome: string
          saldo: number | null
          status: string | null
          tipo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          moeda?: string | null
          nome: string
          saldo?: number | null
          status?: string | null
          tipo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          moeda?: string | null
          nome?: string
          saldo?: number | null
          status?: string | null
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      criancas: {
        Row: {
          alergias: string | null
          autorizacao_foto: boolean | null
          created_at: string | null
          data_nascimento: string | null
          id: string
          nome: string
          observacoes: string | null
          responsavel_id: string
          sala_id: string | null
          turma_id: string | null
          updated_at: string | null
        }
        Insert: {
          alergias?: string | null
          autorizacao_foto?: boolean | null
          created_at?: string | null
          data_nascimento?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          responsavel_id: string
          sala_id?: string | null
          turma_id?: string | null
          updated_at?: string | null
        }
        Update: {
          alergias?: string | null
          autorizacao_foto?: boolean | null
          created_at?: string | null
          data_nascimento?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          responsavel_id?: string
          sala_id?: string | null
          turma_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "criancas_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "criancas_sala_id_fkey"
            columns: ["sala_id"]
            isOneToOne: false
            referencedRelation: "salas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "criancas_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas_infantil"
            referencedColumns: ["id"]
          },
        ]
      }
      criancas_responsaveis: {
        Row: {
          created_at: string
          crianca_id: string
          id: string
          responsavel_id: string
          tipo_relacao: string | null
        }
        Insert: {
          created_at?: string
          crianca_id: string
          id?: string
          responsavel_id: string
          tipo_relacao?: string | null
        }
        Update: {
          created_at?: string
          crianca_id?: string
          id?: string
          responsavel_id?: string
          tipo_relacao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "criancas_responsaveis_crianca_id_fkey"
            columns: ["crianca_id"]
            isOneToOne: false
            referencedRelation: "criancas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "criancas_responsaveis_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "responsaveis"
            referencedColumns: ["id"]
          },
        ]
      }
      culto_paleta_cores: {
        Row: {
          cor_acento: string | null
          cor_primaria: string
          cor_secundaria: string | null
          created_at: string
          created_by: string | null
          evento_id: string
          id: string
          ministerio_id: string
          observacao: string | null
          updated_at: string
        }
        Insert: {
          cor_acento?: string | null
          cor_primaria: string
          cor_secundaria?: string | null
          created_at?: string
          created_by?: string | null
          evento_id: string
          id?: string
          ministerio_id: string
          observacao?: string | null
          updated_at?: string
        }
        Update: {
          cor_acento?: string | null
          cor_primaria?: string
          cor_secundaria?: string | null
          created_at?: string
          created_by?: string | null
          evento_id?: string
          id?: string
          ministerio_id?: string
          observacao?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "culto_paleta_cores_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos_escala"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "culto_paleta_cores_ministerio_id_fkey"
            columns: ["ministerio_id"]
            isOneToOne: false
            referencedRelation: "ministerios"
            referencedColumns: ["id"]
          },
        ]
      }
      ensino_checkins: {
        Row: {
          church_id: string
          created_at: string
          data: string
          id: string
          ministerio_id: string
          observacoes: string | null
          registrado_por: string | null
          titulo: string | null
          turma_id: string
        }
        Insert: {
          church_id: string
          created_at?: string
          data: string
          id?: string
          ministerio_id: string
          observacoes?: string | null
          registrado_por?: string | null
          titulo?: string | null
          turma_id: string
        }
        Update: {
          church_id?: string
          created_at?: string
          data?: string
          id?: string
          ministerio_id?: string
          observacoes?: string | null
          registrado_por?: string | null
          titulo?: string | null
          turma_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ensino_checkins_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ensino_checkins_ministerio_id_fkey"
            columns: ["ministerio_id"]
            isOneToOne: false
            referencedRelation: "ministerios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ensino_checkins_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "ensino_turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      ensino_plano_arquivos: {
        Row: {
          arquivo_tipo: string
          arquivo_url: string
          created_at: string
          id: string
          nome: string
          plano_id: string
          tamanho_bytes: number | null
        }
        Insert: {
          arquivo_tipo: string
          arquivo_url: string
          created_at?: string
          id?: string
          nome: string
          plano_id: string
          tamanho_bytes?: number | null
        }
        Update: {
          arquivo_tipo?: string
          arquivo_url?: string
          created_at?: string
          id?: string
          nome?: string
          plano_id?: string
          tamanho_bytes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ensino_plano_arquivos_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "ensino_planos_aula"
            referencedColumns: ["id"]
          },
        ]
      }
      ensino_planos_aula: {
        Row: {
          anotacoes: string | null
          conteudo: string | null
          created_at: string
          data_aula: string
          id: string
          objetivos: string | null
          professor_id: string | null
          titulo: string
          turma_id: string
          updated_at: string
        }
        Insert: {
          anotacoes?: string | null
          conteudo?: string | null
          created_at?: string
          data_aula: string
          id?: string
          objetivos?: string | null
          professor_id?: string | null
          titulo: string
          turma_id: string
          updated_at?: string
        }
        Update: {
          anotacoes?: string | null
          conteudo?: string | null
          created_at?: string
          data_aula?: string
          id?: string
          objetivos?: string | null
          professor_id?: string | null
          titulo?: string
          turma_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ensino_planos_aula_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "ensino_turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      ensino_presencas: {
        Row: {
          checkin_id: string
          created_at: string
          id: string
          is_visitante: boolean
          nome_manual: string | null
          perfil_id: string | null
          presente: boolean
        }
        Insert: {
          checkin_id: string
          created_at?: string
          id?: string
          is_visitante?: boolean
          nome_manual?: string | null
          perfil_id?: string | null
          presente?: boolean
        }
        Update: {
          checkin_id?: string
          created_at?: string
          id?: string
          is_visitante?: boolean
          nome_manual?: string | null
          perfil_id?: string | null
          presente?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ensino_presencas_checkin_id_fkey"
            columns: ["checkin_id"]
            isOneToOne: false
            referencedRelation: "ensino_checkins"
            referencedColumns: ["id"]
          },
        ]
      }
      ensino_turmas: {
        Row: {
          ativo: boolean
          church_id: string
          created_at: string
          descricao: string | null
          id: string
          ministerio_id: string
          nome: string
          professor_id: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          church_id: string
          created_at?: string
          descricao?: string | null
          id?: string
          ministerio_id: string
          nome: string
          professor_id?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          church_id?: string
          created_at?: string
          descricao?: string | null
          id?: string
          ministerio_id?: string
          nome?: string
          professor_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ensino_turmas_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ensino_turmas_ministerio_id_fkey"
            columns: ["ministerio_id"]
            isOneToOne: false
            referencedRelation: "ministerios"
            referencedColumns: ["id"]
          },
        ]
      }
      escala_checkins: {
        Row: {
          checked_in_at: string
          created_at: string
          escala_id: string
          id: string
          user_id: string
        }
        Insert: {
          checked_in_at?: string
          created_at?: string
          escala_id: string
          id?: string
          user_id?: string
        }
        Update: {
          checked_in_at?: string
          created_at?: string
          escala_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "escala_checkins_escala_id_fkey"
            columns: ["escala_id"]
            isOneToOne: false
            referencedRelation: "escalas"
            referencedColumns: ["id"]
          },
        ]
      }
      escalas: {
        Row: {
          confirmado_em: string | null
          created_at: string | null
          created_by: string | null
          data: string
          evento_escala_id: string | null
          funcao: string
          horario: string | null
          id: string
          justificativa: string | null
          lembrete_automatico_dias_antes: number | null
          ministerio_id: string | null
          responsavel_id: string | null
          status: string
          updated_at: string | null
          voluntario_id: string | null
        }
        Insert: {
          confirmado_em?: string | null
          created_at?: string | null
          created_by?: string | null
          data: string
          evento_escala_id?: string | null
          funcao: string
          horario?: string | null
          id?: string
          justificativa?: string | null
          lembrete_automatico_dias_antes?: number | null
          ministerio_id?: string | null
          responsavel_id?: string | null
          status?: string
          updated_at?: string | null
          voluntario_id?: string | null
        }
        Update: {
          confirmado_em?: string | null
          created_at?: string | null
          created_by?: string | null
          data?: string
          evento_escala_id?: string | null
          funcao?: string
          horario?: string | null
          id?: string
          justificativa?: string | null
          lembrete_automatico_dias_antes?: number | null
          ministerio_id?: string | null
          responsavel_id?: string | null
          status?: string
          updated_at?: string | null
          voluntario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escalas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalas_evento_escala_id_fkey"
            columns: ["evento_escala_id"]
            isOneToOne: false
            referencedRelation: "eventos_escala"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalas_ministerio_id_fkey"
            columns: ["ministerio_id"]
            isOneToOne: false
            referencedRelation: "ministerios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalas_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalas_voluntario_id_fkey"
            columns: ["voluntario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_ministerios: {
        Row: {
          created_at: string
          evento_id: string
          id: string
          ministerio_id: string
          notificacao_enviada: boolean
          status: string
        }
        Insert: {
          created_at?: string
          evento_id: string
          id?: string
          ministerio_id: string
          notificacao_enviada?: boolean
          status?: string
        }
        Update: {
          created_at?: string
          evento_id?: string
          id?: string
          ministerio_id?: string
          notificacao_enviada?: boolean
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "evento_ministerios_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos_escala"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_ministerios_ministerio_id_fkey"
            columns: ["ministerio_id"]
            isOneToOne: false
            referencedRelation: "ministerios"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos: {
        Row: {
          created_at: string | null
          created_by: string | null
          data_fim: string | null
          data_inicio: string
          descricao: string | null
          id: string
          imagem_url: string | null
          local: string | null
          titulo: string
          updated_at: string | null
          vagas: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data_fim?: string | null
          data_inicio: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          local?: string | null
          titulo: string
          updated_at?: string | null
          vagas?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          local?: string | null
          titulo?: string
          updated_at?: string | null
          vagas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "eventos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_escala: {
        Row: {
          church_id: string
          created_at: string
          data_evento: string
          descricao: string | null
          horario_fim: string | null
          horario_inicio: string | null
          id: string
          periodo_id: string
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          church_id: string
          created_at?: string
          data_evento: string
          descricao?: string | null
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          periodo_id: string
          tipo?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          church_id?: string
          created_at?: string
          data_evento?: string
          descricao?: string | null
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          periodo_id?: string
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_escala_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_escala_periodo_id_fkey"
            columns: ["periodo_id"]
            isOneToOne: false
            referencedRelation: "periodos_escala"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_inscricoes: {
        Row: {
          data_inscricao: string | null
          evento_id: string
          id: string
          status: string | null
          usuario_id: string
        }
        Insert: {
          data_inscricao?: string | null
          evento_id: string
          id?: string
          status?: string | null
          usuario_id: string
        }
        Update: {
          data_inscricao?: string | null
          evento_id?: string
          id?: string
          status?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_inscricoes_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_inscricoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      grupos: {
        Row: {
          capacidade: number | null
          created_at: string | null
          descricao: string | null
          dia_semana: string | null
          horario: string | null
          id: string
          lider_id: string | null
          local: string | null
          nome: string
          updated_at: string | null
          visibilidade: Database["public"]["Enums"]["group_visibility"] | null
        }
        Insert: {
          capacidade?: number | null
          created_at?: string | null
          descricao?: string | null
          dia_semana?: string | null
          horario?: string | null
          id?: string
          lider_id?: string | null
          local?: string | null
          nome: string
          updated_at?: string | null
          visibilidade?: Database["public"]["Enums"]["group_visibility"] | null
        }
        Update: {
          capacidade?: number | null
          created_at?: string | null
          descricao?: string | null
          dia_semana?: string | null
          horario?: string | null
          id?: string
          lider_id?: string | null
          local?: string | null
          nome?: string
          updated_at?: string | null
          visibilidade?: Database["public"]["Enums"]["group_visibility"] | null
        }
        Relationships: [
          {
            foreignKeyName: "grupos_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      grupos_participantes: {
        Row: {
          created_at: string | null
          data_entrada: string | null
          grupo_id: string
          id: string
          status: Database["public"]["Enums"]["participant_status"] | null
          usuario_id: string
        }
        Insert: {
          created_at?: string | null
          data_entrada?: string | null
          grupo_id: string
          id?: string
          status?: Database["public"]["Enums"]["participant_status"] | null
          usuario_id: string
        }
        Update: {
          created_at?: string | null
          data_entrada?: string | null
          grupo_id?: string
          id?: string
          status?: Database["public"]["Enums"]["participant_status"] | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grupos_participantes_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grupos_participantes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_comunicacoes: {
        Row: {
          created_at: string
          detalhes_erro: string | null
          escala_id: string | null
          id: string
          mensagem_preview: string | null
          status: string
          tipo: string
          voluntario_id: string | null
        }
        Insert: {
          created_at?: string
          detalhes_erro?: string | null
          escala_id?: string | null
          id?: string
          mensagem_preview?: string | null
          status: string
          tipo: string
          voluntario_id?: string | null
        }
        Update: {
          created_at?: string
          detalhes_erro?: string | null
          escala_id?: string | null
          id?: string
          mensagem_preview?: string | null
          status?: string
          tipo?: string
          voluntario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_comunicacoes_escala_id_fkey"
            columns: ["escala_id"]
            isOneToOne: false
            referencedRelation: "escalas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_comunicacoes_voluntario_id_fkey"
            columns: ["voluntario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      igrejas: {
        Row: {
          ativa: boolean | null
          cidade: string | null
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          ativa?: boolean | null
          cidade?: string | null
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          ativa?: boolean | null
          cidade?: string | null
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      liturgia_culto: {
        Row: {
          created_at: string
          created_by: string | null
          evento_id: string
          id: string
          ministerio_id: string
          observacoes_gerais: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          evento_id: string
          id?: string
          ministerio_id: string
          observacoes_gerais?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          evento_id?: string
          id?: string
          ministerio_id?: string
          observacoes_gerais?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "liturgia_culto_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos_escala"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liturgia_culto_ministerio_id_fkey"
            columns: ["ministerio_id"]
            isOneToOne: false
            referencedRelation: "ministerios"
            referencedColumns: ["id"]
          },
        ]
      }
      liturgia_itens: {
        Row: {
          created_at: string
          duracao_minutos: number | null
          id: string
          liturgia_id: string
          observacao: string | null
          ordem: number
          origem: string
          responsavel: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          created_at?: string
          duracao_minutos?: number | null
          id?: string
          liturgia_id: string
          observacao?: string | null
          ordem?: number
          origem?: string
          responsavel?: string | null
          tipo?: string
          titulo: string
        }
        Update: {
          created_at?: string
          duracao_minutos?: number | null
          id?: string
          liturgia_id?: string
          observacao?: string | null
          ordem?: number
          origem?: string
          responsavel?: string | null
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "liturgia_itens_liturgia_id_fkey"
            columns: ["liturgia_id"]
            isOneToOne: false
            referencedRelation: "liturgia_culto"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_comunicacao: {
        Row: {
          conteudo: string
          created_at: string | null
          destinatarios: Json | null
          id: string
          status: string | null
          tipo: Database["public"]["Enums"]["communication_type"]
        }
        Insert: {
          conteudo: string
          created_at?: string | null
          destinatarios?: Json | null
          id?: string
          status?: string | null
          tipo: Database["public"]["Enums"]["communication_type"]
        }
        Update: {
          conteudo?: string
          created_at?: string | null
          destinatarios?: Json | null
          id?: string
          status?: string | null
          tipo?: Database["public"]["Enums"]["communication_type"]
        }
        Relationships: []
      }
      mca_checkins: {
        Row: {
          checkin_at: string
          checkout_at: string | null
          church_id: string
          crianca_id: string
          evento_id: string | null
          id: string
          observacao: string | null
          registrado_por: string | null
          sala_id: string
        }
        Insert: {
          checkin_at?: string
          checkout_at?: string | null
          church_id: string
          crianca_id: string
          evento_id?: string | null
          id?: string
          observacao?: string | null
          registrado_por?: string | null
          sala_id: string
        }
        Update: {
          checkin_at?: string
          checkout_at?: string | null
          church_id?: string
          crianca_id?: string
          evento_id?: string | null
          id?: string
          observacao?: string | null
          registrado_por?: string | null
          sala_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mca_checkins_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mca_checkins_crianca_id_fkey"
            columns: ["crianca_id"]
            isOneToOne: false
            referencedRelation: "mca_criancas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mca_checkins_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos_escala"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mca_checkins_sala_id_fkey"
            columns: ["sala_id"]
            isOneToOne: false
            referencedRelation: "mca_salas"
            referencedColumns: ["id"]
          },
        ]
      }
      mca_comunicacoes: {
        Row: {
          created_at: string
          criado_por: string | null
          crianca_id: string
          enviado: boolean
          enviado_at: string | null
          id: string
          mensagem_melhorada: string | null
          mensagem_original: string
          responsavel_telefone: string
        }
        Insert: {
          created_at?: string
          criado_por?: string | null
          crianca_id: string
          enviado?: boolean
          enviado_at?: string | null
          id?: string
          mensagem_melhorada?: string | null
          mensagem_original: string
          responsavel_telefone: string
        }
        Update: {
          created_at?: string
          criado_por?: string | null
          crianca_id?: string
          enviado?: boolean
          enviado_at?: string | null
          id?: string
          mensagem_melhorada?: string | null
          mensagem_original?: string
          responsavel_telefone?: string
        }
        Relationships: [
          {
            foreignKeyName: "mca_comunicacoes_crianca_id_fkey"
            columns: ["crianca_id"]
            isOneToOne: false
            referencedRelation: "mca_criancas"
            referencedColumns: ["id"]
          },
        ]
      }
      mca_criancas: {
        Row: {
          ativo: boolean
          church_id: string
          created_at: string
          data_nascimento: string | null
          foto_url: string | null
          id: string
          nome: string
          observacoes: string | null
          sala_id: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          church_id: string
          created_at?: string
          data_nascimento?: string | null
          foto_url?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          sala_id?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          church_id?: string
          created_at?: string
          data_nascimento?: string | null
          foto_url?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          sala_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mca_criancas_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mca_criancas_sala_id_fkey"
            columns: ["sala_id"]
            isOneToOne: false
            referencedRelation: "mca_salas"
            referencedColumns: ["id"]
          },
        ]
      }
      mca_plano_arquivos: {
        Row: {
          arquivo_tipo: string
          arquivo_url: string
          created_at: string
          id: string
          nome: string
          plano_id: string
          tamanho_bytes: number | null
        }
        Insert: {
          arquivo_tipo: string
          arquivo_url: string
          created_at?: string
          id?: string
          nome: string
          plano_id: string
          tamanho_bytes?: number | null
        }
        Update: {
          arquivo_tipo?: string
          arquivo_url?: string
          created_at?: string
          id?: string
          nome?: string
          plano_id?: string
          tamanho_bytes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mca_plano_arquivos_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "mca_planos_aula"
            referencedColumns: ["id"]
          },
        ]
      }
      mca_planos_aula: {
        Row: {
          anotacoes: string | null
          conteudo: string | null
          created_at: string
          data_aula: string
          id: string
          objetivos: string | null
          professor_id: string | null
          sala_id: string
          titulo: string
          updated_at: string
        }
        Insert: {
          anotacoes?: string | null
          conteudo?: string | null
          created_at?: string
          data_aula: string
          id?: string
          objetivos?: string | null
          professor_id?: string | null
          sala_id: string
          titulo: string
          updated_at?: string
        }
        Update: {
          anotacoes?: string | null
          conteudo?: string | null
          created_at?: string
          data_aula?: string
          id?: string
          objetivos?: string | null
          professor_id?: string | null
          sala_id?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mca_planos_aula_sala_id_fkey"
            columns: ["sala_id"]
            isOneToOne: false
            referencedRelation: "mca_salas"
            referencedColumns: ["id"]
          },
        ]
      }
      mca_responsaveis: {
        Row: {
          created_at: string
          crianca_id: string
          id: string
          is_primary: boolean
          nome: string
          parentesco: string
          perfil_id: string | null
          telefone: string
        }
        Insert: {
          created_at?: string
          crianca_id: string
          id?: string
          is_primary?: boolean
          nome: string
          parentesco?: string
          perfil_id?: string | null
          telefone: string
        }
        Update: {
          created_at?: string
          crianca_id?: string
          id?: string
          is_primary?: boolean
          nome?: string
          parentesco?: string
          perfil_id?: string | null
          telefone?: string
        }
        Relationships: [
          {
            foreignKeyName: "mca_responsaveis_crianca_id_fkey"
            columns: ["crianca_id"]
            isOneToOne: false
            referencedRelation: "mca_criancas"
            referencedColumns: ["id"]
          },
        ]
      }
      mca_salas: {
        Row: {
          ativo: boolean
          capacidade: number | null
          church_id: string
          created_at: string
          faixa_etaria_max: number | null
          faixa_etaria_min: number | null
          id: string
          ministerio_id: string
          nome: string
          professor_id: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          capacidade?: number | null
          church_id: string
          created_at?: string
          faixa_etaria_max?: number | null
          faixa_etaria_min?: number | null
          id?: string
          ministerio_id: string
          nome: string
          professor_id?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          capacidade?: number | null
          church_id?: string
          created_at?: string
          faixa_etaria_max?: number | null
          faixa_etaria_min?: number | null
          id?: string
          ministerio_id?: string
          nome?: string
          professor_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mca_salas_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mca_salas_ministerio_id_fkey"
            columns: ["ministerio_id"]
            isOneToOne: false
            referencedRelation: "ministerios"
            referencedColumns: ["id"]
          },
        ]
      }
      membros: {
        Row: {
          bairro: string | null
          batismo_espirito_santo: boolean | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          cpf: string | null
          created_at: string | null
          curso: string | null
          data_batismo: string | null
          data_batismo_agua: string | null
          data_batismo_espirito: string | null
          data_nascimento: string | null
          data_ordenacao_fim: string | null
          data_ordenacao_inicio: string | null
          data_recebimento: string | null
          data_registro: string | null
          data_situacao_fim: string | null
          data_situacao_inicio: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          estado_civil: string | null
          foto_perfil: string | null
          genero: string | null
          grau_instrucao: string | null
          id: string
          igreja_anterior: string | null
          local_batismo: string | null
          nacionalidade: string | null
          naturalidade: string | null
          nome: string
          nome_mae: string | null
          nome_pai: string | null
          numero: string | null
          observacoes: string | null
          observacoes_pastorais: string | null
          ordenacao_funcao: string | null
          ordenacao_observacao: string | null
          origem_membro: string | null
          pai_mae_promessista: boolean | null
          pais: string | null
          pastor_oficiante: string | null
          pcd: string | null
          profissao: string | null
          rua: string | null
          situacao_ministerial: string | null
          situacao_observacao: string | null
          status: string | null
          telefone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bairro?: string | null
          batismo_espirito_santo?: boolean | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf?: string | null
          created_at?: string | null
          curso?: string | null
          data_batismo?: string | null
          data_batismo_agua?: string | null
          data_batismo_espirito?: string | null
          data_nascimento?: string | null
          data_ordenacao_fim?: string | null
          data_ordenacao_inicio?: string | null
          data_recebimento?: string | null
          data_registro?: string | null
          data_situacao_fim?: string | null
          data_situacao_inicio?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          estado_civil?: string | null
          foto_perfil?: string | null
          genero?: string | null
          grau_instrucao?: string | null
          id?: string
          igreja_anterior?: string | null
          local_batismo?: string | null
          nacionalidade?: string | null
          naturalidade?: string | null
          nome: string
          nome_mae?: string | null
          nome_pai?: string | null
          numero?: string | null
          observacoes?: string | null
          observacoes_pastorais?: string | null
          ordenacao_funcao?: string | null
          ordenacao_observacao?: string | null
          origem_membro?: string | null
          pai_mae_promessista?: boolean | null
          pais?: string | null
          pastor_oficiante?: string | null
          pcd?: string | null
          profissao?: string | null
          rua?: string | null
          situacao_ministerial?: string | null
          situacao_observacao?: string | null
          status?: string | null
          telefone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bairro?: string | null
          batismo_espirito_santo?: boolean | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf?: string | null
          created_at?: string | null
          curso?: string | null
          data_batismo?: string | null
          data_batismo_agua?: string | null
          data_batismo_espirito?: string | null
          data_nascimento?: string | null
          data_ordenacao_fim?: string | null
          data_ordenacao_inicio?: string | null
          data_recebimento?: string | null
          data_registro?: string | null
          data_situacao_fim?: string | null
          data_situacao_inicio?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          estado_civil?: string | null
          foto_perfil?: string | null
          genero?: string | null
          grau_instrucao?: string | null
          id?: string
          igreja_anterior?: string | null
          local_batismo?: string | null
          nacionalidade?: string | null
          naturalidade?: string | null
          nome?: string
          nome_mae?: string | null
          nome_pai?: string | null
          numero?: string | null
          observacoes?: string | null
          observacoes_pastorais?: string | null
          ordenacao_funcao?: string | null
          ordenacao_observacao?: string | null
          origem_membro?: string | null
          pai_mae_promessista?: boolean | null
          pais?: string | null
          pastor_oficiante?: string | null
          pcd?: string | null
          profissao?: string | null
          rua?: string | null
          situacao_ministerial?: string | null
          situacao_observacao?: string | null
          status?: string | null
          telefone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "membros_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ministerio_documentos: {
        Row: {
          arquivo_nome: string
          arquivo_tipo: string
          arquivo_url: string
          created_at: string
          criado_por: string | null
          descricao: string | null
          id: string
          ministerio_id: string
          nome: string
        }
        Insert: {
          arquivo_nome: string
          arquivo_tipo: string
          arquivo_url: string
          created_at?: string
          criado_por?: string | null
          descricao?: string | null
          id?: string
          ministerio_id: string
          nome: string
        }
        Update: {
          arquivo_nome?: string
          arquivo_tipo?: string
          arquivo_url?: string
          created_at?: string
          criado_por?: string | null
          descricao?: string | null
          id?: string
          ministerio_id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "ministerio_documentos_ministerio_id_fkey"
            columns: ["ministerio_id"]
            isOneToOne: false
            referencedRelation: "ministerios"
            referencedColumns: ["id"]
          },
        ]
      }
      ministerio_funcoes: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          id: string
          ministerio_id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          ministerio_id: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          ministerio_id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ministerio_funcoes_ministerio_id_fkey"
            columns: ["ministerio_id"]
            isOneToOne: false
            referencedRelation: "ministerios"
            referencedColumns: ["id"]
          },
        ]
      }
      ministerio_modulos: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          icone: string | null
          id: string
          ministerio_id: string
          modulo_slug: string
          nome: string
          ordem: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          ministerio_id: string
          modulo_slug: string
          nome: string
          ordem?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          ministerio_id?: string
          modulo_slug?: string
          nome?: string
          ordem?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ministerio_modulos_ministerio_id_fkey"
            columns: ["ministerio_id"]
            isOneToOne: false
            referencedRelation: "ministerios"
            referencedColumns: ["id"]
          },
        ]
      }
      ministerio_usuarios: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          funcao_principal_id: string | null
          id: string
          ministerio_id: string
          papel: Database["public"]["Enums"]["papel_ministerial"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          funcao_principal_id?: string | null
          id?: string
          ministerio_id: string
          papel?: Database["public"]["Enums"]["papel_ministerial"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          funcao_principal_id?: string | null
          id?: string
          ministerio_id?: string
          papel?: Database["public"]["Enums"]["papel_ministerial"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ministerio_voluntarios_funcao_principal_id_fkey"
            columns: ["funcao_principal_id"]
            isOneToOne: false
            referencedRelation: "ministerio_funcoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ministerio_voluntarios_ministerio_id_fkey"
            columns: ["ministerio_id"]
            isOneToOne: false
            referencedRelation: "ministerios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ministerio_voluntarios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ministerio_voluntarios_funcoes: {
        Row: {
          created_at: string
          funcao_id: string
          id: string
          ministerio_voluntario_id: string
        }
        Insert: {
          created_at?: string
          funcao_id: string
          id?: string
          ministerio_voluntario_id: string
        }
        Update: {
          created_at?: string
          funcao_id?: string
          id?: string
          ministerio_voluntario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ministerio_voluntarios_funcoes_funcao_id_fkey"
            columns: ["funcao_id"]
            isOneToOne: false
            referencedRelation: "ministerio_funcoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ministerio_voluntarios_funcoes_ministerio_voluntario_id_fkey"
            columns: ["ministerio_voluntario_id"]
            isOneToOne: false
            referencedRelation: "ministerio_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      ministerios: {
        Row: {
          ativo: boolean | null
          contato: string | null
          created_at: string | null
          descricao: string | null
          id: string
          is_core: boolean
          lider_id: string | null
          nome: string
          slug: string | null
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          contato?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          is_core?: boolean
          lider_id?: string | null
          nome: string
          slug?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          contato?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          is_core?: boolean
          lider_id?: string | null
          nome?: string
          slug?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ministerios_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      musicas_culto: {
        Row: {
          artista_avulso: string | null
          capa_url: string | null
          created_at: string
          created_by: string | null
          evento_id: string
          id: string
          link_cifraclub: string | null
          link_deezer: string | null
          link_spotify: string | null
          link_youtube: string | null
          ministerio_id: string
          musica_id: string | null
          ordem: number
          titulo_avulso: string | null
        }
        Insert: {
          artista_avulso?: string | null
          capa_url?: string | null
          created_at?: string
          created_by?: string | null
          evento_id: string
          id?: string
          link_cifraclub?: string | null
          link_deezer?: string | null
          link_spotify?: string | null
          link_youtube?: string | null
          ministerio_id: string
          musica_id?: string | null
          ordem?: number
          titulo_avulso?: string | null
        }
        Update: {
          artista_avulso?: string | null
          capa_url?: string | null
          created_at?: string
          created_by?: string | null
          evento_id?: string
          id?: string
          link_cifraclub?: string | null
          link_deezer?: string | null
          link_spotify?: string | null
          link_youtube?: string | null
          ministerio_id?: string
          musica_id?: string | null
          ordem?: number
          titulo_avulso?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "musicas_culto_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos_escala"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "musicas_culto_ministerio_id_fkey"
            columns: ["ministerio_id"]
            isOneToOne: false
            referencedRelation: "ministerios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "musicas_culto_musica_id_fkey"
            columns: ["musica_id"]
            isOneToOne: false
            referencedRelation: "musicas_repertorio"
            referencedColumns: ["id"]
          },
        ]
      }
      musicas_repertorio: {
        Row: {
          artista: string | null
          capa_url: string | null
          church_id: string
          cifra_url: string | null
          created_at: string
          created_by: string | null
          id: string
          link_cifraclub: string | null
          link_deezer: string | null
          link_spotify: string | null
          link_youtube: string | null
          ministerio_id: string
          observacoes: string | null
          titulo: string
          tom: string | null
          updated_at: string
        }
        Insert: {
          artista?: string | null
          capa_url?: string | null
          church_id: string
          cifra_url?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          link_cifraclub?: string | null
          link_deezer?: string | null
          link_spotify?: string | null
          link_youtube?: string | null
          ministerio_id: string
          observacoes?: string | null
          titulo: string
          tom?: string | null
          updated_at?: string
        }
        Update: {
          artista?: string | null
          capa_url?: string | null
          church_id?: string
          cifra_url?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          link_cifraclub?: string | null
          link_deezer?: string | null
          link_spotify?: string | null
          link_youtube?: string | null
          ministerio_id?: string
          observacoes?: string | null
          titulo?: string
          tom?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "musicas_repertorio_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "musicas_repertorio_ministerio_id_fkey"
            columns: ["ministerio_id"]
            isOneToOne: false
            referencedRelation: "ministerios"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_base: {
        Row: {
          base_id: string
          conteudo: string | null
          created_at: string | null
          data: string
          id: string
          profile_id: string
          updated_at: string | null
        }
        Insert: {
          base_id: string
          conteudo?: string | null
          created_at?: string | null
          data?: string
          id?: string
          profile_id: string
          updated_at?: string | null
        }
        Update: {
          base_id?: string
          conteudo?: string | null
          created_at?: string | null
          data?: string
          id?: string
          profile_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notas_base_base_id_fkey"
            columns: ["base_id"]
            isOneToOne: false
            referencedRelation: "bases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_base_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          created_at: string | null
          enviado_em: string | null
          escala_id: string | null
          id: string
          lido: boolean | null
          mensagem: string
          ministerio_id: string | null
          tipo: Database["public"]["Enums"]["notification_type"]
          titulo: string | null
          updated_at: string | null
          voluntario_id: string | null
        }
        Insert: {
          created_at?: string | null
          enviado_em?: string | null
          escala_id?: string | null
          id?: string
          lido?: boolean | null
          mensagem: string
          ministerio_id?: string | null
          tipo: Database["public"]["Enums"]["notification_type"]
          titulo?: string | null
          updated_at?: string | null
          voluntario_id?: string | null
        }
        Update: {
          created_at?: string | null
          enviado_em?: string | null
          escala_id?: string | null
          id?: string
          lido?: boolean | null
          mensagem?: string
          ministerio_id?: string | null
          tipo?: Database["public"]["Enums"]["notification_type"]
          titulo?: string | null
          updated_at?: string | null
          voluntario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_escala_id_fkey"
            columns: ["escala_id"]
            isOneToOne: false
            referencedRelation: "escalas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_ministerio_id_fkey"
            columns: ["ministerio_id"]
            isOneToOne: false
            referencedRelation: "ministerios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_voluntario_id_fkey"
            columns: ["voluntario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_oracao: {
        Row: {
          anonimo: boolean | null
          created_at: string | null
          descricao: string | null
          id: string
          status: string | null
          titulo: string
          updated_at: string | null
          usuario_id: string | null
        }
        Insert: {
          anonimo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          status?: string | null
          titulo: string
          updated_at?: string | null
          usuario_id?: string | null
        }
        Update: {
          anonimo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          status?: string | null
          titulo?: string
          updated_at?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_oracao_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      periodos_escala: {
        Row: {
          ano: number
          church_id: string
          created_at: string
          criado_por: string | null
          id: string
          mes: number
          nome: string
          status: string
          updated_at: string
        }
        Insert: {
          ano: number
          church_id: string
          created_at?: string
          criado_por?: string | null
          id?: string
          mes: number
          nome: string
          status?: string
          updated_at?: string
        }
        Update: {
          ano?: number
          church_id?: string
          created_at?: string
          criado_por?: string | null
          id?: string
          mes?: number
          nome?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "periodos_escala_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
        ]
      }
      presencas: {
        Row: {
          created_at: string | null
          data: string | null
          id: string
          marcado_por: string | null
          presente: boolean | null
          referencia_id: string
          referencia_tipo: string
          usuario_id: string
        }
        Insert: {
          created_at?: string | null
          data?: string | null
          id?: string
          marcado_por?: string | null
          presente?: boolean | null
          referencia_id: string
          referencia_tipo: string
          usuario_id: string
        }
        Update: {
          created_at?: string | null
          data?: string | null
          id?: string
          marcado_por?: string | null
          presente?: boolean | null
          referencia_id?: string
          referencia_tipo?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "presencas_marcado_por_fkey"
            columns: ["marcado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presencas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bairro: string | null
          batizado_aguas: boolean | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          cpf: string | null
          created_at: string | null
          data_batismo: string | null
          data_cadastro: string | null
          data_nascimento: string | null
          email: string
          endereco: string | null
          estado_civil: string | null
          formacao: string | null
          foto_url: string | null
          grau_instrucao: string | null
          id: string
          logradouro: string | null
          naturalidade: string | null
          nome: string
          numero: string | null
          observacoes_privadas: string | null
          pcd: string | null
          preferencias_notificacao: Json | null
          profissao: string | null
          sexo: string | null
          status: Database["public"]["Enums"]["user_status"] | null
          telefone: string | null
          uf: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bairro?: string | null
          batizado_aguas?: boolean | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf?: string | null
          created_at?: string | null
          data_batismo?: string | null
          data_cadastro?: string | null
          data_nascimento?: string | null
          email: string
          endereco?: string | null
          estado_civil?: string | null
          formacao?: string | null
          foto_url?: string | null
          grau_instrucao?: string | null
          id?: string
          logradouro?: string | null
          naturalidade?: string | null
          nome: string
          numero?: string | null
          observacoes_privadas?: string | null
          pcd?: string | null
          preferencias_notificacao?: Json | null
          profissao?: string | null
          sexo?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          telefone?: string | null
          uf?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bairro?: string | null
          batizado_aguas?: boolean | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf?: string | null
          created_at?: string | null
          data_batismo?: string | null
          data_cadastro?: string | null
          data_nascimento?: string | null
          email?: string
          endereco?: string | null
          estado_civil?: string | null
          formacao?: string | null
          foto_url?: string | null
          grau_instrucao?: string | null
          id?: string
          logradouro?: string | null
          naturalidade?: string | null
          nome?: string
          numero?: string | null
          observacoes_privadas?: string | null
          pcd?: string | null
          preferencias_notificacao?: Json | null
          profissao?: string | null
          sexo?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          telefone?: string | null
          uf?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      responsaveis: {
        Row: {
          created_at: string
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      salas: {
        Row: {
          capacidade: number | null
          created_at: string
          id: string
          nome: string
          observacao: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          capacidade?: number | null
          created_at?: string
          id?: string
          nome: string
          observacao?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          capacidade?: number | null
          created_at?: string
          id?: string
          nome?: string
          observacao?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      transacoes_financeiras: {
        Row: {
          categoria_id: string | null
          conta_id: string | null
          created_at: string | null
          criado_por: string | null
          data_operacao: string
          descricao: string | null
          evento_id: string | null
          id: string
          membro_id: string | null
          nota: string | null
          referencia: string | null
          status: string | null
          tipo: string
          updated_at: string | null
          valor: number
          visitante_id: string | null
        }
        Insert: {
          categoria_id?: string | null
          conta_id?: string | null
          created_at?: string | null
          criado_por?: string | null
          data_operacao: string
          descricao?: string | null
          evento_id?: string | null
          id?: string
          membro_id?: string | null
          nota?: string | null
          referencia?: string | null
          status?: string | null
          tipo: string
          updated_at?: string | null
          valor: number
          visitante_id?: string | null
        }
        Update: {
          categoria_id?: string | null
          conta_id?: string | null
          created_at?: string | null
          criado_por?: string | null
          data_operacao?: string
          descricao?: string | null
          evento_id?: string | null
          id?: string
          membro_id?: string | null
          nota?: string | null
          referencia?: string | null
          status?: string | null
          tipo?: string
          updated_at?: string | null
          valor?: number
          visitante_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_financeiras_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_financeiras_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_financeiras_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_financeiras_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_financeiras_membro_id_fkey"
            columns: ["membro_id"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_financeiras_visitante_id_fkey"
            columns: ["visitante_id"]
            isOneToOne: false
            referencedRelation: "visitantes"
            referencedColumns: ["id"]
          },
        ]
      }
      turmas_infantil: {
        Row: {
          created_at: string | null
          faixa_etaria: string | null
          id: string
          nome: string
          responsavel_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          faixa_etaria?: string | null
          id?: string
          nome: string
          responsavel_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          faixa_etaria?: string | null
          id?: string
          nome?: string
          responsavel_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "turmas_infantil_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visitantes: {
        Row: {
          created_at: string | null
          culto: string | null
          data_visita: string | null
          email: string | null
          id: string
          melhor_horario: string | null
          nome: string
          observacoes: string | null
          status: string | null
          telefone: string | null
        }
        Insert: {
          created_at?: string | null
          culto?: string | null
          data_visita?: string | null
          email?: string | null
          id?: string
          melhor_horario?: string | null
          nome: string
          observacoes?: string | null
          status?: string | null
          telefone?: string | null
        }
        Update: {
          created_at?: string | null
          culto?: string | null
          data_visita?: string | null
          email?: string | null
          id?: string
          melhor_horario?: string | null
          nome?: string
          observacoes?: string | null
          status?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_ministry: {
        Args: { _action: string; _ministerio_id: string; _user_id: string }
        Returns: boolean
      }
      check_ministerio_member: {
        Args: { _ministerio_id: string; _user_id: string }
        Returns: boolean
      }
      get_base_members_for_leader: {
        Args: { p_base_id: string; p_search?: string }
        Returns: {
          bases_membros_id: string
          data_entrada: string
          foto_url: string
          membro_id: string
          nome: string
          origem: string
          profile_id: string
          telefone: string
        }[]
      }
      get_bases_report: {
        Args: never
        Returns: {
          base_id: string
          capacidade: number
          lider_id: string
          lider_nome: string
          membros_em_bases_distintos: number
          nome: string
          status: string
          total_membros: number
          total_membros_ativos: number
          total_visitantes: number
          total_visitantes_geral: number
          visibilidade: string
          visitantes_em_bases_distintos: number
        }[]
      }
      get_eligible_people_for_base: {
        Args: { p_base_id: string; p_search?: string }
        Returns: {
          email: string
          id: string
          nome: string
        }[]
      }
      get_eligible_volunteers_for_ministry: {
        Args: { p_ministerio_id: string; p_search_term?: string }
        Returns: {
          email: string
          id: string
          nome: string
          user_id: string
        }[]
      }
      get_leader_base_ids: { Args: { _profile_id: string }; Returns: string[] }
      get_meu_ensino: {
        Args: never
        Returns: {
          data_aula: string
          presente: boolean
          turma_id: string
          turma_nome: string
        }[]
      }
      get_my_bases: { Args: never; Returns: Json }
      get_my_ministries: {
        Args: never
        Returns: {
          descricao: string
          ministerio_id: string
          nome: string
          papel: string
          slug: string
        }[]
      }
      get_profile_base_ids: { Args: { _profile_id: string }; Returns: string[] }
      get_profile_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_kids_team: { Args: { _user_id: string }; Returns: boolean }
      leader_add_member_to_base: {
        Args: { p_base_id: string; p_profile_id: string }
        Returns: undefined
      }
      leader_remove_member_from_base: {
        Args: { p_bases_membros_id: string }
        Returns: undefined
      }
      public_checkin_by_token: { Args: { p_token: string }; Returns: Json }
      public_checkin_manual: { Args: { p_crianca_id: string }; Returns: Json }
      public_get_default_igreja: { Args: never; Returns: string }
      public_presentes_hoje: {
        Args: { p_igreja_id: string }
        Returns: {
          checkin_at: string
          crianca_nome: string
          id: string
          sala_nome: string
        }[]
      }
      public_search_criancas: {
        Args: { p_igreja_id: string; p_search: string }
        Returns: {
          data_nascimento: string
          id: string
          nome: string
          sala_id: string
        }[]
      }
      recalcula_saldo_conta: { Args: { p_conta_id: string }; Returns: number }
    }
    Enums: {
      app_role:
        | "admin"
        | "lider"
        | "voluntario"
        | "membro"
        | "visitante"
        | "financeiro"
      communication_type: "push" | "whatsapp" | "email"
      escala_status_geral: "planejada" | "ativa" | "concluida"
      group_visibility: "publica" | "privada"
      notification_type:
        | "nova_escala"
        | "lembrete"
        | "status_alterado"
        | "sistema"
        | "ministerio"
        | "aviso_admin"
      papel_ministerial: "lider" | "voluntario"
      participant_status: "ativo" | "saida" | "pendente"
      scale_status: "confirmado" | "pendente" | "ausente"
      user_status: "ativo" | "inativo" | "pendente"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "lider",
        "voluntario",
        "membro",
        "visitante",
        "financeiro",
      ],
      communication_type: ["push", "whatsapp", "email"],
      escala_status_geral: ["planejada", "ativa", "concluida"],
      group_visibility: ["publica", "privada"],
      notification_type: [
        "nova_escala",
        "lembrete",
        "status_alterado",
        "sistema",
        "ministerio",
        "aviso_admin",
      ],
      papel_ministerial: ["lider", "voluntario"],
      participant_status: ["ativo", "saida", "pendente"],
      scale_status: ["confirmado", "pendente", "ausente"],
      user_status: ["ativo", "inativo", "pendente"],
    },
  },
} as const
<claude-code-hint v="1" type="plugin" value="supabase@claude-plugins-official" />
