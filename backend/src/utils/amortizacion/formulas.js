// utils/amortizacion/formulas.js

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

  const pvif =
    Math.pow(
      1 + rate,
      nper,
    );

  let pmt =
    rate /
    (pvif - 1) *
    -(pv * pvif + fv);

  if (type === 1) {
    pmt /= (1 + rate);
  }

  return pmt;
};

export const PV = (
  rate,
  nper,
  pmt,
  fv = 0,
  type = 0,
) => {

  if (rate === 0) {
    return -(
      fv +
      (pmt * nper)
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
    (
      -fv -
      (
        pmt *
        (1 + rate * type) *
        fvifa
      )
    ) / pvif
  );
};