import React from "react";

import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import Box from "@material-ui/core/Box";
import Link from "@material-ui/core/Link";
import Typography from "@material-ui/core/Typography";
import SyntaxHighlighter from "react-syntax-highlighter";

import { makeStyles } from "@material-ui/core/styles";

import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";

import diseaseAgentTargeted from "./valuesets/disease-agent-targeted.json";
import vaccineProphylaxis from "./valuesets/vaccine-prophylaxis.json";
import vaccineMedicinalProduct from "./valuesets/vaccine-medicinal-product.json";
import vaccineManufacturer from "./valuesets/vaccine-mah-manf.json";
import countryCodes from "./valuesets/country-2-codes.json";
import testType from "./valuesets/test-type.json";
import testResult from "./valuesets/test-result.json";
import testManufacturer from "./valuesets/test-manf.json";
import Alert from "@material-ui/lab/Alert";

const X509_COMMON_NAME_KEY = "2.5.4.3";

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(1),
  },
  unknown: {
    fontStyle: "italic",
  },
}));

const TextField = ({ title, children, ...props }) => (
  <>
    <Typography variant="caption" display="block" color="textSecondary">
      {title}
    </Typography>
    <Typography variant="body2" display="block" gutterBottom {...props}>
      {children}
    </Typography>
  </>
);

const ValueSetDisplay = ({ valueSet, data }) => {
  const displayValue = valueSet.valueSetValues[data]?.display;
  const classes = useStyles();

  return (
    <>
      {displayValue && <>{displayValue}</>}
      {!displayValue && (
        <>
          <span class={classes.unknown}>Unknown</span> ({data})
        </>
      )}
    </>
  );
};

const getCommonName = (certificate) => {
  // Search the subject's attributes for the common name of the certificate
  const subjectAttributes = certificate.subject.typesAndValues;
  let commonName = "";
  for (let index = 0; index < subjectAttributes.length; index++) {
    const attribute = subjectAttributes[index];
    if (attribute.type === X509_COMMON_NAME_KEY) {
      commonName = attribute.value.valueBlock.value;
      break;
    }
  }

  return commonName;
};

const DateDisplay = ({ data, dateOnly }) => {
  return (
    <>
      {dateOnly && (
        <>
          {new Date(data).toLocaleDateString("en-GB", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </>
      )}
      {!dateOnly && (
        <>
          {new Date(data).toLocaleString("en-GB", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
          })}
        </>
      )}
    </>
  );
};

const RecoveryDetails = ({ data }) => {
  return (
    <>
      <Typography variant="subtitle2" gutterBottom>
        Recovery details
      </Typography>
      <TextField title="Targeted disease">
        <ValueSetDisplay valueSet={diseaseAgentTargeted} data={data.tg} />
      </TextField>
      <TextField title="First positive test date">
        <DateDisplay data={data.fr} dateOnly />
      </TextField>
      <TextField title="Certificate valid from">
        <DateDisplay data={data.df} dateOnly />
      </TextField>
      <TextField title="Certificate valid until">
        <DateDisplay data={data.du} dateOnly />
      </TextField>
    </>
  );
};

const VaccineDetails = ({ data }) => {
  return (
    <>
      <Typography variant="subtitle2" gutterBottom>
        Vaccination details
      </Typography>
      <TextField title="Targeted disease">
        <ValueSetDisplay valueSet={diseaseAgentTargeted} data={data.tg} />
      </TextField>
      <TextField title="Vaccine type">
        <ValueSetDisplay valueSet={vaccineProphylaxis} data={data.vp} />
      </TextField>
      <TextField title="Vaccine product">
        <ValueSetDisplay valueSet={vaccineMedicinalProduct} data={data.mp} />
      </TextField>
      <TextField title="Vaccine manufacturer">
        <ValueSetDisplay valueSet={vaccineManufacturer} data={data.ma} />
      </TextField>
      <TextField title="Doses">
        {data.dn}/{data.sd}
      </TextField>
      <TextField title="Date of vaccination">
        <DateDisplay data={data.dt} dateOnly />
      </TextField>
    </>
  );
};

const TestDetails = ({ data }) => {
  return (
    <>
      <Typography variant="subtitle2" gutterBottom>
        Test details
      </Typography>
      <TextField title="Targeted disease">
        <ValueSetDisplay valueSet={diseaseAgentTargeted} data={data.tg} />
      </TextField>
      <TextField title="Test type">
        <ValueSetDisplay valueSet={testType} data={data.tt} />
      </TextField>
      {data.tn && <TextField title="Test name">{data.tn}</TextField>}
      {data.ma && (
        <TextField title="Test manufacturer">
          <ValueSetDisplay valueSet={testManufacturer} data={data.ma} />
        </TextField>
      )}
      <TextField title="Sample collected on">
        <DateDisplay data={data.sc} />
      </TextField>
      <TextField title="Test result">
        <ValueSetDisplay valueSet={testResult} data={data.tr} />
      </TextField>
      {data.tc && <TextField title="Test facility">{data.tc}</TextField>}
    </>
  );
};

export const CertDisplay = ({ data, certificate }) => {
  const [codeOpen, setCodeOpen] = React.useState(false);

  const classes = useStyles();

  const certInfoSection = data.v?.[0] || data.t?.[0] || data.r?.[0];

  const certificateDownloadLink = React.useMemo(() => {
    if (!certificate) return "#";
    const blob = new Blob([certificate.toSchema().toBER()], {
      type: "application/x-x509-ca-cert",
    });
    return window.URL.createObjectURL(blob);
  }, [certificate]);

  return (
    <Paper className={classes.paper}>
      {!codeOpen && (
        <>
          <Typography variant="subtitle2" gutterBottom>
            Personal details
          </Typography>
          <TextField title="Name">{`${data.nam.gn} ${data.nam.fn}`}</TextField>
          <TextField title="Date of birth">
            <DateDisplay data={data.dob} dateOnly />
          </TextField>
          <Box m={2} />
          {data.v?.[0] && <VaccineDetails data={data.v[0]} />}
          {data.r?.[0] && <RecoveryDetails data={data.r[0]} />}
          {data.t?.[0] && <TestDetails data={data.t[0]} />}
          <Box m={2} />
          <Typography variant="subtitle2" gutterBottom>
            Certificate details
          </Typography>
          <TextField title="Issuing country">
            <ValueSetDisplay
              valueSet={countryCodes}
              data={certInfoSection.co}
            />
          </TextField>
          <TextField title="Certificate issuer">{certInfoSection.is}</TextField>
          <TextField
            title="Unique certificate ID"
            className={classes.monospace}
          >
            {certInfoSection.ci}
          </TextField>
        </>
      )}
      {codeOpen && (
        <>
          <SyntaxHighlighter language="javascript" style={docco}>
            {JSON.stringify(data, null, 2)}
          </SyntaxHighlighter>
          {certificate && (
            <Alert severity="success">
              Digitally signed by{" "}
              <Link
                download="certificate.der"
                href={certificateDownloadLink}
                target="_blank"
              >
                {getCommonName(certificate)}
              </Link>
            </Alert>
          )}
          {!certificate && (
            <Alert severity="error">
              Digital signature is invalid or the signing certificate is not
              trusted.
            </Alert>
          )}
        </>
      )}

      <Button fullWidth onClick={() => setCodeOpen(!codeOpen)}>
        {codeOpen ? "Hide raw details" : "Show raw details"}
      </Button>
    </Paper>
  );
};
