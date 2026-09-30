"use strict";
// Monta o BR Code Pix sem executar pagamento nem conferir crédito bancário.
const { randomBytes } = require("node:crypto");

function field(id, value) {
  // O tamanho de cada campo é medido em bytes UTF-8, conforme o formato TLV.
  const text = String(value);
  const length = Buffer.byteLength(text, "utf8");
  if (!/^\d{2}$/.test(id) || length > 99) throw new Error("Campo Pix inválido.");
  return id + String(length).padStart(2, "0") + text;
}
function crc16(payload) {
  // O CRC cobre todo o conteúdo anterior aos quatro caracteres finais.
  let crc = 0xffff;
  for (const byte of Buffer.from(payload, "utf8")) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit++) crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    crc &= 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}
function normalizeLabel(value, max) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toUpperCase().replace(/[^A-Z0-9 .-]/g, "").trim().slice(0, max);
}
function amountCents(value) {
  // Valor mínimo e teto evitam pedidos fora do intervalo aceito pela interface.
  const amount = Number(value);
  if (!Number.isInteger(amount) || amount < 990 || amount > 100000)
    throw new Error("Contribuição mínima de R$ 9,90; informe o valor em centavos.");
  return amount;
}
function newTxid() { return randomBytes(12).toString("hex").toUpperCase(); }
function payload({ key, name, city, cents, txid }) {
  if (typeof key !== "string" || !key.trim() || Buffer.byteLength(key, "utf8") > 77 ||
      !/^[A-Z0-9]{1,25}$/.test(txid)) throw new Error("Dados Pix inválidos.");
  const receiver = normalizeLabel(name, 25);
  const locality = normalizeLabel(city, 15);
  if (!receiver || !locality) throw new Error("Nome e cidade do recebedor são obrigatórios.");
  const value = (amountCents(cents) / 100).toFixed(2);
  const merchant = field("00", "br.gov.bcb.pix") + field("01", key.trim());
  const body = field("00", "01") + field("26", merchant) + field("52", "0000") +
    field("53", "986") + field("54", value) + field("58", "BR") +
    field("59", receiver) + field("60", locality) + field("62", field("05", txid)) + "6304";
  return body + crc16(body);
}
module.exports = { payload, amountCents, newTxid, crc16 };
