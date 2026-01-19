import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
  Button,
  CircularProgress
} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

interface MensualidadDetalle {
  id: string;
  mes: string;
  numero_mensualidad: number;
  monto: number | string;
  comercio: string;
  concepto: string;
  meses_sin_intereses: number;
  compra_id: string;
}

const DetalleMensualidades = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const mes = searchParams.get('mes');
  const tarjeta = searchParams.get('tarjeta');
  
  const [mensualidades, setMensualidades] = useState<MensualidadDetalle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderBy, setOrderBy] = useState<keyof MensualidadDetalle>('comercio');
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('asc');

  const cargarDetalle = async () => {
    if (!mes || !tarjeta) {
      setError("Parámetros inválidos");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const response = await fetch(
        `http://localhost:4000/mensualidades/detalle?mes=${encodeURIComponent(mes)}&tarjeta=${encodeURIComponent(tarjeta)}`
      );
      
      if (!response.ok) {
        throw new Error('Error al cargar datos');
      }
      
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
    cargarDetalle();
  }, [mes, tarjeta]);

  const handleSort = (column: keyof MensualidadDetalle) => {
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

  const formatMonto = (monto: number | string) => {
    const valor = typeof monto === "string" ? parseFloat(monto) : monto;
    return `$${valor.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatFecha = (fecha: string) => {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'long' });
  };

  const calcularTotal = () => {
    return mensualidades.reduce((sum, m) => {
      const monto = typeof m.monto === 'string' ? parseFloat(m.monto) : m.monto;
      return sum + monto;
    }, 0);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/flujo')}
        >
          Regresar
        </Button>
        <Box>
          <Typography variant="h4" sx={{ color: '#333' }}>
            Detalle de Mensualidades
          </Typography>
          <Typography variant="h6" sx={{ color: '#666' }}>
            {tarjeta} - {mes ? formatFecha(mes) : ''}
          </Typography>
        </Box>
      </Box>

      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#003366' }}>
                  <TableCell 
                    sx={{ color: 'white', cursor: 'pointer', userSelect: 'none', py: 0.75 }}
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
                    sx={{ color: 'white', cursor: 'pointer', userSelect: 'none', py: 0.75 }}
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
                    align="center" 
                    sx={{ color: 'white', cursor: 'pointer', userSelect: 'none', py: 0.75 }}
                    onClick={() => handleSort('numero_mensualidad')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      <strong>Mensualidad #</strong>
                      {orderBy === 'numero_mensualidad' && (
                        orderDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell 
                    align="right" 
                    sx={{ color: 'white', cursor: 'pointer', userSelect: 'none', py: 0.75 }}
                    onClick={() => handleSort('monto')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                      <strong>Monto</strong>
                      {orderBy === 'monto' && (
                        orderDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mensualidadesOrdenadas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      No hay mensualidades pendientes para este mes
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {mensualidadesOrdenadas.map((m) => (
                      <TableRow 
                        key={m.id}
                        sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}
                      >
                        <TableCell>{m.comercio}</TableCell>
                        <TableCell>{m.concepto || '-'}</TableCell>
                        <TableCell align="center">{m.numero_mensualidad} de {m.meses_sin_intereses}</TableCell>
                        <TableCell align="right">{formatMonto(m.monto)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: '#E3F2FD' }}>
                      <TableCell colSpan={3} align="right">
                        <strong>Total:</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>{formatMonto(calcularTotal())}</strong>
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Container>
  );
};

export default DetalleMensualidades;
