import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

export interface AuditLogParams {
  action: string;
  tableName: string;
  recordId?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
}

export async function logAuditAction({
  action,
  tableName,
  recordId,
  oldData,
  newData,
}: AuditLogParams): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('Audit log skipped: No authenticated user');
      return;
    }

    // Get profile id from user_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: profile?.id || null,
        action,
        table_name: tableName,
        record_id: recordId || null,
        old_data: (oldData as Json) || null,
        new_data: (newData as Json) || null,
      });

    if (error) {
      console.error('Failed to create audit log:', error);
    }
  } catch (err) {
    console.error('Audit logging error:', err);
  }
}

// Convenience functions for common actions
export const auditActions = {
  create: (tableName: string, recordId: string, newData: Record<string, unknown>) =>
    logAuditAction({ action: 'CREATE', tableName, recordId, newData }),
  
  update: (tableName: string, recordId: string, oldData: Record<string, unknown>, newData: Record<string, unknown>) =>
    logAuditAction({ action: 'UPDATE', tableName, recordId, oldData, newData }),
  
  delete: (tableName: string, recordId: string, oldData: Record<string, unknown>) =>
    logAuditAction({ action: 'DELETE', tableName, recordId, oldData }),
  
  login: () =>
    logAuditAction({ action: 'LOGIN', tableName: 'auth' }),
  
  logout: () =>
    logAuditAction({ action: 'LOGOUT', tableName: 'auth' }),
  
  configUpdate: (oldData: Record<string, unknown>, newData: Record<string, unknown>) =>
    logAuditAction({ action: 'CONFIG_UPDATE', tableName: 'configuracoes_instituicao', oldData, newData }),
};
