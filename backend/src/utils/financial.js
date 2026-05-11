// utils/financial.js

export const PMT = (
  rate,
  nper,
  pv,
  fv = 0,
  type = 0,
) => {

  if (rate === 0) {
    return -(pv + fv) / nper;
  }

  return (
    (-rate *
      (fv +
        Math.pow(
          1 + rate,
          nper,
        ) *
          pv)) /
    ((1 +
      rate * type) *
      (Math.pow(
        1 + rate,
        nper,
      ) -
        1))
  );
};

export const PV = (
  rate,
  nper,
  pmt,
  fv = 0,
  type = 0,
) => {

  if (rate === 0) {
    return (
      -fv - pmt * nper
    );
  }

  const pvif =
    Math.pow(
      1 + rate,
      nper,
    );

  const fvifa =
    (pvif - 1) / rate;

  return (
    (-fv -
      pmt *
        (1 +
          rate * type) *
        fvifa) /
    pvif
  );
};