import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box
} from "@mui/material";

interface FlujoMensual {
  mes: string;
  banamex: number | string;
  bbva: number | string;
  volaris: number | string;
  liverpool: number | string;
  palacio: number | string;
  mercado_pago: number | string;
  suma_total: number | string;
}

const FlujoMensual = () => {
  const [flujo, setFlujo] = useState<FlujoMensual[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cargarFlujo = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("http://localhost:4000/flujo-mensual");
      const data = await response.json();
      setFlujo(data);
    } catch (err) {
      setError("Error al cargar flujo mensual");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarFlujo();
  }, []);

  const formatMonto = (monto: number | string | undefined) => {
    if (monto === undefined || monto === null) return '$0.00';
    const valor = typeof monto === "string" ? parseFloat(monto) : monto;
    if (isNaN(valor)) return '$0.00';
    return `$${valor.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatFecha = (fecha: string) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
  };
  const renderMontoCell = (monto: number | string, mes: string, tarjeta: string) => {
    const valor = typeof monto === "string" ? parseFloat(monto) : monto;
    
    if (valor === 0) {
      return <TableCell align="right">$0.00</TableCell>;
    }

    return (
      <TableCell align="right">
        <Link
          to={`/flujo/detalle?mes=${encodeURIComponent(mes)}&tarjeta=${encodeURIComponent(tarjeta)}`}
          style={{
            color: '#1976d2',
            textDecoration: 'none',
            fontWeight: 500,
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.textDecoration = 'underline';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.textDecoration = 'none';
          }}
        >
          {formatMonto(monto)}
        </Link>
      </TableCell>
    );
  };
  // La view ya agrupa por mes y filtra por fechas futuras, solo filtramos valores > 0
  const flujoFiltrado = flujo.filter(row => {
    const banamex = typeof row.banamex === 'string' ? parseFloat(row.banamex) : row.banamex;
    const bbva = typeof row.bbva === 'string' ? parseFloat(row.bbva) : row.bbva;
    const volaris = typeof row.volaris === 'string' ? parseFloat(row.volaris) : row.volaris;
    const liverpool = typeof row.liverpool === 'string' ? parseFloat(row.liverpool) : row.liverpool;
    const palacio = typeof row.palacio === 'string' ? parseFloat(row.palacio) : row.palacio;
    const mercadoPago = typeof row.mercado_pago === 'string' ? parseFloat(row.mercado_pago) : row.mercado_pago;
    
    return banamex > 0 || bbva > 0 || volaris > 0 || liverpool > 0 || palacio > 0 || mercadoPago > 0;
  });

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 3 }}>
        <h1 style={{ margin: 0, color: '#333', fontSize: '1.6rem' }}>Flujo Mensual</h1>
        <Typography variant="body2" color="text.secondary">
          Proyección de pagos pendientes por mes y tarjeta
        </Typography>
      </Box>

      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      {loading && <Typography>Cargando...</Typography>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#003366' }}>
              <TableCell sx={{ color: 'white' }}><strong>Mes</strong></TableCell>
              <TableCell align="right" sx={{ color: 'white' }}><strong>Banamex</strong></TableCell>
              <TableCell align="right" sx={{ color: 'white' }}><strong>BBVA</strong></TableCell>
              <TableCell align="right" sx={{ color: 'white' }}><strong>Volaris</strong></TableCell>
              <TableCell align="right" sx={{ color: 'white' }}><strong>Liverpool</strong></TableCell>
              <TableCell align="right" sx={{ color: 'white' }}><strong>Palacio</strong></TableCell>
              <TableCell align="right" sx={{ color: 'white' }}><strong>Mercado Pago</strong></TableCell>
              <TableCell align="right" sx={{ color: 'white', bgcolor: '#002244' }}><strong>Total</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {flujoFiltrado.map((row, index) => (
              <TableRow 
                key={index}
                sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}
              >
                <TableCell>{formatFecha(row.mes)}</TableCell>
                {renderMontoCell(row.banamex, row.mes, 'Banamex')}
                {renderMontoCell(row.bbva, row.mes, 'BBVA')}
                {renderMontoCell(row.volaris, row.mes, 'Volaris')}
                {renderMontoCell(row.liverpool, row.mes, 'Liverpool')}
                {renderMontoCell(row.palacio, row.mes, 'Palacio')}
                {renderMontoCell(row.mercado_pago, row.mes, 'Mercado Pago')}
                <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'action.selected' }}>
                  {formatMonto(row.suma_total)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default FlujoMensual;
