import cose from "cose-js";
import cbor from "cbor";
import base45 from "base45-js";
import zlib from "pako";
import { Certificate } from "pkijs";
import * as asn1js from "asn1js";

export const getTrustList = async () => {
  const response = await fetch(process.env.REACT_APP_TRUST_LIST_URL);
  const trustList = await response.json();
  return trustList;
};

const getSigner = (kid, trustList) => {
  if (!trustList[kid]) {
    return null;
  }

  const { x, y, x5c } = trustList[kid];
  const certificateRaw = Buffer.from(x5c[0], "base64");
  const asn1 = asn1js.fromBER(certificateRaw.buffer);
  const certificate = new Certificate({ schema: asn1.result });

  return {
    key: {
      x: Buffer.from(x, "base64"),
      y: Buffer.from(y, "base64"),
      kid: Buffer.from(kid, "base64"),
    },
    certificate: certificate,
  };
};

export const errorDisplayMap = {
  NOT_EUDCC: "Scanned code is not a DCC.",
  NOT_TRUSTED: "The DCC is not signed by a trusted key.",
  SIGNATURE_INVALID: "The DCC on the certificate is invalid.",
  INVALID: "The DCC is malformed.",
  UNSUPPORTED_FORMAT:
    "The DCC is not in a supported format, so the validity cannot be verified.",
};

export const decodeEudcc = async (data, trustList) => {
  try {
    if (!data.startsWith("HC1:")) {
      return { error: "NOT_EUDCC" };
    }

    const b45decoded = base45.decode(data.slice(4));
    const decompressed = zlib.inflate(b45decoded);

    // Extract kid from the COSE header
    const decoded = cbor.decodeFirstSync(decompressed);
    const decodedCert = cbor.decodeFirstSync(decoded.value[2]);
    const hcert = decodedCert.get(-260).get(1);

    let kid;
    try {
      // Try to extract KID from the certificate, if it is not present,
      // we will not be able to validate the signature, but we can still
      // display the data. We only target version 1.3.0+ of the spec.
      const signatureInfo = cbor.decodeFirstSync(decoded.value[0]);
      kid = Buffer.from(
        signatureInfo.get(cose.common.HeaderParameters.kid)
      ).toString("base64");
    } catch (e) {
      return { data: hcert, error: "UNSUPPORTED_FORMAT" };
    }

    const signer = getSigner(kid, trustList);
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
