import QrReader from "react-qr-reader";
import React from "react";

import { makeStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";

import Paper from "@material-ui/core/Paper";
import AppBar from "@material-ui/core/AppBar";
import Link from "@material-ui/core/Link";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import Box from "@material-ui/core/Box";
import Container from "@material-ui/core/Container";
import VerifiedUserIcon from "@material-ui/icons/VerifiedUser";
import GitHubIcon from "@material-ui/icons/GitHub";
import IconButton from "@material-ui/core/IconButton";
import Alert from "@material-ui/lab/Alert";
import AlertTitle from "@material-ui/lab/AlertTitle";
import QRCode from "qrcode.react";

import useScrollTrigger from "@material-ui/core/useScrollTrigger";
import Slide from "@material-ui/core/Slide";

import { getTrustList, decodeEudcc, errorDisplayMap } from "./decode";
import "./App.css";
import { CertDisplay } from "./CertDisplay";

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(1),
    marginTop: theme.spacing(1),
  },
  logo: {
    height: theme.spacing(4),
    marginRight: theme.spacing(1),
  },
  rawText: {
    wordBreak: "break-all",
    fontSize: "small",
  },
  qrCode: {
    padding: theme.spacing(1),
  },
  qrReader: {
    "& > section": {
      "& > video, div": {
        borderRadius: "4px",
      },
      "& > div": {
        boxShadow: "inherit !important",
      },
    },
    borderRadius: "4px",
  },
  backdrop: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
  },
  title: {
    flexGrow: 1,
  },
}));

function Validator() {
  const classes = useStyles();
  const [detectedCode, setDetectedCode] = React.useState(null);
  const [cameraError, setCameraError] = React.useState(null);
  const [trustList, setTrustList] = React.useState(null);
  const [decoded, setDecoded] = React.useState(null);
  const [manualEnter, setManualEnter] = React.useState(false);
  const [showAsText, setShowAsText] = React.useState(false);
  const [enteredCode, setEnteredCode] = React.useState(null);

  React.useEffect(() => {
    getTrustList().then((trustList) => setTrustList(trustList));
  }, []);

  React.useEffect(() => {
    if (!detectedCode || !trustList) {
      setDecoded(null);
      return;
    }

    decodeEudcc(detectedCode, trustList).then((decoded) => setDecoded(decoded));
  }, [detectedCode, trustList]);

  return (
    <>
      <Container className={classes.root} maxWidth="md">
        <Grid
          container
          justifyContent="center"
          alignItems="flex-start"
          spacing={2}
        >
          {!decoded && (
            <Grid item xs={12} md={6}>
              {!manualEnter && (
                <>
                  {cameraError && (
                    <p>
                      <Alert variant="filled" severity="warning">
                        Could not initialize camera!
                      </Alert>
                    </p>
                  )}
                  <QrReader
                    className={classes.qrReader}
                    delay={300}
                    onError={(e) => {
                      setCameraError(e);
                    }}
                    onScan={(data) => {
                      if (data) {
                        setDetectedCode(data);
                      }
                    }}
                  />
                </>
              )}
              {manualEnter && (
                <>
                  <Box my={2}>
                    <TextField
                      label="base-45 encoded DCC certificate"
                      multiline
                      fullWidth
                      value={enteredCode}
                      onChange={(e) => {
                        setEnteredCode(e.target.value);
                      }}
                      variant="outlined"
                    />
                  </Box>
                  <Button
                    onClick={() => {
                      setDetectedCode(enteredCode);
                    }}
                    color="primary"
                    variant="contained"
                    fullWidth
                  >
                    Submit
                  </Button>
                </>
              )}
              <Box my={2}>
                <Button
                  onClick={() => {
                    setManualEnter(!manualEnter);
                  }}
                  fullWidth
                >
                  {manualEnter ? "Scan QR code" : "Manually enter code"}
                </Button>
              </Box>
            </Grid>
          )}
          {detectedCode && decoded && (
            <>
              <Grid item xs={12}>
                {decoded.data && !decoded.error && (
                  <Alert variant="filled" severity="success">
                    Valid DCC
                  </Alert>
                )}
                {decoded.error && (
                  <Alert variant="filled" severity="error">
                    <AlertTitle>Invalid DCC</AlertTitle>
                    {errorDisplayMap[decoded.error]}
                  </Alert>
                )}
              </Grid>

              {decoded.data && (
                <Grid item xs={12} md={7}>
                  <CertDisplay
                    data={decoded.data}
                    certificate={decoded.certificate}
                  />
                </Grid>
              )}
              <Grid item xs={12} md={5}>
                <Paper className={classes.qrCode}>
                  {!showAsText && (
                    <QRCode
                      value={detectedCode}
                      renderAs="svg"
                      height="100%"
                      width="100%"
                    />
                  )}
                  {showAsText && (
                    <p className={classes.rawText}>{detectedCode}</p>
                  )}
                  <Button
                    onClick={() => {
                      setShowAsText(!showAsText);
                    }}
                    fullWidth
                  >
                    {showAsText ? "Show QR code" : "Show as text"}
                  </Button>
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Button
                  onClick={() => {
                    setDetectedCode(null);
                  }}
                  variant="contained"
                  color="primary"
                  fullWidth
                >
                  {manualEnter ? "Enter another code" : "Scan another code"}
                </Button>
              </Grid>
            </>
          )}
        </Grid>
      </Container>
    </>
  );
}

function HideOnScroll(props) {
  const { children, window } = props;
  // Note that you normally won't need to set the window ref as useScrollTrigger
  // will default to window.
  // This is only being set here because the demo is in an iframe.
  const trigger = useScrollTrigger({ target: window ? window() : undefined });

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

export default function App() {
  const classes = useStyles();

  return (
    <>
      <HideOnScroll>
        <AppBar position="fixed" color="primary">
          <Toolbar>
            <VerifiedUserIcon className={classes.logo} />
            <Typography variant="h6" className={classes.title}>
              EUDCC Validator
            </Typography>
            <IconButton
              href="http://github.com/tibordp/eudcc-validator"
              target="_blank"
              color="inherit"
            >
              <GitHubIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
      </HideOnScroll>
      <Toolbar />
      <Validator />
    </>
  );
}
