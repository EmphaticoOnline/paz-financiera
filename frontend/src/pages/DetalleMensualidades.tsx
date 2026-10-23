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
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_URL = import.meta.env.VITE_API_URL;

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
        `${API_URL}/mensualidades/detalle?mes=${encodeURIComponent(mes)}&tarjeta=${encodeURIComponent(tarjeta)}`
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

  const parseMesString = (fecha: string | undefined | null) => {
    if (!fecha) return null;
    const [yearStr, monthStr] = fecha.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    if (!year || !month || month < 1 || month > 12) return null;
    const etiquetasMes = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return {
      year,
      month,
      label: `${etiquetasMes[month - 1]} ${year}`,
      ymKey: `${yearStr}-${monthStr.padStart(2, '0')}`
    };
  };

  const formatFecha = (fecha: string) => {
    const parsed = parseMesString(fecha);
    return parsed ? parsed.label : '-';
  };

  const calcularTotal = () => {
    return mensualidades.reduce((sum, m) => {
      const monto = typeof m.monto === 'string' ? parseFloat(m.monto) : m.monto;
      return sum + monto;
    }, 0);
  };

  const movimientos = mensualidades.length;
  const totalMonto = calcularTotal();

  const exportToExcel = () => {
    const data = mensualidadesOrdenadas.map((m) => ({
      Comercio: m.comercio,
      Concepto: m.concepto,
      'Mensualidad #': `${m.numero_mensualidad} de ${m.meses_sin_intereses}`,
      Monto: typeof m.monto === 'string' ? parseFloat(m.monto) : m.monto
    }));

    data.push({
      Comercio: '',
      Concepto: 'Total',
      'Mensualidad #': '',
      Monto: totalMonto
    } as any);

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Detalle');
    ws['!cols'] = [
      { wch: 24 }, // Comercio
      { wch: 30 }, // Concepto
      { wch: 14 }, // Mensualidad #
      { wch: 12 }  // Monto
    ];

    const fecha = mes ? formatFecha(mes) : 'sin-fecha';
    const nombreTarjeta = tarjeta ?? 'tarjeta';
    XLSX.writeFile(wb, `detalle-${nombreTarjeta}-${fecha}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Detalle de Mensualidades', 14, 15);
    doc.setFontSize(11);
    doc.text(`${tarjeta ?? ''} - ${mes ? formatFecha(mes) : ''}`, 14, 23);

    const body = mensualidadesOrdenadas.map((m) => [
      m.comercio,
      m.concepto || '-',
      `${m.numero_mensualidad} de ${m.meses_sin_intereses}`,
      formatMonto(m.monto)
    ]);

    body.push(['', 'Total', '', formatMonto(totalMonto)]);

    autoTable(doc, {
      startY: 30,
      head: [['Comercio', 'Concepto', 'Mensualidad #', 'Monto']],
      body,
      theme: 'grid',
      headStyles: { fillColor: [0, 51, 102], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 70 },
        2: { cellWidth: 28, halign: 'center' },
        3: { cellWidth: 25, halign: 'right' }
      }
    });

    const fecha = mes ? formatFecha(mes) : 'sin-fecha';
    const nombreTarjeta = tarjeta ?? 'tarjeta';
    doc.save(`detalle-${nombreTarjeta}-${fecha}.pdf`);
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
          <Paper sx={{ mb: 2, p: 2, display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }} elevation={2}>
            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Movimientos</Typography>
                <Typography variant="h6">{movimientos}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Suma de montos</Typography>
                <Typography variant="h6">{formatMonto(totalMonto)}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<FileDownloadIcon />}
                onClick={exportToExcel}
              >
                Excel
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<PictureAsPdfIcon />}
                onClick={exportToPDF}
              >
                PDF
              </Button>
            </Box>
          </Paper>
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
