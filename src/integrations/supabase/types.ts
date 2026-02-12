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
    PostgrestVersion: "13.0.5"
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
          responsavel_id: string
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
          responsavel_id: string
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
          responsavel_id?: string
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
            referencedRelation: "salas_kids"
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
          funcao: string
          horario: string | null
          id: string
          justificativa: string | null
          lembrete_automatico_dias_antes: number | null
          ministerio_id: string | null
          responsavel_id: string | null
          status: Database["public"]["Enums"]["scale_status"] | null
          status_geral:
            | Database["public"]["Enums"]["escala_status_geral"]
            | null
          turno: string | null
          updated_at: string | null
          voluntario_id: string | null
        }
        Insert: {
          confirmado_em?: string | null
          created_at?: string | null
          created_by?: string | null
          data: string
          funcao: string
          horario?: string | null
          id?: string
          justificativa?: string | null
          lembrete_automatico_dias_antes?: number | null
          ministerio_id?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["scale_status"] | null
          status_geral?:
            | Database["public"]["Enums"]["escala_status_geral"]
            | null
          turno?: string | null
          updated_at?: string | null
          voluntario_id?: string | null
        }
        Update: {
          confirmado_em?: string | null
          created_at?: string | null
          created_by?: string | null
          data?: string
          funcao?: string
          horario?: string | null
          id?: string
          justificativa?: string | null
          lembrete_automatico_dias_antes?: number | null
          ministerio_id?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["scale_status"] | null
          status_geral?:
            | Database["public"]["Enums"]["escala_status_geral"]
            | null
          turno?: string | null
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
      membros: {
        Row: {
          created_at: string | null
          data_batismo: string | null
          data_nascimento: string | null
          data_registro: string | null
          email: string | null
          endereco: string | null
          estado_civil: string | null
          foto_perfil: string | null
          id: string
          nome: string
          observacoes: string | null
          status: string | null
          telefone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data_batismo?: string | null
          data_nascimento?: string | null
          data_registro?: string | null
          email?: string | null
          endereco?: string | null
          estado_civil?: string | null
          foto_perfil?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          status?: string | null
          telefone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data_batismo?: string | null
          data_nascimento?: string | null
          data_registro?: string | null
          email?: string | null
          endereco?: string | null
          estado_civil?: string | null
          foto_perfil?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
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
      ministerio_voluntarios: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          funcao_principal_id: string | null
          id: string
          ministerio_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          funcao_principal_id?: string | null
          id?: string
          ministerio_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          funcao_principal_id?: string | null
          id?: string
          ministerio_id?: string
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
            referencedRelation: "ministerio_voluntarios"
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
          lider_id: string | null
          nome: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          contato?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          lider_id?: string | null
          nome: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          contato?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          lider_id?: string | null
          nome?: string
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
      salas_kids: {
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
          nome: string
          status: string
          total_membros: number
          total_visitantes: number
          visibilidade: string
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
      get_my_bases: { Args: never; Returns: Json }
      get_profile_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      leader_of_base: { Args: { _base_id: string }; Returns: boolean }
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
      participant_status: ["ativo", "saida", "pendente"],
      scale_status: ["confirmado", "pendente", "ausente"],
      user_status: ["ativo", "inativo", "pendente"],
    },
  },
} as const
