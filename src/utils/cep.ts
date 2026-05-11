export async function buscarCep(cep: string) {
  const cepLimpo = cep.replace(/\D/g, '');
  if (cepLimpo.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    const data = await res.json();
    if (data.erro) return null;
    return {
      rua: data.logradouro as string,
      bairro: data.bairro as string,
      cidade: data.localidade as string,
      estado: data.uf as string,
    };
  } catch {
    return null;
  }
}
