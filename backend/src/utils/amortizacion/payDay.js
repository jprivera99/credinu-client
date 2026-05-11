// utils/amortizacion/payDay.js

export const formatDate = (date) => {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// ADD WEEKS
export const addWeeks = (
  date,
  howMany,
) => {

  const d = new Date(date);

  d.setDate(
    d.getDate() + (howMany * 7),
  );

  return formatDate(d);
};

// ADD MONTHS
export const addMonths = (
  date,
  howMany,
) => {

  const d = new Date(date);

  d.setMonth(
    d.getMonth() + howMany,
  );

  return formatDate(d);
};

// ADD DAYS
export const addDays = (
  date,
  howMany,
) => {

  const d = new Date(date);

  d.setDate(
    d.getDate() + howMany,
  );

  return formatDate(d);
};

// LAST DAY OF MONTH
export const getLastDayOfMonth = (
  date,
) => {

  const d = new Date(date);

  const year = d.getFullYear();

  const month = d.getMonth();

  // Día 0 del siguiente mes
  // = último día del actual
  const lastDay = new Date(
    year,
    month + 1,
    0,
  );

  return formatDate(lastDay);
};

// PAY DAY
export const payDay = (
  dateStart,
  payNumber,
  paymentPeriod,
) => {

  switch (paymentPeriod) {

    // SEMANAL
    case 110:

      return addWeeks(
        dateStart,
        payNumber,
      );

    // QUINCENAL
    case 111: {

      let ret;

      const fecha = new Date(dateStart);

      const mes = fecha.getMonth() + 1;

      const dia = fecha.getDate();

      // FEBRERO 15
      if (
        mes === 2 &&
        dia === 15
      ) {

        ret = addDays(
          dateStart,
          payNumber * 12,
        );

      } else {

        ret = addDays(
          dateStart,
          payNumber * 15,
        );
      }
      
      // AJUSTAR 15 / FIN MES
      if (payNumber > 0) {

        const fechaRet = new Date(ret);

        if (
          fechaRet.getDate() > 15
        ) {

          ret =
            getLastDayOfMonth(
              ret,
            );

        } else {

          fechaRet.setDate(15);

          ret = formatDate(
            fechaRet,
          );
        }
      }

      return ret;
    }

    // MENSUAL
    case 112:

      return addMonths(
        dateStart,
        payNumber,
      );

    // CATORCENAL
    case 118:

      return addDays(
        dateStart,
        payNumber * 14,
      );

    // DECENAL
    case 1157:

      return addDays(
        dateStart,
        payNumber * 10,
      );

    default:

      return dateStart;
  }
};