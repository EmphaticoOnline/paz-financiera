import { useEffect, useState } from "react";
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
  Box,
  Checkbox
} from "@mui/material";
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

interface Mensualidad {
  id: string;
  compra_id: string;
  tarjeta: string;
  comercio: string;
  concepto: string;
  numero_mensualidad: number;
  monto: number | string;
  pagada: boolean;
  fecha_pago: string | null;
  mes: string;
}

const Mensualidades = () => {
  const [mensualidades, setMensualidades] = useState<Mensualidad[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderBy, setOrderBy] = useState<keyof Mensualidad>('mes');
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('asc');

  const cargarMensualidades = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("http://localhost:4000/mensualidades");
      const data = await response.json();
      setMensualidades(data);
    } catch (err) {
      setError("Error al cargar mensualidades");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMensualidades();
  }, []);

  const formatMonto = (monto: number | string) => {
    const valor = typeof monto === "string" ? parseFloat(monto) : monto;
    return `$${valor.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatFecha = (fecha: string | null) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  const handleSort = (column: keyof Mensualidad) => {
    const isAsc = orderBy === column && orderDirection === 'asc';
    setOrderDirection(isAsc ? 'desc' : 'asc');
    setOrderBy(column);
  };

  const mensualidadesOrdenadas = [...mensualidades].sort((a, b) => {
    let aValue = a[orderBy];
    let bValue = b[orderBy];

    if (aValue === undefined && bValue === undefined) return 0;
    if (aValue === undefined) return orderDirection === 'asc' ? 1 : -1;
    if (bValue === undefined) return orderDirection === 'asc' ? -1 : 1;

    if (orderBy === 'monto') {
      aValue = typeof aValue === 'string' ? parseFloat(aValue as string) : aValue as number;
      bValue = typeof bValue === 'string' ? parseFloat(bValue as string) : bValue as number;
    }

    if (aValue < bValue) {
      return orderDirection === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return orderDirection === 'asc' ? 1 : -1;
    }
    return 0;
  });

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 3 }}>
        <h1 style={{ margin: 0, color: '#333', fontSize: '1.6rem' }}>Mensualidades</h1>
      </Box>

      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      {loading && <Typography>Cargando...</Typography>}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#003366' }}>
              <TableCell 
                sx={{ cursor: 'pointer', userSelect: 'none', color: 'white', py: 0.75 }}
                onClick={() => handleSort('tarjeta')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <strong>Tarjeta</strong>
                  {orderBy === 'tarjeta' && (
                    orderDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                  )}
                </Box>
              </TableCell>
              <TableCell 
                sx={{ cursor: 'pointer', userSelect: 'none', color: 'white', py: 0.75 }}
                onClick={() => handleSort('comercio')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <strong>Comercio</strong>
                  {orderBy === 'comercio' && (
                    orderDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                  )}
                </Box>
              </TableCell>
              <TableCell 
                sx={{ cursor: 'pointer', userSelect: 'none', color: 'white', py: 0.75 }}
                onClick={() => handleSort('concepto')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <strong>Concepto</strong>
                  {orderBy === 'concepto' && (
                    orderDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                  )}
                </Box>
              </TableCell>
              <TableCell 
                sx={{ cursor: 'pointer', userSelect: 'none', color: 'white', py: 0.75 }}
                onClick={() => handleSort('mes')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <strong>Mes</strong>
                  {orderBy === 'mes' && (
                    orderDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                  )}
                </Box>
              </TableCell>
              <TableCell 
                align="center"
                sx={{ cursor: 'pointer', userSelect: 'none', color: 'white', py: 0.75 }}
                onClick={() => handleSort('numero_mensualidad')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
                  <strong>Núm.</strong>
                  {orderBy === 'numero_mensualidad' && (
                    orderDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                  )}
                </Box>
              </TableCell>
              <TableCell 
                align="right"
                sx={{ cursor: 'pointer', userSelect: 'none', color: 'white', py: 0.75 }}
                onClick={() => handleSort('monto')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                  <strong>Monto</strong>
                  {orderBy === 'monto' && (
                    orderDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                  )}
                </Box>
              </TableCell>
              <TableCell 
                align="center"
                sx={{ cursor: 'pointer', userSelect: 'none', color: 'white', py: 0.75 }}
                onClick={() => handleSort('pagada')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
                  <strong>Pagada</strong>
                  {orderBy === 'pagada' && (
                    orderDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                  )}
                </Box>
              </TableCell>
              <TableCell 
                sx={{ cursor: 'pointer', userSelect: 'none', color: 'white', py: 0.75 }}
                onClick={() => handleSort('fecha_pago')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <strong>Fecha Pago</strong>
                  {orderBy === 'fecha_pago' && (
                    orderDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                  )}
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mensualidadesOrdenadas.map((mensualidad) => (
              <TableRow 
                key={mensualidad.id}
                sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}
              >
                <TableCell sx={{ py: 0.5 }}>{mensualidad.tarjeta}</TableCell>
                <TableCell sx={{ py: 0.5 }}>{mensualidad.comercio}</TableCell>
                <TableCell sx={{ py: 0.5 }}>{mensualidad.concepto}</TableCell>
                <TableCell sx={{ py: 0.5 }}>{formatFecha(mensualidad.mes)}</TableCell>
                <TableCell align="center" sx={{ py: 0.5 }}>{mensualidad.numero_mensualidad}</TableCell>
                <TableCell align="right" sx={{ py: 0.5 }}>{formatMonto(mensualidad.monto)}</TableCell>
                <TableCell align="center" sx={{ py: 0.5 }}>
                  <Checkbox checked={mensualidad.pagada} disabled />
                </TableCell>
                <TableCell sx={{ py: 0.5 }}>{formatFecha(mensualidad.fecha_pago)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default Mensualidades;
