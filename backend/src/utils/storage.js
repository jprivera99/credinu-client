// src/utils/storage.js
// Documentos en la misma ubicación que usa el sistema actual:
//   S3:    s3://<bucket>/<prefijo>/supplynet_docs/<YYYY>/<MM>/01_<cliente>_<tipo>.<ext>
//   Local: <DOCS_LOCAL_PATH>/<YYYY>/<MM>/...   (solo para desarrollo, cuando no hay S3_DOCS_BASE)
//
// Para S3 se necesitan los paquetes @aws-sdk/client-s3 y @aws-sdk/s3-request-presigner y
// credenciales de AWS (rol de la instancia o AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY).

import fs from "fs/promises";
import path from "path";
import { AppError } from "./appError.js";

const S3_BASE = (process.env.S3_DOCS_BASE || "").trim();
const REGION = process.env.AWS_REGION || "mx-central-1";
const LOCAL_BASE = path.resolve(process.env.DOCS_LOCAL_PATH || "./storage/supplynet_docs");

export const usaS3 = () => S3_BASE.startsWith("s3://");

const s3Destino = (rutaRelativa) => {
  const sinEsquema = S3_BASE.replace(/^s3:\/\//, "").replace(/\/+$/, "");
  const [bucket, ...resto] = sinEsquema.split("/");
  const prefijo = resto.length ? resto.join("/") + "/" : "";
  return { Bucket: bucket, Key: `${prefijo}supplynet_docs/${String(rutaRelativa).replace(/^\/+/, "")}` };
};

let clienteS3 = null;
const s3 = async () => {
  if (clienteS3) return clienteS3;
  try {
    const { S3Client, PutObjectCommand, GetObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    clienteS3 = { client: new S3Client({ region: REGION }), PutObjectCommand, GetObjectCommand, getSignedUrl };
    return clienteS3;
  } catch {
    throw new AppError(
      "Falta instalar el soporte de S3: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner",
      500,
    );
  }
};

const rutaLocal = (rutaRelativa) => {
  const destino = path.resolve(LOCAL_BASE, String(rutaRelativa).replace(/^\/+/, ""));
  if (!destino.startsWith(LOCAL_BASE)) throw new AppError("Ruta inválida", 400);
  return destino;
};

export const guardarArchivo = async (rutaRelativa, buffer, mime) => {
  if (usaS3()) {
    const { client, PutObjectCommand } = await s3();
    await client.send(new PutObjectCommand({ ...s3Destino(rutaRelativa), Body: buffer, ContentType: mime }));
    return;
  }
  const destino = rutaLocal(rutaRelativa);
  await fs.mkdir(path.dirname(destino), { recursive: true });
  await fs.writeFile(destino, buffer);
};

/** URL temporal (S3) o contenido en base64 (local). */
export const leerArchivo = async (rutaRelativa, { mime, nombreDescarga } = {}) => {
  if (usaS3()) {
    const { client, GetObjectCommand, getSignedUrl } = await s3();
    const params = { ...s3Destino(rutaRelativa) };
    if (nombreDescarga) params.ResponseContentDisposition = `attachment; filename="${path.basename(nombreDescarga)}"`;
    const url = await getSignedUrl(client, new GetObjectCommand(params), { expiresIn: 600 });
    return { url, mime };
  }
  try {
    const buffer = await fs.readFile(rutaLocal(rutaRelativa));
    return { base64: buffer.toString("base64"), mime };
  } catch {
    throw new AppError("Archivo no disponible", 404);
  }
};
