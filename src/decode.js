import cose from "cose-js";
import cbor from "cbor";
import base45 from "base45-js";
import zlib from "pako";
import { Certificate } from "pkijs";
import * as asn1js from "asn1js";

export const getTrustList = async () => {
  const response = await fetch("https://eudcc.tibordp.workers.dev/trust-list");
  const trustList = await response.json();
  return trustList;
};

const getSigner = (kid, trustList) => {
  const kidB64 = Buffer.from(kid).toString("base64");

  if (!trustList[kidB64]) {
    return null;
  }

  const { x, y, x5c } = trustList[kidB64];
  const certificateRaw = Buffer.from(x5c[0], "base64");
  const asn1 = asn1js.fromBER(certificateRaw.buffer);
  const certificate = new Certificate({ schema: asn1.result });

  return {
    key: {
      x: Buffer.from(x, "base64"),
      y: Buffer.from(y, "base64"),
      kid: Buffer.from(kid),
    },
    certificate: certificate,
  };
};

export const errorDisplayMap = {
  NOT_EUDCC: "Scanned code is not a DCC.",
  NOT_TRUSTED: "The DCC is not signed by a trusted key.",
  SIGNATURE_INVALID: "The DCC on the certificate is invalid.",
  INVALID: "The DCC is malformed.",
};

export const decodeEudcc = async (data, trustList) => {
  // https://github.com/ehn-dcc-development/hcert-spec/blob/main/hcert_spec.md
  try {
    if (!data.startsWith("HC1:")) {
      return { error: "NOT_EUDCC" };
    }

    const b45decoded = base45.decode(data.slice(4));
    const decompressed = zlib.inflate(b45decoded);

    // Extract kid from the COSE header
    const decoded = cbor.decodeFirstSync(decompressed);
    const signatureInfo = cbor.decodeFirstSync(decoded.value[0]);
    const kid = signatureInfo.get(cose.common.HeaderParameters.kid);
    const signer = getSigner(kid, trustList);

    const decodedCert = cbor.decodeFirstSync(decoded.value[2]);
    const hcert = decodedCert.get(-260).get(1);

    if (!signer) {
      return { data: hcert, error: "NOT_TRUSTED" };
    }

    try {
      await cose.sign.verify(decompressed, signer);
    } catch (e) {
      return { data: hcert, error: "SIGNATURE_INVALID" };
    }

    return { data: hcert, certificate: signer.certificate };
  } catch (e) {
    console.error(e);
    return { error: "INVALID" };
  }
};
