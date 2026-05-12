export const money = (value) =>
  Number(
    Number(value).toFixed(2),
  );

export const ceil50 = (value) => {

  value = Math.ceil(value);

  let decenas =
    Number(
      String(value).slice(-2),
    );

  value -= decenas;

  decenas =
    decenas < 50
      ? 50
      : 100;

  value += decenas;

  return value;
};