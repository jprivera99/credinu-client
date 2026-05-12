// utils/productos/cotizarProductos.js

export const cotizarProductos = (productos, data) => {
  const resultados = {};

  for (const key in productos) {
    const producto = productos[key];

    switch (Number(producto.id)) {
      case 1:
        resultados[producto.id] = calcularAdelantoNomina(producto, data);

        break;

      case 2:
        resultados[producto.id] = calcularAnticipoAguinaldo(producto, data);

        break;

      case 3:
        resultados[producto.id] = calcularPrestamoPersonal(producto, data);

        break;
    }
  }

  return resultados;
};
