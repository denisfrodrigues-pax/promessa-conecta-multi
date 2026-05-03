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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      avisos: {
        Row: {
          ativo: boolean
          church_id: string | null
          conteudo: string
          created_at: string
          created_by: string | null
          id: string
          titulo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          church_id?: string | null
          conteudo?: string
          created_at?: string
          created_by?: string | null
          id?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          church_id?: string | null
          conteudo?: string
          created_at?: string
          created_by?: string | null
          id?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "avisos_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avisos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avisos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "view_voluntariado"
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
            foreignKeyName: "avisos_culto_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avisos_culto_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "view_voluntariado"
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
      checkin_sessions: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          culto_id: string
          expires_at: string | null
          id: string
          igreja_id: string
          token: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          culto_id: string
          expires_at?: string | null
          id?: string
          igreja_id: string
          token: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          culto_id?: string
          expires_at?: string | null
          id?: string
          igreja_id?: string
          token?: string
        }
        Relationships: []
      }
      checkins: {
        Row: {
          checked_in_at: string
          checked_in_by: string | null
          checked_out_at: string | null
          crianca_id: string | null
          event_occurrence_id: string | null
          id: string
          igreja_id: string
          observacoes: string | null
          profile_id: string | null
          responsavel_id: string | null
          sala_id: string | null
        }
        Insert: {
          checked_in_at?: string
          checked_in_by?: string | null
          checked_out_at?: string | null
          crianca_id?: string | null
          event_occurrence_id?: string | null
          id?: string
          igreja_id: string
          observacoes?: string | null
          profile_id?: string | null
          responsavel_id?: string | null
          sala_id?: string | null
        }
        Update: {
          checked_in_at?: string
          checked_in_by?: string | null
          checked_out_at?: string | null
          crianca_id?: string | null
          event_occurrence_id?: string | null
          id?: string
          igreja_id?: string
          observacoes?: string | null
          profile_id?: string | null
          responsavel_id?: string | null
          sala_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkins_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "view_voluntariado"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_crianca_id_fkey"
            columns: ["crianca_id"]
            isOneToOne: false
            referencedRelation: "criancas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_event_occurrence_id_fkey"
            columns: ["event_occurrence_id"]
            isOneToOne: false
            referencedRelation: "event_occurrences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_event_occurrence_id_fkey"
            columns: ["event_occurrence_id"]
            isOneToOne: false
            referencedRelation: "view_presenca_eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "view_voluntariado"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "responsaveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_sala_id_fkey"
            columns: ["sala_id"]
            isOneToOne: false
            referencedRelation: "salas"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_instituicao: {
        Row: {
          church_id: string | null
          created_at: string
          id: string
          logo_url: string | null
          nome_igreja: string | null
          updated_at: string
        }
        Insert: {
          church_id?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          nome_igreja?: string | null
          updated_at?: string
        }
        Update: {
          church_id?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          nome_igreja?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_instituicao_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
        ]
      }
      convites_acesso: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          igreja_id: string
          profile_id: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          igreja_id: string
          profile_id: string
          status?: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          igreja_id?: string
          profile_id?: string
          status?: string
          token?: string
        }
        Relationships: []
      }
      criancas: {
        Row: {
          alergias: string | null
          ativo: boolean | null
          created_at: string
          data_nascimento: string | null
          foto_url: string | null
          id: string
          igreja_id: string
          nome: string
          observacoes: string | null
        }
        Insert: {
          alergias?: string | null
          ativo?: boolean | null
          created_at?: string
          data_nascimento?: string | null
          foto_url?: string | null
          id?: string
          igreja_id: string
          nome: string
          observacoes?: string | null
        }
        Update: {
          alergias?: string | null
          ativo?: boolean | null
          created_at?: string
          data_nascimento?: string | null
          foto_url?: string | null
          id?: string
          igreja_id?: string
          nome?: string
          observacoes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "criancas_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
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
            foreignKeyName: "culto_paleta_cores_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "culto_paleta_cores_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "view_voluntariado"
            referencedColumns: ["id"]
          },
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
      culto_presencas: {
        Row: {
          checkin_at: string
          culto_id: string
          id: string
          profile_id: string | null
          tipo_pessoa: string
          visitante_id: string | null
        }
        Insert: {
          checkin_at?: string
          culto_id: string
          id?: string
          profile_id?: string | null
          tipo_pessoa?: string
          visitante_id?: string | null
        }
        Update: {
          checkin_at?: string
          culto_id?: string
          id?: string
          profile_id?: string | null
          tipo_pessoa?: string
          visitante_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "culto_presencas_culto_id_fkey"
            columns: ["culto_id"]
            isOneToOne: false
            referencedRelation: "cultos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "culto_presencas_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "culto_presencas_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "view_voluntariado"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "culto_presencas_visitante_id_fkey"
            columns: ["visitante_id"]
            isOneToOne: false
            referencedRelation: "visitantes"
            referencedColumns: ["id"]
          },
        ]
      }
      cultos: {
        Row: {
          created_at: string
          data: string
          id: string
          igreja_id: string
          tipo: string | null
          titulo: string
        }
        Insert: {
          created_at?: string
          data?: string
          id?: string
          igreja_id: string
          tipo?: string | null
          titulo: string
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          igreja_id?: string
          tipo?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "cultos_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
        ]
      }
      escala_datas: {
        Row: {
          created_at: string | null
          data: string
          escala_id: string
          event_occurrence_id: string | null
          id: string
          igreja_id: string
        }
        Insert: {
          created_at?: string | null
          data: string
          escala_id: string
          event_occurrence_id?: string | null
          id?: string
          igreja_id: string
        }
        Update: {
          created_at?: string | null
          data?: string
          escala_id?: string
          event_occurrence_id?: string | null
          id?: string
          igreja_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "escala_datas_event_occurrence_id_fkey"
            columns: ["event_occurrence_id"]
            isOneToOne: false
            referencedRelation: "event_occurrences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escala_datas_event_occurrence_id_fkey"
            columns: ["event_occurrence_id"]
            isOneToOne: false
            referencedRelation: "view_presenca_eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      escala_musicas: {
        Row: {
          created_at: string
          escala_id: string
          id: string
          musica_id: string
          ordem: number | null
        }
        Insert: {
          created_at?: string
          escala_id: string
          id?: string
          musica_id: string
          ordem?: number | null
        }
        Update: {
          created_at?: string
          escala_id?: string
          id?: string
          musica_id?: string
          ordem?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "escala_musicas_escala_id_fkey"
            columns: ["escala_id"]
            isOneToOne: false
            referencedRelation: "escalas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escala_musicas_musica_id_fkey"
            columns: ["musica_id"]
            isOneToOne: false
            referencedRelation: "musicas"
            referencedColumns: ["id"]
          },
        ]
      }
      escala_pessoas: {
        Row: {
          confirmado: boolean | null
          created_at: string | null
          escala_data_id: string
          funcao: string | null
          id: string
          igreja_id: string
          profile_id: string
        }
        Insert: {
          confirmado?: boolean | null
          created_at?: string | null
          escala_data_id: string
          funcao?: string | null
          id?: string
          igreja_id: string
          profile_id: string
        }
        Update: {
          confirmado?: boolean | null
          created_at?: string | null
          escala_data_id?: string
          funcao?: string | null
          id?: string
          igreja_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "escala_pessoas_escala_data_id_fkey"
            columns: ["escala_data_id"]
            isOneToOne: false
            referencedRelation: "escala_datas"
            referencedColumns: ["id"]
          },
        ]
      }
      escalas: {
        Row: {
          confirmado_em: string | null
          created_at: string
          created_by: string | null
          data: string
          event_id: string | null
          evento_escala_id: string | null
          funcao: string | null
          horario: string | null
          id: string
          igreja_id: string
          justificativa: string | null
          ministerio_id: string
          responsavel_id: string | null
          status: string
          titulo: string
          voluntario_id: string | null
        }
        Insert: {
          confirmado_em?: string | null
          created_at?: string
          created_by?: string | null
          data: string
          event_id?: string | null
          evento_escala_id?: string | null
          funcao?: string | null
          horario?: string | null
          id?: string
          igreja_id: string
          justificativa?: string | null
          ministerio_id: string
          responsavel_id?: string | null
          status?: string
          titulo: string
          voluntario_id?: string | null
        }
        Update: {
          confirmado_em?: string | null
          created_at?: string
          created_by?: string | null
          data?: string
          event_id?: string | null
          evento_escala_id?: string | null
          funcao?: string | null
          horario?: string | null
          id?: string
          igreja_id?: string
          justificativa?: string | null
          ministerio_id?: string
          responsavel_id?: string | null
          status?: string
          titulo?: string
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
            foreignKeyName: "escalas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "view_voluntariado"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalas_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "eventos"
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
            foreignKeyName: "escalas_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
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
            foreignKeyName: "escalas_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "view_voluntariado"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalas_voluntario_id_fkey"
            columns: ["voluntario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalas_voluntario_id_fkey"
            columns: ["voluntario_id"]
            isOneToOne: false
            referencedRelation: "view_voluntariado"
            referencedColumns: ["id"]
          },
        ]
      }
      event_occurrences: {
        Row: {
          created_at: string | null
          end_time: string | null
          event_date: string
          event_id: string | null
          id: string
          start_time: string | null
          status: string | null
          tipo: string | null
        }
        Insert: {
          created_at?: string | null
          end_time?: string | null
          event_date: string
          event_id?: string | null
          id?: string
          start_time?: string | null
          status?: string | null
          tipo?: string | null
        }
        Update: {
          created_at?: string | null
          end_time?: string | null
          event_date?: string
          event_id?: string | null
          id?: string
          start_time?: string | null
          status?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_occurrences_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "eventos"
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
          cover_image_url: string | null
          created_at: string
          data_fim: string | null
          data_inicio: string
          descricao: string | null
          event_type: string | null
          id: string
          igreja_id: string
          imagem_url: string | null
          is_recurring: boolean | null
          local: string | null
          location: string | null
          publico: boolean | null
          recurrence_type: string | null
          status: string | null
          titulo: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio: string
          descricao?: string | null
          event_type?: string | null
          id?: string
          igreja_id: string
          imagem_url?: string | null
          is_recurring?: boolean | null
          local?: string | null
          location?: string | null
          publico?: boolean | null
          recurrence_type?: string | null
          status?: string | null
          titulo: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          descricao?: string | null
          event_type?: string | null
          id?: string
          igreja_id?: string
          imagem_url?: string | null
          is_recurring?: boolean | null
          local?: string | null
          location?: string | null
          publico?: boolean | null
          recurrence_type?: string | null
          status?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
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
      familias: {
        Row: {
          created_at: string | null
          id: string
          igreja_id: string
          nome: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          igreja_id: string
          nome: string
        }
        Update: {
          created_at?: string | null
          id?: string
          igreja_id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "familias_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
        ]
      }
      grupo_presencas: {
        Row: {
          created_at: string
          data: string
          id: string
          igreja_id: string
          ministerio_id: string
          presente: boolean | null
          profile_id: string
        }
        Insert: {
          created_at?: string
          data: string
          id?: string
          igreja_id: string
          ministerio_id: string
          presente?: boolean | null
          profile_id: string
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          igreja_id?: string
          ministerio_id?: string
          presente?: boolean | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grupo_presencas_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grupo_presencas_ministerio_id_fkey"
            columns: ["ministerio_id"]
            isOneToOne: false
            referencedRelation: "ministerios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grupo_presencas_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grupo_presencas_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "view_voluntariado"
            referencedColumns: ["id"]
          },
        ]
      }
      igrejas: {
        Row: {
          banco: string | null
          cep: string | null
          chave_pix: string | null
          cidade: string | null
          cnpj: string | null
          cor_primaria: string | null
          cor_secundaria: string | null
          created_at: string
          descricao: string | null
          descricao_curta: string | null
          email: string | null
          email_contato: string | null
          endereco_json: Json | null
          estado: string | null
          facebook: string | null
          fotos_publicas: string[] | null
          historia: string | null
          horarios_culto: Json | null
          horarios_culto_structured: Json | null
          id: string
          instagram: string | null
          limite_membros: number | null
          logo_url: string | null
          missao: string | null
          modulos_ativos: Json | null
          nome: string
          nome_pequeno_grupo: string | null
          pastores_json: Json | null
          pequeno_grupo_label: string | null
          plano: string | null
          slug: string
          status: string | null
          telefone: string | null
          teologia: string | null
          trial_ate: string | null
          valores: string | null
          visao: string | null
          whatsapp: string | null
          youtube: string | null
        }
        Insert: {
          banco?: string | null
          cep?: string | null
          chave_pix?: string | null
          cidade?: string | null
          cnpj?: string | null
          cor_primaria?: string | null
          cor_secundaria?: string | null
          created_at?: string
          descricao?: string | null
          descricao_curta?: string | null
          email?: string | null
          email_contato?: string | null
          endereco_json?: Json | null
          estado?: string | null
          facebook?: string | null
          fotos_publicas?: string[] | null
          historia?: string | null
          horarios_culto?: Json | null
          horarios_culto_structured?: Json | null
          id?: string
          instagram?: string | null
          limite_membros?: number | null
          logo_url?: string | null
          missao?: string | null
          modulos_ativos?: Json | null
          nome: string
          nome_pequeno_grupo?: string | null
          pastores_json?: Json | null
          pequeno_grupo_label?: string | null
          plano?: string | null
          slug: string
          status?: string | null
          telefone?: string | null
          teologia?: string | null
          trial_ate?: string | null
          valores?: string | null
          visao?: string | null
          whatsapp?: string | null
          youtube?: string | null
        }
        Update: {
          banco?: string | null
          cep?: string | null
          chave_pix?: string | null
          cidade?: string | null
          cnpj?: string | null
          cor_primaria?: string | null
          cor_secundaria?: string | null
          created_at?: string
          descricao?: string | null
          descricao_curta?: string | null
          email?: string | null
          email_contato?: string | null
          endereco_json?: Json | null
          estado?: string | null
          facebook?: string | null
          fotos_publicas?: string[] | null
          historia?: string | null
          horarios_culto?: Json | null
          horarios_culto_structured?: Json | null
          id?: string
          instagram?: string | null
          limite_membros?: number | null
          logo_url?: string | null
          missao?: string | null
          modulos_ativos?: Json | null
          nome?: string
          nome_pequeno_grupo?: string | null
          pastores_json?: Json | null
          pequeno_grupo_label?: string | null
          plano?: string | null
          slug?: string
          status?: string | null
          telefone?: string | null
          teologia?: string | null
          trial_ate?: string | null
          valores?: string | null
          visao?: string | null
          whatsapp?: string | null
          youtube?: string | null
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
            foreignKeyName: "liturgia_culto_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liturgia_culto_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "view_voluntariado"
            referencedColumns: ["id"]
          },
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
      ministerio_funcoes: {
        Row: {
          ativo: boolean
          created_at: string | null
          descricao: string | null
          id: string
          igreja_id: string
          ministerio_id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string | null
          descricao?: string | null
          id?: string
          igreja_id: string
          ministerio_id: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string | null
          descricao?: string | null
          id?: string
          igreja_id?: string
          ministerio_id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ministerio_funcoes_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ministerio_funcoes_ministerio_id_fkey"
            columns: ["ministerio_id"]
            isOneToOne: false
            referencedRelation: "ministerios"
            referencedColumns: ["id"]
          },
        ]
      }
      ministerio_membros: {
        Row: {
          created_at: string
          funcao_id: string | null
          id: string
          igreja_id: string
          is_lider: boolean | null
          ministerio_id: string
          nivel_permissao: number
          profile_id: string
        }
        Insert: {
          created_at?: string
          funcao_id?: string | null
          id?: string
          igreja_id: string
          is_lider?: boolean | null
          ministerio_id: string
          nivel_permissao?: number
          profile_id: string
        }
        Update: {
          created_at?: string
          funcao_id?: string | null
          id?: string
          igreja_id?: string
          is_lider?: boolean | null
          ministerio_id?: string
          nivel_permissao?: number
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ministerio_membros_funcao_id_fkey"
            columns: ["funcao_id"]
            isOneToOne: false
            referencedRelation: "ministerio_funcoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ministerio_membros_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ministerio_membros_ministerio_id_fkey"
            columns: ["ministerio_id"]
            isOneToOne: false
            referencedRelation: "ministerios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ministerio_membros_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ministerio_membros_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "view_voluntariado"
            referencedColumns: ["id"]
          },
        ]
      }
      ministerio_usuarios: {
        Row: {
          ativo: boolean
          created_at: string
          funcao_principal_id: string | null
          id: string
          ministerio_id: string
          papel: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          funcao_principal_id?: string | null
          id?: string
          ministerio_id: string
          papel?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          funcao_principal_id?: string | null
          id?: string
          ministerio_id?: string
          papel?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ministerio_usuarios_funcao_principal_id_fkey"
            columns: ["funcao_principal_id"]
            isOneToOne: false
            referencedRelation: "ministerio_funcoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ministerio_usuarios_ministerio_id_fkey"
            columns: ["ministerio_id"]
            isOneToOne: false
            referencedRelation: "ministerios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ministerio_usuarios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ministerio_usuarios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "view_voluntariado"
            referencedColumns: ["id"]
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
          created_at: string
          descricao: string | null
          id: string
          igreja_id: string
          nome: string
          tipo: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          descricao?: string | null
          id?: string
          igreja_id: string
          nome: string
          tipo?: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          descricao?: string | null
          id?: string
          igreja_id?: string
          nome?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "ministerios_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
        ]
      }
      musicas: {
        Row: {
          artista: string | null
          ativo: boolean | null
          created_at: string
          id: string
          igreja_id: string
          letra: string | null
          link: string | null
          titulo: string
          tom: string | null
        }
        Insert: {
          artista?: string | null
          ativo?: boolean | null
          created_at?: string
          id?: string
          igreja_id: string
          letra?: string | null
          link?: string | null
          titulo: string
          tom?: string | null
        }
        Update: {
          artista?: string | null
          ativo?: boolean | null
          created_at?: string
          id?: string
          igreja_id?: string
          letra?: string | null
          link?: string | null
          titulo?: string
          tom?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "musicas_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
        ]
      }
      musicas_culto: {
        Row: {
          artista_avulso: string | null
          created_at: string
          created_by: string | null
          evento_id: string
          id: string
          link_youtube: string | null
          ministerio_id: string
          musica_id: string | null
          ordem: number
          titulo_avulso: string | null
        }
        Insert: {
          artista_avulso?: string | null
          created_at?: string
          created_by?: string | null
          evento_id: string
          id?: string
          link_youtube?: string | null
          ministerio_id: string
          musica_id?: string | null
          ordem?: number
          titulo_avulso?: string | null
        }
        Update: {
          artista_avulso?: string | null
          created_at?: string
          created_by?: string | null
          evento_id?: string
          id?: string
          link_youtube?: string | null
          ministerio_id?: string
          musica_id?: string | null
          ordem?: number
          titulo_avulso?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "musicas_culto_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "musicas_culto_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "view_voluntariado"
            referencedColumns: ["id"]
          },
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
          church_id: string
          cifra_url: string | null
          created_at: string
          created_by: string | null
          id: string
          link_youtube: string | null
          ministerio_id: string
          observacoes: string | null
          titulo: string
          tom: string | null
          updated_at: string
        }
        Insert: {
          artista?: string | null
          church_id: string
          cifra_url?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          link_youtube?: string | null
          ministerio_id: string
          observacoes?: string | null
          titulo: string
          tom?: string | null
          updated_at?: string
        }
        Update: {
          artista?: string | null
          church_id?: string
          cifra_url?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
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
            foreignKeyName: "musicas_repertorio_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "musicas_repertorio_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "view_voluntariado"
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
      notificacoes: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          igreja_id: string
          lida: boolean | null
          link: string | null
          mensagem: string | null
          profile_id: string
          tipo: string | null
          titulo: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          igreja_id?: string
          lida?: boolean | null
          link?: string | null
          mensagem?: string | null
          profile_id: string
          tipo?: string | null
          titulo: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          igreja_id?: string
          lida?: boolean | null
          link?: string | null
          mensagem?: string | null
          profile_id?: string
          tipo?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "view_voluntariado"
            referencedColumns: ["id"]
          },
        ]
      }
      occurrence_ministerios: {
        Row: {
          created_at: string | null
          id: string
          ministerio_id: string | null
          occurrence_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ministerio_id?: string | null
          occurrence_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ministerio_id?: string | null
          occurrence_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "occurrence_ministerios_ministerio_id_fkey"
            columns: ["ministerio_id"]
            isOneToOne: false
            referencedRelation: "ministerios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occurrence_ministerios_occurrence_id_fkey"
            columns: ["occurrence_id"]
            isOneToOne: false
            referencedRelation: "event_occurrences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occurrence_ministerios_occurrence_id_fkey"
            columns: ["occurrence_id"]
            isOneToOne: false
            referencedRelation: "view_presenca_eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_oracao: {
        Row: {
          anonimo: boolean
          contato: string | null
          created_at: string
          email: string | null
          id: string
          igreja_id: string
          nome: string
          pedido: string
          status: string
          telefone: string | null
        }
        Insert: {
          anonimo?: boolean
          contato?: string | null
          created_at?: string
          email?: string | null
          id?: string
          igreja_id: string
          nome: string
          pedido: string
          status?: string
          telefone?: string | null
        }
        Update: {
          anonimo?: boolean
          contato?: string | null
          created_at?: string
          email?: string | null
          id?: string
          igreja_id?: string
          nome?: string
          pedido?: string
          status?: string
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_oracao_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
        ]
      }
      pequeno_grupo_membros: {
        Row: {
          created_at: string | null
          id: string
          igreja_id: string
          papel: string | null
          pequeno_grupo_id: string
          profile_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          igreja_id: string
          papel?: string | null
          pequeno_grupo_id: string
          profile_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          igreja_id?: string
          papel?: string | null
          pequeno_grupo_id?: string
          profile_id?: string
        }
        Relationships: []
      }
      pequenos_grupos: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          dia_semana: string | null
          endereco: string | null
          horario: string | null
          id: string
          igreja_id: string
          lider_id: string | null
          nome: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          dia_semana?: string | null
          endereco?: string | null
          horario?: string | null
          id?: string
          igreja_id: string
          lider_id?: string | null
          nome: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          dia_semana?: string | null
          endereco?: string | null
          horario?: string | null
          id?: string
          igreja_id?: string
          lider_id?: string | null
          nome?: string
        }
        Relationships: []
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
          {
            foreignKeyName: "periodos_escala_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "periodos_escala_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "view_voluntariado"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean | null
          batizado_aguas: boolean | null
          cpf: string | null
          created_at: string
          curso: string | null
          data_nascimento: string | null
          email: string | null
          endereco_json: Json | null
          estado_civil: string | null
          familia_id: string | null
          foto_url: string | null
          grau_instrucao: string | null
          id: string
          igreja_id: string | null
          nacionalidade: string | null
          naturalidade: string | null
          nome: string | null
          nome_mae: string | null
          nome_pai: string | null
          observacoes: string | null
          ordenacao_json: Json | null
          origem_batismo_json: Json | null
          papel_familia: string | null
          pcd: string | null
          profissao: string | null
          rg: string | null
          rg_orgao: string | null
          role_global: string
          sexo: string | null
          status: string
          telefone: string | null
        }
        Insert: {
          ativo?: boolean | null
          batizado_aguas?: boolean | null
          cpf?: string | null
          created_at?: string
          curso?: string | null
          data_nascimento?: string | null
          email?: string | null
          endereco_json?: Json | null
          estado_civil?: string | null
          familia_id?: string | null
          foto_url?: string | null
          grau_instrucao?: string | null
          id?: string
          igreja_id?: string | null
          nacionalidade?: string | null
          naturalidade?: string | null
          nome?: string | null
          nome_mae?: string | null
          nome_pai?: string | null
          observacoes?: string | null
          ordenacao_json?: Json | null
          origem_batismo_json?: Json | null
          papel_familia?: string | null
          pcd?: string | null
          profissao?: string | null
          rg?: string | null
          rg_orgao?: string | null
          role_global?: string
          sexo?: string | null
          status?: string
          telefone?: string | null
        }
        Update: {
          ativo?: boolean | null
          batizado_aguas?: boolean | null
          cpf?: string | null
          created_at?: string
          curso?: string | null
          data_nascimento?: string | null
          email?: string | null
          endereco_json?: Json | null
          estado_civil?: string | null
          familia_id?: string | null
          foto_url?: string | null
          grau_instrucao?: string | null
          id?: string
          igreja_id?: string | null
          nacionalidade?: string | null
          naturalidade?: string | null
          nome?: string | null
          nome_mae?: string | null
          nome_pai?: string | null
          observacoes?: string | null
          ordenacao_json?: Json | null
          origem_batismo_json?: Json | null
          papel_familia?: string | null
          pcd?: string | null
          profissao?: string | null
          rg?: string | null
          rg_orgao?: string | null
          role_global?: string
          sexo?: string | null
          status?: string
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_familia_id_fkey"
            columns: ["familia_id"]
            isOneToOne: false
            referencedRelation: "familias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
        ]
      }
      responsaveis: {
        Row: {
          created_at: string
          crianca_id: string
          id: string
          igreja_id: string
          nome: string
          parentesco: string | null
          profile_id: string | null
          telefone: string | null
        }
        Insert: {
          created_at?: string
          crianca_id: string
          id?: string
          igreja_id: string
          nome: string
          parentesco?: string | null
          profile_id?: string | null
          telefone?: string | null
        }
        Update: {
          created_at?: string
          crianca_id?: string
          id?: string
          igreja_id?: string
          nome?: string
          parentesco?: string | null
          profile_id?: string | null
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "responsaveis_crianca_id_fkey"
            columns: ["crianca_id"]
            isOneToOne: false
            referencedRelation: "criancas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responsaveis_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responsaveis_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responsaveis_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "view_voluntariado"
            referencedColumns: ["id"]
          },
        ]
      }
      roteiros: {
        Row: {
          created_at: string
          escala_id: string | null
          estrutura_json: Json | null
          id: string
          igreja_id: string
          tema: string | null
          texto_base: string | null
        }
        Insert: {
          created_at?: string
          escala_id?: string | null
          estrutura_json?: Json | null
          id?: string
          igreja_id: string
          tema?: string | null
          texto_base?: string | null
        }
        Update: {
          created_at?: string
          escala_id?: string | null
          estrutura_json?: Json | null
          id?: string
          igreja_id?: string
          tema?: string | null
          texto_base?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roteiros_escala_id_fkey"
            columns: ["escala_id"]
            isOneToOne: false
            referencedRelation: "escalas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roteiros_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
        ]
      }
      salas: {
        Row: {
          ativo: boolean | null
          capacidade: number | null
          created_at: string
          faixa_etaria: string | null
          id: string
          igreja_id: string
          nome: string
        }
        Insert: {
          ativo?: boolean | null
          capacidade?: number | null
          created_at?: string
          faixa_etaria?: string | null
          id?: string
          igreja_id: string
          nome: string
        }
        Update: {
          ativo?: boolean | null
          capacidade?: number | null
          created_at?: string
          faixa_etaria?: string | null
          id?: string
          igreja_id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "salas_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
        ]
      }
      turma_membros: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          turma_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          turma_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          turma_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "turma_membros_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turma_membros_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "view_voluntariado"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turma_membros_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      turma_presencas: {
        Row: {
          created_at: string
          data: string
          id: string
          presente: boolean | null
          profile_id: string
          turma_id: string
        }
        Insert: {
          created_at?: string
          data: string
          id?: string
          presente?: boolean | null
          profile_id: string
          turma_id: string
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          presente?: boolean | null
          profile_id?: string
          turma_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "turma_presencas_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turma_presencas_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "view_voluntariado"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turma_presencas_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      turmas: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          igreja_id: string
          ministerio_id: string
          nome: string
          status: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          igreja_id: string
          ministerio_id: string
          nome: string
          status?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          igreja_id?: string
          ministerio_id?: string
          nome?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "turmas_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turmas_ministerio_id_fkey"
            columns: ["ministerio_id"]
            isOneToOne: false
            referencedRelation: "ministerios"
            referencedColumns: ["id"]
          },
        ]
      }
      visitantes: {
        Row: {
          created_at: string
          email: string | null
          id: string
          igreja_id: string
          nome: string
          observacoes: string | null
          origem: string | null
          status: string | null
          telefone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          igreja_id: string
          nome: string
          observacoes?: string | null
          origem?: string | null
          status?: string | null
          telefone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          igreja_id?: string
          nome?: string
          observacoes?: string | null
          origem?: string | null
          status?: string | null
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visitantes_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      view_presenca_eventos: {
        Row: {
          event_date: string | null
          id: string | null
          presentes: number | null
          titulo: string | null
        }
        Relationships: []
      }
      view_voluntariado: {
        Row: {
          id: string | null
          igreja_id: string | null
          nome: string | null
          total_servicos: number | null
          ultimo_servico: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igrejas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      checkin_by_token: {
        Args: { p_profile: string; p_token: string }
        Returns: undefined
      }
      create_notification: {
        Args: { p_mensagem: string; p_profile: string; p_titulo: string }
        Returns: undefined
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
      get_invite_by_token: {
        Args: { p_token: string }
        Returns: {
          invite_email: string
          invite_status: string
          profile_nome: string
        }[]
      }
      get_my_igreja_id: { Args: never; Returns: string }
      get_my_status: { Args: never; Returns: string }
      merge_invited_profile: {
        Args: { p_token: string; p_user_id: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
<claude-code-hint v="1" type="plugin" value="supabase@claude-plugins-official" />
