// Gerador de payload PIX EMV (padrão BACEN) — usado por ContribuicaoForm e ContribuicaoModal

export interface PixMerchantInfo {
  chave: string;
  nome: string;
  cidade: string;
}

function emvTLV(id: string, value: string): string {
  const length = value.length.toString().padStart(2, '0');
  return `${id}${length}${value}`;
}

// CRC16-CCITT-FALSE (polinômio 0x1021), exigido pelo padrão EMV do PIX
function calculateCRC16(payload: string): string {
  const polynomial = 0x1021;
  let crc = 0xFFFF;

  const bytes = new TextEncoder().encode(payload);

  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i] << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function generatePixPayload(merchant: PixMerchantInfo, valor?: number): string {
  const payloadFormatIndicator = emvTLV('00', '01');
  const gui = emvTLV('00', 'br.gov.bcb.pix');
  const chavePix = emvTLV('01', merchant.chave);
  const merchantAccountInfo = emvTLV('26', gui + chavePix);
  const merchantCategoryCode = emvTLV('52', '0000');
  const transactionCurrency = emvTLV('53', '986');
  const transactionAmount = valor && valor > 0 ? emvTLV('54', valor.toFixed(2)) : '';
  const countryCode = emvTLV('58', 'BR');
  const merchantName = emvTLV('59', merchant.nome.toUpperCase().substring(0, 25));
  const merchantCity = emvTLV('60', merchant.cidade.toUpperCase().substring(0, 15));
  const referenceLabel = emvTLV('05', '***');
  const additionalDataField = emvTLV('62', referenceLabel);

  const payloadWithoutCRC =
    payloadFormatIndicator +
    merchantAccountInfo +
    merchantCategoryCode +
    transactionCurrency +
    transactionAmount +
    countryCode +
    merchantName +
    merchantCity +
    additionalDataField +
    '6304';

  const crc = calculateCRC16(payloadWithoutCRC);

  return payloadWithoutCRC + crc;
}
