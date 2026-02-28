import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from "@mui/material";

const API_URL = import.meta.env.VITE_API_URL;

type FlujoMensual = {
  mes: string;
  banamex: number | string;
  bbva: number | string;
  volaris: number | string;
  liverpool: number | string;
  liverpool_visa: number | string;
  palacio: number | string;
  mercado_pago: number | string;
  suma_total: number | string;
};

const Dashboard = () => {
  const [flujo, setFlujo] = useState<FlujoMensual[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/flujo`)
      .then(res => res.json())
      .then(data => setFlujo(data))
      .catch(error => console.error("Error al cargar flujo:", error));
  }, []);

  const formatMonto = (monto: number | string) => {
    const valor = typeof monto === "string" ? parseFloat(monto) : monto;
    return `$${valor.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatMes = (mes: string) => {
    const fecha = new Date(mes);
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;
  };

  return (
    <div>
      <h1 style={{ marginBottom: 30 }}>Dashboard</h1>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Mes</strong></TableCell>
              <TableCell align="right"><strong>Banamex</strong></TableCell>
              <TableCell align="right"><strong>BBVA</strong></TableCell>
              <TableCell align="right"><strong>Volaris</strong></TableCell>
              <TableCell align="right"><strong>Liverpool</strong></TableCell>
              <TableCell align="right"><strong>Liverpool Visa</strong></TableCell>
              <TableCell align="right"><strong>Palacio</strong></TableCell>
              <TableCell align="right"><strong>Mercado Pago</strong></TableCell>
              <TableCell align="right"><strong>Total</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {flujo.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{formatMes(row.mes)}</TableCell>
                <TableCell align="right">{formatMonto(row.banamex)}</TableCell>
                <TableCell align="right">{formatMonto(row.bbva)}</TableCell>
                <TableCell align="right">{formatMonto(row.volaris)}</TableCell>
                <TableCell align="right">{formatMonto(row.liverpool)}</TableCell>
                <TableCell align="right">{formatMonto(row.liverpool_visa)}</TableCell>
                <TableCell align="right">{formatMonto(row.palacio)}</TableCell>
                <TableCell align="right">{formatMonto(row.mercado_pago)}</TableCell>
                <TableCell align="right" style={{ fontWeight: "bold" }}>
                  {formatMonto(row.suma_total)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default Dashboard;
