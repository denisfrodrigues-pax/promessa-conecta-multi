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
      configuracoes_instituicao: {
        Row: {
          banner_home_url: string | null
          banner_sou_novo_url: string | null
          chave_whatsapp: string | null
          cores: Json | null
          created_at: string | null
          email: string | null
          endereco: string | null
          favicon_url: string | null
          id: string
          logo_monochrome_url: string | null
          logo_url: string | null
          nome_igreja: string | null
          pix_info: Json | null
          telefone: string | null
          updated_at: string | null
          urls_transmissao: Json | null
        }
        Insert: {
          banner_home_url?: string | null
          banner_sou_novo_url?: string | null
          chave_whatsapp?: string | null
          cores?: Json | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          favicon_url?: string | null
          id?: string
          logo_monochrome_url?: string | null
          logo_url?: string | null
          nome_igreja?: string | null
          pix_info?: Json | null
          telefone?: string | null
          updated_at?: string | null
          urls_transmissao?: Json | null
        }
        Update: {
          banner_home_url?: string | null
          banner_sou_novo_url?: string | null
          chave_whatsapp?: string | null
          cores?: Json | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          favicon_url?: string | null
          id?: string
          logo_monochrome_url?: string | null
          logo_url?: string | null
          nome_igreja?: string | null
          pix_info?: Json | null
          telefone?: string | null
          updated_at?: string | null
          urls_transmissao?: Json | null
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
      escalas: {
        Row: {
          created_at: string | null
          created_by: string | null
          data: string
          funcao: string
          id: string
          justificativa: string | null
          ministerio_id: string | null
          status: Database["public"]["Enums"]["scale_status"] | null
          turno: string | null
          updated_at: string | null
          voluntario_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data: string
          funcao: string
          id?: string
          justificativa?: string | null
          ministerio_id?: string | null
          status?: Database["public"]["Enums"]["scale_status"] | null
          turno?: string | null
          updated_at?: string | null
          voluntario_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data?: string
          funcao?: string
          id?: string
          justificativa?: string | null
          ministerio_id?: string | null
          status?: Database["public"]["Enums"]["scale_status"] | null
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
      ministerios: {
        Row: {
          contato: string | null
          created_at: string | null
          descricao: string | null
          id: string
          lider_id: string | null
          nome: string
          updated_at: string | null
        }
        Insert: {
          contato?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          lider_id?: string | null
          nome: string
          updated_at?: string | null
        }
        Update: {
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
          created_at: string | null
          data_cadastro: string | null
          data_nascimento: string | null
          email: string
          endereco: string | null
          estado_civil: string | null
          foto_url: string | null
          id: string
          nome: string
          observacoes_privadas: string | null
          preferencias_notificacao: Json | null
          sexo: string | null
          status: Database["public"]["Enums"]["user_status"] | null
          telefone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data_cadastro?: string | null
          data_nascimento?: string | null
          email: string
          endereco?: string | null
          estado_civil?: string | null
          foto_url?: string | null
          id?: string
          nome: string
          observacoes_privadas?: string | null
          preferencias_notificacao?: Json | null
          sexo?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          telefone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data_cadastro?: string | null
          data_nascimento?: string | null
          email?: string
          endereco?: string | null
          estado_civil?: string | null
          foto_url?: string | null
          id?: string
          nome?: string
          observacoes_privadas?: string | null
          preferencias_notificacao?: Json | null
          sexo?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          telefone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_profile_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "lider" | "voluntario" | "membro" | "visitante"
      communication_type: "push" | "whatsapp" | "email"
      group_visibility: "publica" | "privada"
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
      app_role: ["admin", "lider", "voluntario", "membro", "visitante"],
      communication_type: ["push", "whatsapp", "email"],
      group_visibility: ["publica", "privada"],
      participant_status: ["ativo", "saida", "pendente"],
      scale_status: ["confirmado", "pendente", "ausente"],
      user_status: ["ativo", "inativo", "pendente"],
    },
  },
} as const
