"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getProductoById } from "@/lib/api";

type Pago = {
  periodo: number;
  saldo_inicial: number;
  interes: number;
  capital: number;
  pago: number;
  saldo_final: number;
};

export default function CotizacionDetallePage() {
  const searchParams = useSearchParams();

  const monto = Number(searchParams.get("monto") || 0);
  const plazo = Number(searchParams.get("plazo") || 0);
  const producto_id = Number(searchParams.get("producto_id"));

  const [tabla, setTabla] = useState<Pago[]>([]);
  const [producto, setProducto] = useState<any>(null);

  useEffect(() => {
    cargarProducto();
  }, []);

  useEffect(() => {
    if (producto) generarTabla();
  }, [producto]);

  const cargarProducto = async () => {
    try {
      const data = await getProductoById(producto_id);
      setProducto(data);
    } catch (err) {
      console.error("Error cargando producto", err);
    }
  };

  const getTasaFromSimulador = () => {
    try {
      if (!producto?.prod_simulador?.tasas_periodos) return 0;

      const tasas = JSON.parse(producto.prod_simulador.tasas_periodos);

      const tasaStr = tasas?.tasa?.quincenal;

      if (!tasaStr) return 0;

      return Number(tasaStr) / 100;
    } catch {
      return 0;
    }
  };

  const generarTabla = () => {
    if (!monto || !plazo) return;

    const tasa = getTasaFromSimulador();

    const pagos: Pago[] = [];
    let saldo = monto;

    const pagoFijo =
      (monto * tasa) / (1 - Math.pow(1 + tasa, -plazo));

    for (let i = 1; i <= plazo; i++) {
      const interes = saldo * tasa;
      const capital = pagoFijo - interes;
      const saldoFinal = saldo - capital;

      pagos.push({
        periodo: i,
        saldo_inicial: Number(saldo.toFixed(2)),
        interes: Number(interes.toFixed(2)),
        capital: Number(capital.toFixed(2)),
        pago: Number(pagoFijo.toFixed(2)),
        saldo_final: Number(saldoFinal.toFixed(2)),
      });

      saldo = saldoFinal;
    }

    setTabla(pagos);
  };

  return (
    <section className="portal-stack">
      <div className="hero-panel">
        <div>
          <h2>Detalle de cotización</h2>
          <p>Simulación con tasa real del producto</p>
        </div>
      </div>

      <div className="product-card" style={{ textAlign: "center" }}>
        <p>Monto: <b>${monto}</b></p>
        <p>Plazo: <b>{plazo}</b></p>
        <p>Tasa: <b>{(getTasaFromSimulador() * 100).toFixed(3)}%</b></p>
      </div>

      <div className="product-card">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: "12px" }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Saldo</th>
                <th>Interés</th>
                <th>Capital</th>
                <th>Pago</th>
                <th>Saldo Final</th>
              </tr>
            </thead>
            <tbody>
              {tabla.map((row) => (
                <tr key={row.periodo}>
                  <td>{row.periodo}</td>
                  <td>${row.saldo_inicial}</td>
                  <td>${row.interes}</td>
                  <td>${row.capital}</td>
                  <td>${row.pago}</td>
                  <td>${row.saldo_final}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}