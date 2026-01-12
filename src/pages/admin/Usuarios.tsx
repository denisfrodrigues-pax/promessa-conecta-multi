import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, Download, Edit, MoreHorizontal, Users, UserCheck, Shield, UserX, UserPlus } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  telefone: string | null;
  status: string;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: string;
}

interface MembroVinculado {
  id: string;
  user_id: string | null;
}

export default function Usuarios() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [membrosVinculados, setMembrosVinculados] = useState<MembroVinculado[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [convertingUser, setConvertingUser] = useState<User | null>(null);
  const [converting, setConverting] = useState(false);
  const [editData, setEditData] = useState({ nome: '', telefone: '', status: '', role: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const [usersRes, rolesRes, membrosRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('user_id, role'),
        supabase.from('membros').select('id, user_id').not('user_id', 'is', null),
      ]);

      if (usersRes.error) throw usersRes.error;
      setUsers(usersRes.data || []);
      setRoles(rolesRes.data || []);
      setMembrosVinculados(membrosRes.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  // Verifica se o usuário já está vinculado a um membro
  const isUserLinkedToMembro = (profileId: string) => {
    return membrosVinculados.some(m => m.user_id === profileId);
  };

  /**
   * CONVERSÃO DE USUÁRIO EM MEMBRO
   * 
   * Cria apenas o registro administrativo em 'membros' com vínculo via user_id.
   * NÃO duplica dados pessoais (nome, email, telefone, data_nascimento).
   * 
   * O campo 'nome' é preenchido apenas por exigência do banco (NOT NULL),
   * mas NÃO é fonte de verdade - quando exibido, usar sempre dados de profiles.
   * 
   * @see src/pages/admin/MembroDetalhes.tsx para lógica de exibição combinada
   */
  const handleConvertToMembro = async () => {
    if (!convertingUser) return;
    
    setConverting(true);
    try {
      /**
       * IMPORTANTE: Apenas criamos o vínculo.
       * - O campo 'nome' aqui é apenas fallback técnico (banco exige NOT NULL)
       * - Dados pessoais reais virão de profiles quando o membro for exibido
       * - NÃO copiar email, telefone, data_nascimento para evitar duplicação
       */
      const { error } = await supabase.from('membros').insert({
        nome: convertingUser.nome, // Fallback técnico - NÃO é fonte de verdade quando user_id existe
        user_id: convertingUser.id,
        status: 'ativo',
      });

      if (error) throw error;

      toast.success(`${convertingUser.nome} foi vinculado como membro!`);
      setConvertingUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error converting user to membro:', error);
      if (error.code === '23505') {
        toast.error('Este usuário já está vinculado a um membro');
      } else {
        toast.error('Erro ao converter usuário em membro');
      }
    } finally {
      setConverting(false);
    }
  };

  const getUserRole = (userId: string) => {
    const userRole = roles.find((r) => r.user_id === userId);
    return userRole?.role || 'membro';
  };

  const getRoleBadgeVariant = (role: string): "admin" | "lider" | "voluntario" | "membro" | "secondary" => {
    switch (role) {
      case 'admin': return 'admin';
      case 'lider': return 'lider';
      case 'financeiro': return 'admin'; // Uses admin styling (red/important)
      case 'voluntario': return 'voluntario';
      case 'membro': return 'membro';
      default: return 'secondary';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'lider': return 'Líder';
      case 'financeiro': return 'Financeiro';
      case 'voluntario': return 'Voluntário';
      case 'membro': return 'Membro';
      case 'visitante': return 'Visitante';
      default: return role;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo': return <Badge variant="success">Ativo</Badge>;
      case 'inativo': return <Badge variant="destructive">Inativo</Badge>;
      case 'pendente': return <Badge variant="warning">Pendente</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditData({
      nome: user.nome,
      telefone: user.telefone || '',
      status: user.status,
      role: getUserRole(user.user_id),
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          nome: editData.nome,
          telefone: editData.telefone || null,
          status: editData.status as 'ativo' | 'inativo' | 'pendente',
        })
        .eq('id', editingUser.id);

      if (profileError) throw profileError;

      // Update role - delete existing and insert new
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', editingUser.user_id);

      const { error: insertRoleError } = await supabase
        .from('user_roles')
        .insert([{ user_id: editingUser.user_id, role: editData.role as 'admin' | 'lider' | 'financeiro' | 'voluntario' | 'membro' | 'visitante' }]);

      toast.success('Usuário atualizado com sucesso');
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Erro ao atualizar usuário');
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'inativo' as const })
        .eq('id', deletingUser.id);

      if (error) throw error;

      toast.success('Usuário desativado com sucesso');
      setDeletingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deactivating user:', error);
      toast.error('Erro ao desativar usuário');
    }
  };

  const exportCSV = () => {
    const headers = ['Nome', 'Email', 'Telefone', 'Status', 'Função', 'Data Cadastro'];
    const rows = users.map((user) => [
      user.nome,
      user.email,
      user.telefone || '',
      user.status,
      getUserRole(user.user_id),
      new Date(user.created_at).toLocaleDateString('pt-BR'),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Arquivo CSV exportado');
  };

  const filteredUsers = users.filter(
    (user) =>
      user.nome.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: users.length,
    ativos: users.filter(u => u.status === 'ativo').length,
    admins: roles.filter(r => r.role === 'admin').length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Usuários</h1>
          <p className="text-muted-foreground mt-1">Gerenciamento de membros e visitantes</p>
        </div>
        <Button variant="outline" onClick={exportCSV} className="group">
          <Download className="w-4 h-4 mr-2 transition-transform group-hover:-translate-y-0.5" />
          Exportar CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-card border-0 animate-fade-in">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-promessa-500 to-promessa-700 flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold font-display">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total de Usuários</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-0 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold font-display">{stats.ativos}</p>
                <p className="text-sm text-muted-foreground">Usuários Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-0 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold font-display">{stats.admins}</p>
                <p className="text-sm text-muted-foreground">Administradores</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="shadow-card border-0">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle className="flex items-center gap-2 font-display">
              <Users className="w-5 h-5 text-primary" />
              Lista de Usuários
            </CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-semibold">Usuário</TableHead>
                    <TableHead className="font-semibold">Função</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Cadastro</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user, index) => (
                    <TableRow 
                      key={user.id} 
                      className="hover:bg-muted/20 transition-colors animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10">
                            <span className="text-primary font-semibold text-lg">
                              {user.nome.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{user.nome}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(getUserRole(user.user_id))}>
                          {getRoleLabel(getUserRole(user.user_id))}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:bg-muted">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(user)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            {isAdmin && !isUserLinkedToMembro(user.id) && (
                              <DropdownMenuItem 
                                onClick={() => setConvertingUser(user)}
                                className="text-primary focus:text-primary"
                              >
                                <UserPlus className="w-4 h-4 mr-2" />
                                Converter em Membro
                              </DropdownMenuItem>
                            )}
                            {isAdmin && isUserLinkedToMembro(user.id) && (
                              <DropdownMenuItem disabled className="text-muted-foreground">
                                <UserCheck className="w-4 h-4 mr-2" />
                                Já é membro
                              </DropdownMenuItem>
                            )}
                            {isAdmin && user.status !== 'inativo' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => setDeletingUser(user)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <UserX className="w-4 h-4 mr-2" />
                                  Desativar usuário
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>Nenhum usuário encontrado</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>Atualize as informações do usuário</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={editData.nome}
                onChange={(e) => setEditData({ ...editData, nome: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={editData.telefone}
                onChange={(e) => setEditData({ ...editData, telefone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editData.status} onValueChange={(v) => setEditData({ ...editData, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Função</Label>
              <Select value={editData.role} onValueChange={(v) => setEditData({ ...editData, role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="lider">Líder</SelectItem>
                  <SelectItem value="voluntario">Voluntário</SelectItem>
                  <SelectItem value="membro">Membro</SelectItem>
                  <SelectItem value="visitante">Visitante</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              O usuário <strong>{deletingUser?.nome}</strong> será desativado e não poderá mais acessar o sistema. 
              Os dados históricos (escalas, contribuições, registros) serão mantidos.
              <br /><br />
              Esta ação pode ser revertida alterando o status do usuário para "Ativo".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Desativar usuário
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Convert to Member Confirmation Dialog */}
      <AlertDialog open={!!convertingUser} onOpenChange={() => setConvertingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Converter em Membro?</AlertDialogTitle>
            <AlertDialogDescription>
              O usuário <strong>{convertingUser?.nome}</strong> será adicionado à lista de membros da igreja.
              <br /><br />
              <strong>Nota:</strong> Os dados pessoais (nome, email, telefone, nascimento) permanecerão vinculados ao perfil do usuário e serão atualizados automaticamente quando ele editar seu perfil.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={converting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConvertToMembro}
              disabled={converting}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {converting ? 'Convertendo...' : 'Converter em Membro'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
