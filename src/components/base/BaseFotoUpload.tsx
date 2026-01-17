import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Loader2, X, Image } from 'lucide-react';
import { toast } from 'sonner';

interface BaseFotoUploadProps {
  currentUrl: string | null;
  baseId: string;
  onUploadComplete: (url: string) => void;
  disabled?: boolean;
}

export function BaseFotoUpload({ currentUrl, baseId, onUploadComplete, disabled }: BaseFotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato inválido. Use JPG, PNG ou WebP.');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 5MB.');
      return;
    }

    setUploading(true);

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${baseId}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('bases-fotos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        toast.error('Erro ao fazer upload: ' + uploadError.message);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('bases-fotos')
        .getPublicUrl(filePath);

      setPreview(publicUrl);
      onUploadComplete(publicUrl);
      toast.success('Foto enviada com sucesso!');
    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao fazer upload');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onUploadComplete('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-xs text-muted-foreground">Foto da Base</Label>
      
      {preview ? (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden border bg-muted">
          <img
            src={preview}
            alt="Preview da foto"
            className="w-full h-full object-cover"
          />
          {!disabled && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <div className="w-full aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-2 bg-muted/50">
          <Image className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Nenhuma foto selecionada</p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={disabled || uploading}
          className="hidden"
          id={`foto-upload-${baseId}`}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {preview ? 'Trocar Foto' : 'Escolher Foto'}
            </>
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        JPG, PNG ou WebP. Máx. 5MB.
      </p>
    </div>
  );
}
