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
      clientes_indicadas: {
        Row: {
          contato: string | null
          id: string
          indicado_em: string
          nome: string
          profile_id: string
        }
        Insert: {
          contato?: string | null
          id?: string
          indicado_em?: string
          nome: string
          profile_id: string
        }
        Update: {
          contato?: string | null
          id?: string
          indicado_em?: string
          nome?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_indicadas_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cnpjs_reconhecidos: {
        Row: {
          cnpj_cpf: string
          created_at: string
          id: string
          nome_loja: string | null
        }
        Insert: {
          cnpj_cpf: string
          created_at?: string
          id?: string
          nome_loja?: string | null
        }
        Update: {
          cnpj_cpf?: string
          created_at?: string
          id?: string
          nome_loja?: string | null
        }
        Relationships: []
      }
      colecoes: {
        Row: {
          ativa: boolean
          created_at: string
          id: string
          imagem_url: string | null
          nome: string
          tipo: string
          tone: string
        }
        Insert: {
          ativa?: boolean
          created_at?: string
          id?: string
          imagem_url?: string | null
          nome: string
          tipo: string
          tone?: string
        }
        Update: {
          ativa?: boolean
          created_at?: string
          id?: string
          imagem_url?: string | null
          nome?: string
          tipo?: string
          tone?: string
        }
        Relationships: []
      }
      compras_registradas: {
        Row: {
          created_at: string | null
          data_compra: string
          id: string
          lancado_por: string
          profile_id: string
          valor_reais: number
        }
        Insert: {
          created_at?: string | null
          data_compra?: string
          id?: string
          lancado_por: string
          profile_id: string
          valor_reais: number
        }
        Update: {
          created_at?: string | null
          data_compra?: string
          id?: string
          lancado_por?: string
          profile_id?: string
          valor_reais?: number
        }
        Relationships: [
          {
            foreignKeyName: "compras_registradas_lancado_por_fkey"
            columns: ["lancado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_registradas_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conquistas: {
        Row: {
          data_conquista: string | null
          id: string
          profile_id: string
          referencia_id: string
          tipo: string
          titulo: string
        }
        Insert: {
          data_conquista?: string | null
          id?: string
          profile_id: string
          referencia_id: string
          tipo: string
          titulo: string
        }
        Update: {
          data_conquista?: string | null
          id?: string
          profile_id?: string
          referencia_id?: string
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "conquistas_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_deletadas: {
        Row: {
          cadastrado_em: string | null
          cnpj_cpf: string | null
          deletado_em: string | null
          id: string
          nome: string | null
          nome_loja: string | null
          status_cadastro_final: string | null
          whatsapp: string | null
        }
        Insert: {
          cadastrado_em?: string | null
          cnpj_cpf?: string | null
          deletado_em?: string | null
          id?: string
          nome?: string | null
          nome_loja?: string | null
          status_cadastro_final?: string | null
          whatsapp?: string | null
        }
        Update: {
          cadastrado_em?: string | null
          cnpj_cpf?: string | null
          deletado_em?: string | null
          id?: string
          nome?: string | null
          nome_loja?: string | null
          status_cadastro_final?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      curso_modulos: {
        Row: {
          created_at: string
          curso_id: string
          id: string
          ordem: number
          tipo: string
          titulo: string
          url_conteudo: string | null
        }
        Insert: {
          created_at?: string
          curso_id: string
          id?: string
          ordem?: number
          tipo: string
          titulo: string
          url_conteudo?: string | null
        }
        Update: {
          created_at?: string
          curso_id?: string
          id?: string
          ordem?: number
          tipo?: string
          titulo?: string
          url_conteudo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "curso_modulos_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      curso_progresso: {
        Row: {
          created_at: string
          curso_id: string
          id: string
          maior_ponto_assistido_segundos: number | null
          percentual: number
          profile_id: string
          tempo_assistido_segundos: number | null
          ultimo_modulo_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          curso_id: string
          id?: string
          maior_ponto_assistido_segundos?: number | null
          percentual?: number
          profile_id: string
          tempo_assistido_segundos?: number | null
          ultimo_modulo_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          curso_id?: string
          id?: string
          maior_ponto_assistido_segundos?: number | null
          percentual?: number
          profile_id?: string
          tempo_assistido_segundos?: number | null
          ultimo_modulo_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "curso_progresso_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curso_progresso_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curso_progresso_ultimo_modulo_id_fkey"
            columns: ["ultimo_modulo_id"]
            isOneToOne: false
            referencedRelation: "curso_modulos"
            referencedColumns: ["id"]
          },
        ]
      }
      cursos: {
        Row: {
          ativo: boolean
          categoria: string | null
          created_at: string
          descricao: string | null
          duracao_min: number | null
          id: string
          is_novo: boolean
          thumbnail_url: string | null
          titulo: string
          tone: string
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          duracao_min?: number | null
          id?: string
          is_novo?: boolean
          thumbnail_url?: string | null
          titulo: string
          tone?: string
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          duracao_min?: number | null
          id?: string
          is_novo?: boolean
          thumbnail_url?: string | null
          titulo?: string
          tone?: string
        }
        Relationships: []
      }
      favoritos: {
        Row: {
          created_at: string
          id: string
          peca_id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          peca_id: string
          profile_id: string
        }
        Update: {
          created_at?: string
          id?: string
          peca_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favoritos_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favoritos_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favoritos_materiais: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          recurso_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          recurso_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          recurso_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favoritos_materiais_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favoritos_materiais_recurso_id_fkey"
            columns: ["recurso_id"]
            isOneToOne: false
            referencedRelation: "recursos_materiais"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_envios: {
        Row: {
          cor: string | null
          created_at: string
          favorito: boolean
          id: string
          image_url: string | null
          peca_nome: string
          peca_referencia: string | null
          profile_id: string
          tamanho: string | null
        }
        Insert: {
          cor?: string | null
          created_at?: string
          favorito?: boolean
          id?: string
          image_url?: string | null
          peca_nome: string
          peca_referencia?: string | null
          profile_id: string
          tamanho?: string | null
        }
        Update: {
          cor?: string | null
          created_at?: string
          favorito?: boolean
          id?: string
          image_url?: string | null
          peca_nome?: string
          peca_referencia?: string | null
          profile_id?: string
          tamanho?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_envios_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ia_conversas: {
        Row: {
          colecao_relacionada_id: string | null
          created_at: string
          favorita: boolean
          id: string
          peca_relacionada_id: string | null
          persona: string
          profile_id: string
          titulo: string | null
        }
        Insert: {
          colecao_relacionada_id?: string | null
          created_at?: string
          favorita?: boolean
          id?: string
          peca_relacionada_id?: string | null
          persona: string
          profile_id: string
          titulo?: string | null
        }
        Update: {
          colecao_relacionada_id?: string | null
          created_at?: string
          favorita?: boolean
          id?: string
          peca_relacionada_id?: string | null
          persona?: string
          profile_id?: string
          titulo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ia_conversas_colecao_relacionada_id_fkey"
            columns: ["colecao_relacionada_id"]
            isOneToOne: false
            referencedRelation: "colecoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ia_conversas_peca_relacionada_id_fkey"
            columns: ["peca_relacionada_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ia_conversas_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ia_mensagens: {
        Row: {
          autor: string
          conteudo: string
          conversa_id: string
          created_at: string
          id: string
        }
        Insert: {
          autor: string
          conteudo: string
          conversa_id: string
          created_at?: string
          id?: string
        }
        Update: {
          autor?: string
          conteudo?: string
          conversa_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ia_mensagens_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "ia_conversas"
            referencedColumns: ["id"]
          },
        ]
      }
      mizloja_admins: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id: string
          nome: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      mizloja_alteracoes: {
        Row: {
          acao: string
          antes: Json | null
          created_at: string
          depois: Json | null
          id: string
          loja_id: string
          motivo: string | null
          usuaria_id: string | null
          venda_id: string
        }
        Insert: {
          acao: string
          antes?: Json | null
          created_at?: string
          depois?: Json | null
          id?: string
          loja_id: string
          motivo?: string | null
          usuaria_id?: string | null
          venda_id: string
        }
        Update: {
          acao?: string
          antes?: Json | null
          created_at?: string
          depois?: Json | null
          id?: string
          loja_id?: string
          motivo?: string | null
          usuaria_id?: string | null
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mizloja_alteracoes_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "mizloja_lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mizloja_alteracoes_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "mizloja_vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      mizloja_clientes: {
        Row: {
          aniv_ano: number | null
          aniv_dia: number | null
          aniv_mes: number | null
          cadastrada_por: string | null
          cores_preferidas: string[]
          created_at: string
          etapa_manual: string | null
          id: string
          intervalo_medio_dias: number | null
          loja_id: string
          nome: string
          nome_busca: string
          num_compras: number
          observacoes: string | null
          origem: string
          pecas_miz_compradas: Json
          primeira_compra_em: string | null
          recado_transferencia: string | null
          tamanho_preferido: string | null
          ticket_medio: number | null
          total_gasto: number
          ultima_compra_em: string | null
          ultimo_contato_em: string | null
          ultimo_contato_por: string | null
          updated_at: string
          vendedora_id: string | null
          whatsapp: string
        }
        Insert: {
          aniv_ano?: number | null
          aniv_dia?: number | null
          aniv_mes?: number | null
          cadastrada_por?: string | null
          cores_preferidas?: string[]
          created_at?: string
          etapa_manual?: string | null
          id?: string
          intervalo_medio_dias?: number | null
          loja_id: string
          nome: string
          nome_busca: string
          num_compras?: number
          observacoes?: string | null
          origem?: string
          pecas_miz_compradas?: Json
          primeira_compra_em?: string | null
          recado_transferencia?: string | null
          tamanho_preferido?: string | null
          ticket_medio?: number | null
          total_gasto?: number
          ultima_compra_em?: string | null
          ultimo_contato_em?: string | null
          ultimo_contato_por?: string | null
          updated_at?: string
          vendedora_id?: string | null
          whatsapp: string
        }
        Update: {
          aniv_ano?: number | null
          aniv_dia?: number | null
          aniv_mes?: number | null
          cadastrada_por?: string | null
          cores_preferidas?: string[]
          created_at?: string
          etapa_manual?: string | null
          id?: string
          intervalo_medio_dias?: number | null
          loja_id?: string
          nome?: string
          nome_busca?: string
          num_compras?: number
          observacoes?: string | null
          origem?: string
          pecas_miz_compradas?: Json
          primeira_compra_em?: string | null
          recado_transferencia?: string | null
          tamanho_preferido?: string | null
          ticket_medio?: number | null
          total_gasto?: number
          ultima_compra_em?: string | null
          ultimo_contato_em?: string | null
          ultimo_contato_por?: string | null
          updated_at?: string
          vendedora_id?: string | null
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "mizloja_clientes_cadastrada_por_fkey"
            columns: ["cadastrada_por"]
            isOneToOne: false
            referencedRelation: "mizloja_usuarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mizloja_clientes_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "mizloja_lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mizloja_clientes_ultimo_contato_por_fkey"
            columns: ["ultimo_contato_por"]
            isOneToOne: false
            referencedRelation: "mizloja_usuarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mizloja_clientes_vendedora_id_fkey"
            columns: ["vendedora_id"]
            isOneToOne: false
            referencedRelation: "mizloja_usuarias"
            referencedColumns: ["id"]
          },
        ]
      }
      mizloja_config: {
        Row: {
          atualizado_por: string | null
          dias_comprou: number
          dias_followup_conversa: number
          dias_followup_recontato: number
          dias_inativa: number
          dias_pos_venda: number
          dias_pos_venda_limite: number
          dias_recompra: number
          dias_sumida: number
          loja_id: string
          ranking_visivel: boolean
          updated_at: string
          visibilidade_vendedora: string
        }
        Insert: {
          atualizado_por?: string | null
          dias_comprou?: number
          dias_followup_conversa?: number
          dias_followup_recontato?: number
          dias_inativa?: number
          dias_pos_venda?: number
          dias_pos_venda_limite?: number
          dias_recompra?: number
          dias_sumida?: number
          loja_id: string
          ranking_visivel?: boolean
          updated_at?: string
          visibilidade_vendedora?: string
        }
        Update: {
          atualizado_por?: string | null
          dias_comprou?: number
          dias_followup_conversa?: number
          dias_followup_recontato?: number
          dias_inativa?: number
          dias_pos_venda?: number
          dias_pos_venda_limite?: number
          dias_recompra?: number
          dias_sumida?: number
          loja_id?: string
          ranking_visivel?: boolean
          updated_at?: string
          visibilidade_vendedora?: string
        }
        Relationships: [
          {
            foreignKeyName: "mizloja_config_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: true
            referencedRelation: "mizloja_lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      mizloja_contatos: {
        Row: {
          cliente_id: string
          created_at: string
          id: string
          loja_id: string
          pasta: string | null
          usuaria_id: string | null
        }
        Insert: {
          cliente_id: string
          created_at?: string
          id?: string
          loja_id: string
          pasta?: string | null
          usuaria_id?: string | null
        }
        Update: {
          cliente_id?: string
          created_at?: string
          id?: string
          loja_id?: string
          pasta?: string | null
          usuaria_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mizloja_contatos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "mizloja_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mizloja_contatos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "mizloja_v_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mizloja_contatos_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "mizloja_lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mizloja_contatos_usuaria_id_fkey"
            columns: ["usuaria_id"]
            isOneToOne: false
            referencedRelation: "mizloja_usuarias"
            referencedColumns: ["id"]
          },
        ]
      }
      mizloja_lojas: {
        Row: {
          cidade: string
          cnpj: string
          created_at: string
          criado_por: string | null
          id: string
          nome: string
          situacao: string
          uf: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          cidade: string
          cnpj: string
          created_at?: string
          criado_por?: string | null
          id?: string
          nome: string
          situacao?: string
          uf: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          cidade?: string
          cnpj?: string
          created_at?: string
          criado_por?: string | null
          id?: string
          nome?: string
          situacao?: string
          uf?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      mizloja_mensagens: {
        Row: {
          atualizado_por: string | null
          loja_id: string
          texto: string
          tipo: string
          updated_at: string
        }
        Insert: {
          atualizado_por?: string | null
          loja_id: string
          texto: string
          tipo: string
          updated_at?: string
        }
        Update: {
          atualizado_por?: string | null
          loja_id?: string
          texto?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mizloja_mensagens_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "mizloja_lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      mizloja_metas: {
        Row: {
          created_at: string
          criado_por: string | null
          id: string
          loja_id: string
          mes: string
          premio_condicao_pct: number
          premio_descricao: string | null
          premio_extra_descricao: string | null
          premio_extra_pct: number | null
          publicada_em: string | null
          status: string
          updated_at: string
          valor_loja: number
        }
        Insert: {
          created_at?: string
          criado_por?: string | null
          id?: string
          loja_id: string
          mes: string
          premio_condicao_pct?: number
          premio_descricao?: string | null
          premio_extra_descricao?: string | null
          premio_extra_pct?: number | null
          publicada_em?: string | null
          status?: string
          updated_at?: string
          valor_loja: number
        }
        Update: {
          created_at?: string
          criado_por?: string | null
          id?: string
          loja_id?: string
          mes?: string
          premio_condicao_pct?: number
          premio_descricao?: string | null
          premio_extra_descricao?: string | null
          premio_extra_pct?: number | null
          publicada_em?: string | null
          status?: string
          updated_at?: string
          valor_loja?: number
        }
        Relationships: [
          {
            foreignKeyName: "mizloja_metas_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "mizloja_lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      mizloja_metas_vendedoras: {
        Row: {
          id: string
          loja_id: string
          meta_id: string
          premio_elegivel: boolean
          usuaria_id: string
          valor: number | null
        }
        Insert: {
          id?: string
          loja_id: string
          meta_id: string
          premio_elegivel?: boolean
          usuaria_id: string
          valor?: number | null
        }
        Update: {
          id?: string
          loja_id?: string
          meta_id?: string
          premio_elegivel?: boolean
          usuaria_id?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mizloja_metas_vendedoras_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "mizloja_lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mizloja_metas_vendedoras_meta_id_fkey"
            columns: ["meta_id"]
            isOneToOne: false
            referencedRelation: "mizloja_metas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mizloja_metas_vendedoras_usuaria_id_fkey"
            columns: ["usuaria_id"]
            isOneToOne: false
            referencedRelation: "mizloja_usuarias"
            referencedColumns: ["id"]
          },
        ]
      }
      mizloja_peca_cores: {
        Row: {
          created_at: string
          id: string
          nome: string
          ordem: number
          origem_id: string | null
          peca_id: string
          valor: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          ordem?: number
          origem_id?: string | null
          peca_id: string
          valor: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          ordem?: number
          origem_id?: string | null
          peca_id?: string
          valor?: string
        }
        Relationships: [
          {
            foreignKeyName: "mizloja_peca_cores_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "mizloja_pecas"
            referencedColumns: ["id"]
          },
        ]
      }
      mizloja_peca_imagens: {
        Row: {
          created_at: string
          id: string
          ordem: number
          peca_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          ordem?: number
          peca_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          ordem?: number
          peca_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "mizloja_peca_imagens_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "mizloja_pecas"
            referencedColumns: ["id"]
          },
        ]
      }
      mizloja_peca_tamanhos: {
        Row: {
          id: string
          ordem: number
          peca_id: string
          valor: string
        }
        Insert: {
          id?: string
          ordem?: number
          peca_id: string
          valor: string
        }
        Update: {
          id?: string
          ordem?: number
          peca_id?: string
          valor?: string
        }
        Relationships: [
          {
            foreignKeyName: "mizloja_peca_tamanhos_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "mizloja_pecas"
            referencedColumns: ["id"]
          },
        ]
      }
      mizloja_pecas: {
        Row: {
          ativa: boolean
          categoria: string | null
          codigo_referencia: string
          created_at: string
          esgotado: boolean
          id: string
          nome: string
          origem_id: string | null
          updated_at: string
        }
        Insert: {
          ativa?: boolean
          categoria?: string | null
          codigo_referencia: string
          created_at?: string
          esgotado?: boolean
          id?: string
          nome: string
          origem_id?: string | null
          updated_at?: string
        }
        Update: {
          ativa?: boolean
          categoria?: string | null
          codigo_referencia?: string
          created_at?: string
          esgotado?: boolean
          id?: string
          nome?: string
          origem_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      mizloja_pulos: {
        Row: {
          cliente_id: string
          created_at: string
          data: string
          id: string
          loja_id: string
          usuaria_id: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data?: string
          id?: string
          loja_id: string
          usuaria_id?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data?: string
          id?: string
          loja_id?: string
          usuaria_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mizloja_pulos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "mizloja_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mizloja_pulos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "mizloja_v_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mizloja_pulos_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "mizloja_lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mizloja_pulos_usuaria_id_fkey"
            columns: ["usuaria_id"]
            isOneToOne: false
            referencedRelation: "mizloja_usuarias"
            referencedColumns: ["id"]
          },
        ]
      }
      mizloja_transferencias: {
        Row: {
          cliente_id: string
          created_at: string
          criado_por: string | null
          de_usuaria_id: string | null
          id: string
          loja_id: string
          motivo: string
          para_usuaria_id: string
          recado: string | null
        }
        Insert: {
          cliente_id: string
          created_at?: string
          criado_por?: string | null
          de_usuaria_id?: string | null
          id?: string
          loja_id: string
          motivo: string
          para_usuaria_id: string
          recado?: string | null
        }
        Update: {
          cliente_id?: string
          created_at?: string
          criado_por?: string | null
          de_usuaria_id?: string | null
          id?: string
          loja_id?: string
          motivo?: string
          para_usuaria_id?: string
          recado?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mizloja_transferencias_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "mizloja_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mizloja_transferencias_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "mizloja_v_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mizloja_transferencias_de_usuaria_id_fkey"
            columns: ["de_usuaria_id"]
            isOneToOne: false
            referencedRelation: "mizloja_usuarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mizloja_transferencias_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "mizloja_lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mizloja_transferencias_para_usuaria_id_fkey"
            columns: ["para_usuaria_id"]
            isOneToOne: false
            referencedRelation: "mizloja_usuarias"
            referencedColumns: ["id"]
          },
        ]
      }
      mizloja_usuarias: {
        Row: {
          created_at: string
          criado_por: string | null
          email: string | null
          id: string
          loja_id: string
          nome: string
          perfil: string
          precisa_trocar_senha: boolean
          situacao: string
          ultimo_acesso_em: string | null
          updated_at: string
          usuario: string
          whatsapp: string
        }
        Insert: {
          created_at?: string
          criado_por?: string | null
          email?: string | null
          id: string
          loja_id: string
          nome: string
          perfil: string
          precisa_trocar_senha?: boolean
          situacao?: string
          ultimo_acesso_em?: string | null
          updated_at?: string
          usuario: string
          whatsapp: string
        }
        Update: {
          created_at?: string
          criado_por?: string | null
          email?: string | null
          id?: string
          loja_id?: string
          nome?: string
          perfil?: string
          precisa_trocar_senha?: boolean
          situacao?: string
          ultimo_acesso_em?: string | null
          updated_at?: string
          usuario?: string
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "mizloja_usuarias_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "mizloja_lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      mizloja_venda_itens: {
        Row: {
          cor: string
          cor_hex: string | null
          created_at: string
          id: string
          loja_id: string
          peca_codigo: string | null
          peca_cor_id: string | null
          peca_id: string | null
          peca_nome: string | null
          quantidade: number
          tamanho: string
          tipo: string
          venda_id: string
        }
        Insert: {
          cor: string
          cor_hex?: string | null
          created_at?: string
          id?: string
          loja_id: string
          peca_codigo?: string | null
          peca_cor_id?: string | null
          peca_id?: string | null
          peca_nome?: string | null
          quantidade?: number
          tamanho: string
          tipo: string
          venda_id: string
        }
        Update: {
          cor?: string
          cor_hex?: string | null
          created_at?: string
          id?: string
          loja_id?: string
          peca_codigo?: string | null
          peca_cor_id?: string | null
          peca_id?: string | null
          peca_nome?: string | null
          quantidade?: number
          tamanho?: string
          tipo?: string
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mizloja_venda_itens_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "mizloja_lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mizloja_venda_itens_peca_cor_id_fkey"
            columns: ["peca_cor_id"]
            isOneToOne: false
            referencedRelation: "mizloja_peca_cores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mizloja_venda_itens_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "mizloja_pecas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mizloja_venda_itens_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "mizloja_vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      mizloja_vendas: {
        Row: {
          cliente_id: string
          created_at: string
          data_venda: string
          excluida: boolean
          excluida_em: string | null
          excluida_por: string | null
          forma_pagamento: string
          id: string
          lancada_por: string | null
          loja_id: string
          motivo_exclusao: string | null
          tem_peca_miz: boolean
          updated_at: string
          valor_total: number
          vendedora_id: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data_venda?: string
          excluida?: boolean
          excluida_em?: string | null
          excluida_por?: string | null
          forma_pagamento: string
          id?: string
          lancada_por?: string | null
          loja_id: string
          motivo_exclusao?: string | null
          tem_peca_miz?: boolean
          updated_at?: string
          valor_total: number
          vendedora_id: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data_venda?: string
          excluida?: boolean
          excluida_em?: string | null
          excluida_por?: string | null
          forma_pagamento?: string
          id?: string
          lancada_por?: string | null
          loja_id?: string
          motivo_exclusao?: string | null
          tem_peca_miz?: boolean
          updated_at?: string
          valor_total?: number
          vendedora_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mizloja_vendas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "mizloja_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mizloja_vendas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "mizloja_v_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mizloja_vendas_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "mizloja_lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mizloja_vendas_vendedora_id_fkey"
            columns: ["vendedora_id"]
            isOneToOne: false
            referencedRelation: "mizloja_usuarias"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          created_at: string | null
          enviado_por: string
          id: string
          mensagem: string
          titulo: string
        }
        Insert: {
          created_at?: string | null
          enviado_por: string
          id?: string
          mensagem: string
          titulo: string
        }
        Update: {
          created_at?: string | null
          enviado_por?: string
          id?: string
          mensagem?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_enviado_por_fkey"
            columns: ["enviado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes_lidas: {
        Row: {
          lida_em: string | null
          notificacao_id: string
          profile_id: string
        }
        Insert: {
          lida_em?: string | null
          notificacao_id: string
          profile_id: string
        }
        Update: {
          lida_em?: string | null
          notificacao_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_lidas_notificacao_id_fkey"
            columns: ["notificacao_id"]
            isOneToOne: false
            referencedRelation: "notificacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_lidas_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes_ocultas: {
        Row: {
          notificacao_id: string
          ocultada_em: string | null
          profile_id: string
        }
        Insert: {
          notificacao_id: string
          ocultada_em?: string | null
          profile_id: string
        }
        Update: {
          notificacao_id?: string
          ocultada_em?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_ocultas_notificacao_id_fkey"
            columns: ["notificacao_id"]
            isOneToOne: false
            referencedRelation: "notificacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_ocultas_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      peca_cores: {
        Row: {
          id: string
          nome: string | null
          ordem: number
          peca_id: string
          valor: string
        }
        Insert: {
          id?: string
          nome?: string | null
          ordem?: number
          peca_id: string
          valor: string
        }
        Update: {
          id?: string
          nome?: string | null
          ordem?: number
          peca_id?: string
          valor?: string
        }
        Relationships: [
          {
            foreignKeyName: "peca_cores_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
        ]
      }
      peca_imagens: {
        Row: {
          created_at: string
          id: string
          ordem: number
          peca_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          ordem?: number
          peca_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          ordem?: number
          peca_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "peca_imagens_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
        ]
      }
      peca_tamanhos: {
        Row: {
          id: string
          ordem: number
          peca_id: string
          valor: string
        }
        Insert: {
          id?: string
          ordem?: number
          peca_id: string
          valor: string
        }
        Update: {
          id?: string
          ordem?: number
          peca_id?: string
          valor?: string
        }
        Relationships: [
          {
            foreignKeyName: "peca_tamanhos_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
        ]
      }
      pecas: {
        Row: {
          ativa: boolean
          categoria: string | null
          codigo_referencia: string
          colecao_id: string | null
          como_vender: string | null
          composicao: string | null
          created_at: string
          descricao: string | null
          diferenciais: string | null
          esgotado: boolean
          id: string
          nome: string
          tone: string
        }
        Insert: {
          ativa?: boolean
          categoria?: string | null
          codigo_referencia: string
          colecao_id?: string | null
          como_vender?: string | null
          composicao?: string | null
          created_at?: string
          descricao?: string | null
          diferenciais?: string | null
          esgotado?: boolean
          id?: string
          nome: string
          tone?: string
        }
        Update: {
          ativa?: boolean
          categoria?: string | null
          codigo_referencia?: string
          colecao_id?: string | null
          como_vender?: string | null
          composicao?: string | null
          created_at?: string
          descricao?: string | null
          diferenciais?: string | null
          esgotado?: boolean
          id?: string
          nome?: string
          tone?: string
        }
        Relationships: [
          {
            foreignKeyName: "pecas_colecao_id_fkey"
            columns: ["colecao_id"]
            isOneToOne: false
            referencedRelation: "colecoes"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido_itens: {
        Row: {
          cor: string | null
          id: string
          peca_id: string
          pedido_id: string
          quantidade: number
          tamanho: string | null
        }
        Insert: {
          cor?: string | null
          id?: string
          peca_id: string
          pedido_id: string
          quantidade?: number
          tamanho?: string | null
        }
        Update: {
          cor?: string | null
          id?: string
          peca_id?: string
          pedido_id?: string
          quantidade?: number
          tamanho?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedido_itens_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_itens_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          data_pedido: string
          descricao: string
          id: string
          origem: string
          profile_id: string
          status: string
        }
        Insert: {
          data_pedido?: string
          descricao: string
          id?: string
          origem?: string
          profile_id: string
          status?: string
        }
        Update: {
          data_pedido?: string
          descricao?: string
          id?: string
          origem?: string
          profile_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pontos_eventos: {
        Row: {
          created_at: string | null
          data_evento: string
          id: string
          periodo: string
          pontos: number
          profile_id: string
          referencia_id: string | null
          tipo_acao: string
        }
        Insert: {
          created_at?: string | null
          data_evento?: string
          id?: string
          periodo: string
          pontos: number
          profile_id: string
          referencia_id?: string | null
          tipo_acao: string
        }
        Update: {
          created_at?: string | null
          data_evento?: string
          id?: string
          periodo?: string
          pontos?: number
          profile_id?: string
          referencia_id?: string | null
          tipo_acao?: string
        }
        Relationships: [
          {
            foreignKeyName: "pontos_eventos_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          aprovacao_automatica: boolean
          aprovado_em: string | null
          aprovado_por: string | null
          cnpj_cpf: string | null
          created_at: string
          endereco_bairro: string | null
          endereco_cidade: string | null
          endereco_estado: string | null
          endereco_rua: string | null
          id: string
          instagram: string | null
          nome: string | null
          nome_loja: string | null
          role: string
          status_cadastro: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          aprovacao_automatica?: boolean
          aprovado_em?: string | null
          aprovado_por?: string | null
          cnpj_cpf?: string | null
          created_at?: string
          endereco_bairro?: string | null
          endereco_cidade?: string | null
          endereco_estado?: string | null
          endereco_rua?: string | null
          id: string
          instagram?: string | null
          nome?: string | null
          nome_loja?: string | null
          role?: string
          status_cadastro?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          aprovacao_automatica?: boolean
          aprovado_em?: string | null
          aprovado_por?: string | null
          cnpj_cpf?: string | null
          created_at?: string
          endereco_bairro?: string | null
          endereco_cidade?: string | null
          endereco_estado?: string | null
          endereco_rua?: string | null
          id?: string
          instagram?: string | null
          nome?: string | null
          nome_loja?: string | null
          role?: string
          status_cadastro?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          id: string
          profile_id: string
          token: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          profile_id: string
          token: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          profile_id?: string
          token?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ranking_pontos: {
        Row: {
          created_at: string
          id: string
          periodo: string
          pontos: number
          profile_id: string
          store_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          periodo: string
          pontos?: number
          profile_id: string
          store_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          periodo?: string
          pontos?: number
          profile_id?: string
          store_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ranking_pontos_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recursos_materiais: {
        Row: {
          ativo: boolean
          capa_url: string | null
          created_at: string
          descricao: string | null
          id: string
          peca_relacionada_id: string | null
          tamanho_legivel: string | null
          tipo_area: string
          tipo_arquivo: string
          titulo: string
          tone: string
          url_arquivo: string | null
        }
        Insert: {
          ativo?: boolean
          capa_url?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          peca_relacionada_id?: string | null
          tamanho_legivel?: string | null
          tipo_area: string
          tipo_arquivo: string
          titulo: string
          tone?: string
          url_arquivo?: string | null
        }
        Update: {
          ativo?: boolean
          capa_url?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          peca_relacionada_id?: string | null
          tamanho_legivel?: string | null
          tipo_area?: string
          tipo_arquivo?: string
          titulo?: string
          tone?: string
          url_arquivo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recursos_materiais_peca_relacionada_id_fkey"
            columns: ["peca_relacionada_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      mizloja_v_clientes: {
        Row: {
          aniv_ano: number | null
          aniv_dia: number | null
          aniv_mes: number | null
          cadastrada_por: string | null
          cores_preferidas: string[] | null
          created_at: string | null
          dias_para_aniversario: number | null
          dias_sem_comprar: number | null
          etapa_kanban: string | null
          etapa_manual: string | null
          id: string | null
          intervalo_medio_dias: number | null
          loja_id: string | null
          nome: string | null
          nome_busca: string | null
          num_compras: number | null
          observacoes: string | null
          origem: string | null
          pecas_miz_compradas: Json | null
          primeira_compra_em: string | null
          proximo_aniversario: string | null
          recado_transferencia: string | null
          status: string | null
          tamanho_preferido: string | null
          ticket_medio: number | null
          total_gasto: number | null
          ultima_compra_em: string | null
          ultimo_contato_em: string | null
          ultimo_contato_por: string | null
          updated_at: string | null
          vendedora_id: string | null
          vendedora_nome: string | null
          whatsapp: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mizloja_clientes_cadastrada_por_fkey"
            columns: ["cadastrada_por"]
            isOneToOne: false
            referencedRelation: "mizloja_usuarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mizloja_clientes_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "mizloja_lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mizloja_clientes_ultimo_contato_por_fkey"
            columns: ["ultimo_contato_por"]
            isOneToOne: false
            referencedRelation: "mizloja_usuarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mizloja_clientes_vendedora_id_fkey"
            columns: ["vendedora_id"]
            isOneToOne: false
            referencedRelation: "mizloja_usuarias"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      is_approved: { Args: never; Returns: boolean }
      mizloja_buscar_clientes: {
        Args: { p_limite?: number; p_termo: string }
        Returns: {
          id: string
          nome: string
          num_compras: number
          ultima_compra_em: string
          vendedora_id: string
          vendedora_nome: string
          whatsapp_final: string
        }[]
      }
      mizloja_data_local: { Args: { p_instante: string }; Returns: string }
      mizloja_eh_interno: { Args: never; Returns: boolean }
      mizloja_hoje: { Args: never; Returns: string }
      mizloja_lancar_venda: {
        Args: {
          p_cliente_id: string
          p_data_venda?: string
          p_forma_pagamento: string
          p_itens: Json
          p_valor_total: number
          p_vendedora_id?: string
        }
        Returns: string
      }
      mizloja_normalizar_whatsapp: {
        Args: { p_valor: string }
        Returns: string
      }
      mizloja_proximo_aniversario: {
        Args: { p_dia: number; p_mes: number; p_ref: string }
        Returns: string
      }
      mizloja_recalcular_cliente: {
        Args: { p_cliente_id: string }
        Returns: undefined
      }
      mizloja_registrar_acesso: { Args: never; Returns: undefined }
      mizloja_sem_acento: { Args: { p_texto: string }; Returns: string }
      mizloja_senha_trocada: { Args: never; Returns: undefined }
      mizloja_tarefas_hoje: {
        Args: never
        Returns: {
          cliente_id: string
          motivo: string
          nome: string
          pasta: string
          total_gasto: number
          ultima_compra_em: string
          vendedora_id: string
          whatsapp: string
        }[]
      }
      mizloja_transferir_carteira: {
        Args: { p_de: string; p_para: string }
        Returns: number
      }
      mizloja_transferir_cliente: {
        Args: {
          p_cliente_id: string
          p_para_usuaria_id: string
          p_recado?: string
        }
        Returns: undefined
      }
      processar_streaks_diario: { Args: never; Returns: undefined }
      ranking_atual: {
        Args: never
        Returns: {
          periodo: string
          pontos: number
          profile_id: string
          store_name: string
        }[]
      }
      registrar_conquista: {
        Args: { p_referencia_id: string; p_tipo: string; p_titulo: string }
        Returns: undefined
      }
      registrar_ponto: {
        Args: { p_referencia_id?: string; p_tipo_acao: string }
        Returns: undefined
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
