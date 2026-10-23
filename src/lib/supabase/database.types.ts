
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {

  "public": {
          Tables: {
            "account_opening_balances": {
                  Row: {
                    "account_id": string,"amount_cents": number,"created_at": string,"id": string,"noted_on": string,"relationship_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "account_id": string,"amount_cents": number,"created_at"?: string,"id"?: string,"noted_on": string,"relationship_id": string
                  }
                  Update: {
                    "account_id"?: string,"amount_cents"?: number,"created_at"?: string,"id"?: string,"noted_on"?: string,"relationship_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "account_opening_balances_relationship_id_account_id_fkey"
      columns: ["relationship_id","account_id"]
isOneToOne: false
      referencedRelation: "accounts"
      referencedColumns: ["relationship_id","id"]
    },{
      foreignKeyName: "account_opening_balances_relationship_id_fkey"
      columns: ["relationship_id"]
isOneToOne: false
      referencedRelation: "relationships"
      referencedColumns: ["id"]
    }
                  ]
                },"accounts": {
                  Row: {
                    "creation_key": string | null,"currency": string,"id": string,"name": string,"owner_id": string | null,"relationship_id": string,"scope": string
                  }
                  ComputedFields: never
                  Insert: {
                    "creation_key"?: string | null,"currency"?: string,"id"?: string,"name": string,"owner_id"?: string | null,"relationship_id": string,"scope": string
                  }
                  Update: {
                    "creation_key"?: string | null,"currency"?: string,"id"?: string,"name"?: string,"owner_id"?: string | null,"relationship_id"?: string,"scope"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "accounts_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "accounts_relationship_id_fkey"
      columns: ["relationship_id"]
isOneToOne: false
      referencedRelation: "relationships"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "accounts_relationship_id_owner_id_fkey"
      columns: ["relationship_id","owner_id"]
isOneToOne: false
      referencedRelation: "relationship_members"
      referencedColumns: ["relationship_id","user_id"]
    }
                  ]
                },"audit_events": {
                  Row: {
                    "actor_id": string | null,"after_data": Json | null,"before_data": Json | null,"created_at": string,"entity_id": string,"entity_table": string,"id": number,"operation": string,"relationship_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id"?: string | null,"after_data"?: Json | null,"before_data"?: Json | null,"created_at"?: string,"entity_id": string,"entity_table": string,"id"?: never,"operation": string,"relationship_id": string
                  }
                  Update: {
                    "actor_id"?: string | null,"after_data"?: Json | null,"before_data"?: Json | null,"created_at"?: string,"entity_id"?: string,"entity_table"?: string,"id"?: never,"operation"?: string,"relationship_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "audit_events_relationship_id_fkey"
      columns: ["relationship_id"]
isOneToOne: false
      referencedRelation: "relationships"
      referencedColumns: ["id"]
    }
                  ]
                },"campaigns": {
                  Row: {
                    "id": string,"name": string,"relationship_id": string,"rules": NonNullable<Json>,"target_cents": number
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"name": string,"relationship_id": string,"rules"?: NonNullable<Json>,"target_cents": number
                  }
                  Update: {
                    "id"?: string,"name"?: string,"relationship_id"?: string,"rules"?: NonNullable<Json>,"target_cents"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "campaigns_relationship_id_fkey"
      columns: ["relationship_id"]
isOneToOne: false
      referencedRelation: "relationships"
      referencedColumns: ["id"]
    }
                  ]
                },"contributions": {
                  Row: {
                    "amount_cents": number,"campaign_id": string,"created_at": string,"id": string,"idempotency_key": string,"participant_id": string,"relationship_id": string,"reversed_at": string | null,"reversed_by": string | null,"slot": number,"source_account_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_cents": number,"campaign_id": string,"created_at"?: string,"id"?: string,"idempotency_key": string,"participant_id": string,"relationship_id": string,"reversed_at"?: string | null,"reversed_by"?: string | null,"slot": number,"source_account_id": string
                  }
                  Update: {
                    "amount_cents"?: number,"campaign_id"?: string,"created_at"?: string,"id"?: string,"idempotency_key"?: string,"participant_id"?: string,"relationship_id"?: string,"reversed_at"?: string | null,"reversed_by"?: string | null,"slot"?: number,"source_account_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "contributions_relationship_id_campaign_id_fkey"
      columns: ["relationship_id","campaign_id"]
isOneToOne: false
      referencedRelation: "campaigns"
      referencedColumns: ["relationship_id","id"]
    },{
      foreignKeyName: "contributions_relationship_id_participant_id_fkey"
      columns: ["relationship_id","participant_id"]
isOneToOne: false
      referencedRelation: "relationship_members"
      referencedColumns: ["relationship_id","user_id"]
    },{
      foreignKeyName: "contributions_relationship_id_source_account_id_fkey"
      columns: ["relationship_id","source_account_id"]
isOneToOne: false
      referencedRelation: "accounts"
      referencedColumns: ["relationship_id","id"]
    },{
      foreignKeyName: "contributions_reversed_by_fkey"
      columns: ["reversed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"financial_entries": {
                  Row: {
                    "amount_cents": number,"created_at": string,"description": string,"destination_account_id": string | null,"id": string,"idempotency_key": string,"kind": string,"occurred_on": string,"owner_id": string,"relationship_id": string,"reversed_at": string | null,"reversed_by": string | null,"scope": string,"source_account_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_cents": number,"created_at"?: string,"description": string,"destination_account_id"?: string | null,"id"?: string,"idempotency_key": string,"kind": string,"occurred_on": string,"owner_id": string,"relationship_id": string,"reversed_at"?: string | null,"reversed_by"?: string | null,"scope": string,"source_account_id"?: string | null
                  }
                  Update: {
                    "amount_cents"?: number,"created_at"?: string,"description"?: string,"destination_account_id"?: string | null,"id"?: string,"idempotency_key"?: string,"kind"?: string,"occurred_on"?: string,"owner_id"?: string,"relationship_id"?: string,"reversed_at"?: string | null,"reversed_by"?: string | null,"scope"?: string,"source_account_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "financial_entries_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "financial_entries_relationship_id_destination_account_id_fkey"
      columns: ["relationship_id","destination_account_id"]
isOneToOne: false
      referencedRelation: "accounts"
      referencedColumns: ["relationship_id","id"]
    },{
      foreignKeyName: "financial_entries_relationship_id_fkey"
      columns: ["relationship_id"]
isOneToOne: false
      referencedRelation: "relationships"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "financial_entries_relationship_id_owner_id_fkey"
      columns: ["relationship_id","owner_id"]
isOneToOne: false
      referencedRelation: "relationship_members"
      referencedColumns: ["relationship_id","user_id"]
    },{
      foreignKeyName: "financial_entries_relationship_id_source_account_id_fkey"
      columns: ["relationship_id","source_account_id"]
isOneToOne: false
      referencedRelation: "accounts"
      referencedColumns: ["relationship_id","id"]
    },{
      foreignKeyName: "financial_entries_reversed_by_fkey"
      columns: ["reversed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"mascot_species": {
                  Row: {
                    "created_at": string,"display_name": string,"id": string,"is_selectable": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"display_name": string,"id": string,"is_selectable"?: boolean
                  }
                  Update: {
                    "created_at"?: string,"display_name"?: string,"id"?: string,"is_selectable"?: boolean
                  }
                  Relationships: [

                  ]
                },"monthly_plan_items": {
                  Row: {
                    "active": boolean,"amount_cents": number,"certainty": string,"created_at": string,"id": string,"kind": string,"label": string,"owner_id": string,"relationship_id": string,"remaining_installments": number | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"amount_cents": number,"certainty"?: string,"created_at"?: string,"id"?: string,"kind": string,"label": string,"owner_id": string,"relationship_id": string,"remaining_installments"?: number | null,"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"amount_cents"?: number,"certainty"?: string,"created_at"?: string,"id"?: string,"kind"?: string,"label"?: string,"owner_id"?: string,"relationship_id"?: string,"remaining_installments"?: number | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "monthly_plan_items_relationship_id_fkey"
      columns: ["relationship_id"]
isOneToOne: false
      referencedRelation: "relationships"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "monthly_plan_items_relationship_id_owner_id_fkey"
      columns: ["relationship_id","owner_id"]
isOneToOne: false
      referencedRelation: "relationship_members"
      referencedColumns: ["relationship_id","user_id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"display_name": string,"id": string,"mascot": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"display_name": string,"id": string,"mascot": string
                  }
                  Update: {
                    "created_at"?: string,"display_name"?: string,"id"?: string,"mascot"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_mascot_species_fk"
      columns: ["mascot"]
isOneToOne: false
      referencedRelation: "mascot_species"
      referencedColumns: ["id"]
    }
                  ]
                },"relationship_invitations": {
                  Row: {
                    "accepted_at": string | null,"created_at": string,"created_by": string,"declined_at": string | null,"expires_at": string,"id": string,"invited_user_id": string,"relationship_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted_at"?: string | null,"created_at"?: string,"created_by": string,"declined_at"?: string | null,"expires_at"?: string,"id"?: string,"invited_user_id": string,"relationship_id": string
                  }
                  Update: {
                    "accepted_at"?: string | null,"created_at"?: string,"created_by"?: string,"declined_at"?: string | null,"expires_at"?: string,"id"?: string,"invited_user_id"?: string,"relationship_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "relationship_invitations_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "relationship_invitations_relationship_id_fkey"
      columns: ["relationship_id"]
isOneToOne: false
      referencedRelation: "relationships"
      referencedColumns: ["id"]
    }
                  ]
                },"relationship_members": {
                  Row: {
                    "joined_at": string,"relationship_id": string,"revoked_at": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "joined_at"?: string,"relationship_id": string,"revoked_at"?: string | null,"user_id": string
                  }
                  Update: {
                    "joined_at"?: string,"relationship_id"?: string,"revoked_at"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "relationship_members_relationship_id_fkey"
      columns: ["relationship_id"]
isOneToOne: false
      referencedRelation: "relationships"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "relationship_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"relationships": {
                  Row: {
                    "archived_at": string | null,"created_at": string,"id": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archived_at"?: string | null,"created_at"?: string,"id"?: string,"name": string
                  }
                  Update: {
                    "archived_at"?: string | null,"created_at"?: string,"id"?: string,"name"?: string
                  }
                  Relationships: [

                  ]
                },"reward_events": {
                  Row: {
                    "event_type": string,"id": string,"relationship_id": string,"reversed_at": string | null,"rule_version": number,"source_key": string,"user_id": string,"virtual_coins": number,"xp": number
                  }
                  ComputedFields: never
                  Insert: {
                    "event_type": string,"id"?: string,"relationship_id": string,"reversed_at"?: string | null,"rule_version": number,"source_key": string,"user_id": string,"virtual_coins": number,"xp": number
                  }
                  Update: {
                    "event_type"?: string,"id"?: string,"relationship_id"?: string,"reversed_at"?: string | null,"rule_version"?: number,"source_key"?: string,"user_id"?: string,"virtual_coins"?: number,"xp"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "reward_events_relationship_id_user_id_fkey"
      columns: ["relationship_id","user_id"]
isOneToOne: false
      referencedRelation: "relationship_members"
      referencedColumns: ["relationship_id","user_id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "accept_relationship_invitation":
{ Args: { "invitation_id": string }; Returns: string
                           },
"create_financial_account":
{ Args: { "account_name": string,"account_scope": string,"opening_cents": number,"opening_on": string,"request_key": string,"target_relationship": string }; Returns: string
                           },
"create_profile":
{ Args: { "chosen_mascot": string,"profile_name": string }; Returns: string
                           },
"create_relationship":
{ Args: { "relationship_name": string }; Returns: string
                           },
"decline_relationship_invitation":
{ Args: { "invitation_id": string }; Returns: undefined
                           },
"ensure_number_campaign":
{ Args: { "target_relationship": string }; Returns: string
                           },
"invite_partner":
{ Args: { "partner_email": string }; Returns: string
                           },
"list_account_positions":
{ Args: { "target_relationship": string }; Returns: {
              "account_id": string,"available_cents": string,"balance_cents": string,"reserved_cents": string
            }[]
                           },
"list_relationship_invitations":
{ Args: Record<PropertyKey, never>; Returns: {
              "direction": string,"expires_at": string,"id": string,"other_name": string,"relationship_id": string,"relationship_name": string
            }[]
                           },
"record_financial_entry":
{ Args: { "amount_cents": number,"destination_id": string,"entry_description": string,"entry_kind": string,"entry_on": string,"request_key": string,"source_id": string,"target_relationship": string }; Returns: string
                           },
"reserve_number":
{ Args: { "request_key": string,"selected_slot": number,"source_id": string,"target_campaign": string,"target_relationship": string }; Returns: string
                           },
"reverse_financial_entry":
{ Args: { "entry_id": string }; Returns: string
                           },
"reverse_number":
{ Args: { "contribution_id": string }; Returns: string
                           },
"select_mascot":
{ Args: { "target_species": string }; Returns: string
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {

          }
        }
} as const
