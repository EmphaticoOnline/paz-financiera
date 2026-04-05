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
  Box,
  Button,
  Stack
} from "@mui/material";
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_URL = import.meta.env.VITE_API_URL;

interface FlujoMensual {
  mes: string;
  banamex: number | string;
  bbva: number | string;
  volaris: number | string;
  liverpool: number | string;
  liverpool_visa: number | string;
  palacio: number | string;
  mercado_pago: number | string;
  hsbc?: number | string;
  inbursa?: number | string;
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
      const response = await fetch(`${API_URL}/flujo-mensual`);
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
  const startOfCurrentMonthKey = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();

  // Filtrar por meses >= mes actual y valores > 0
  const flujoFiltrado = flujo.filter(row => {
    const parsedMes = parseMesString(row.mes);

    if (!parsedMes) return false;
    if (parsedMes.ymKey < startOfCurrentMonthKey) return false;

    const banamex = typeof row.banamex === 'string' ? parseFloat(row.banamex) : row.banamex;
    const bbva = typeof row.bbva === 'string' ? parseFloat(row.bbva) : row.bbva;
    const volaris = typeof row.volaris === 'string' ? parseFloat(row.volaris) : row.volaris;
    const liverpool = typeof row.liverpool === 'string' ? parseFloat(row.liverpool) : row.liverpool;
    const liverpoolVisa = typeof row.liverpool_visa === 'string' ? parseFloat(row.liverpool_visa) : row.liverpool_visa;
    const palacio = typeof row.palacio === 'string' ? parseFloat(row.palacio) : row.palacio;
    const mercadoPago = typeof row.mercado_pago === 'string' ? parseFloat(row.mercado_pago) : row.mercado_pago;
    const hsbc = typeof row.hsbc === 'string' ? parseFloat(row.hsbc) : row.hsbc ?? 0;
    const inbursa = typeof row.inbursa === 'string' ? parseFloat(row.inbursa) : row.inbursa ?? 0;
    
    return banamex > 0 || bbva > 0 || volaris > 0 || liverpool > 0 || liverpoolVisa > 0 || palacio > 0 || mercadoPago > 0 || hsbc > 0 || inbursa > 0;
  });

  const exportToExcel = () => {
    const data = flujoFiltrado.map(row => ({
      'Mes': formatFecha(row.mes),
      'Banamex': typeof row.banamex === 'string' ? parseFloat(row.banamex) : row.banamex,
      'BBVA': typeof row.bbva === 'string' ? parseFloat(row.bbva) : row.bbva,
      'Volaris': typeof row.volaris === 'string' ? parseFloat(row.volaris) : row.volaris,
      'Liverpool': typeof row.liverpool === 'string' ? parseFloat(row.liverpool) : row.liverpool,
      'Liverpool Visa': typeof row.liverpool_visa === 'string' ? parseFloat(row.liverpool_visa) : row.liverpool_visa,
      'Palacio': typeof row.palacio === 'string' ? parseFloat(row.palacio) : row.palacio,
      'HSBC': typeof row.hsbc === 'string' ? parseFloat(row.hsbc) : row.hsbc ?? 0,
      'Inbursa': typeof row.inbursa === 'string' ? parseFloat(row.inbursa) : row.inbursa ?? 0,
      'Mercado Pago': typeof row.mercado_pago === 'string' ? parseFloat(row.mercado_pago) : row.mercado_pago,
      'Total': typeof row.suma_total === 'string' ? parseFloat(row.suma_total) : row.suma_total
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Flujo Mensual');
    
    // Ajustar ancho de columnas
    const wscols = [
      { wch: 20 }, // Mes
      { wch: 12 }, // Banamex
      { wch: 12 }, // BBVA
      { wch: 12 }, // Volaris
      { wch: 12 }, // Liverpool
  { wch: 14 }, // Liverpool Visa
      { wch: 12 }, // Palacio
      { wch: 12 }, // HSBC
      { wch: 12 }, // Inbursa
      { wch: 15 }, // Mercado Pago
      { wch: 12 }  // Total
    ];
    ws['!cols'] = wscols;
    
    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `flujo-mensual-${fecha}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('Flujo Mensual', 14, 15);
    doc.setFontSize(10);
    doc.text('Proyección de pagos pendientes por mes y tarjeta', 14, 22);
    
    const tableData = flujoFiltrado.map(row => [
      formatFecha(row.mes),
      formatMonto(row.banamex),
      formatMonto(row.bbva),
      formatMonto(row.volaris),
      formatMonto(row.liverpool),
      formatMonto(row.liverpool_visa),
      formatMonto(row.palacio),
      formatMonto(row.hsbc ?? 0),
      formatMonto(row.inbursa ?? 0),
      formatMonto(row.mercado_pago),
      formatMonto(row.suma_total)
    ]);

    autoTable(doc, {
      startY: 28,
  head: [['Mes', 'Banamex', 'BBVA', 'Volaris', 'Liverpool', 'Liverpool Visa', 'Palacio', 'HSBC', 'Inbursa', 'Mercado Pago', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 51, 102], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 20, halign: 'right' },
        2: { cellWidth: 20, halign: 'right' },
        3: { cellWidth: 20, halign: 'right' },
        4: { cellWidth: 20, halign: 'right' },
        5: { cellWidth: 20, halign: 'right' },
        6: { cellWidth: 20, halign: 'right' },
        7: { cellWidth: 20, halign: 'right' },
        8: { cellWidth: 20, halign: 'right' },
        9: { cellWidth: 25, halign: 'right' },
        10:{ cellWidth: 20, halign: 'right', fontStyle: 'bold', fillColor: [240, 240, 240] }
      }
    });

    const fecha = new Date().toISOString().split('T')[0];
    doc.save(`flujo-mensual-${fecha}.pdf`);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <h1 style={{ margin: 0, color: '#333', fontSize: '1.6rem' }}>Flujo Mensual</h1>
          <Typography variant="body2" color="text.secondary">
            Proyección de pagos pendientes por mes y tarjeta
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={exportToExcel}
            sx={{ 
              borderColor: '#16a085',
              color: '#16a085',
              '&:hover': {
                borderColor: '#0f7a68',
                bgcolor: 'rgba(22, 160, 133, 0.04)'
              }
            }}
          >
            Excel
          </Button>
          <Button
            variant="outlined"
            startIcon={<PictureAsPdfIcon />}
            onClick={exportToPDF}
            sx={{ 
              borderColor: '#e74c3c',
              color: '#e74c3c',
              '&:hover': {
                borderColor: '#c0392b',
                bgcolor: 'rgba(231, 76, 60, 0.04)'
              }
            }}
          >
            PDF
          </Button>
        </Stack>
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
              <TableCell align="right" sx={{ color: 'white' }}><strong>Liverpool Visa</strong></TableCell>
              <TableCell align="right" sx={{ color: 'white' }}><strong>Palacio</strong></TableCell>
              <TableCell align="right" sx={{ color: 'white' }}><strong>HSBC</strong></TableCell>
              <TableCell align="right" sx={{ color: 'white' }}><strong>Inbursa</strong></TableCell>
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
                {renderMontoCell(row.liverpool_visa, row.mes, 'Liverpool Visa')}
                {renderMontoCell(row.palacio, row.mes, 'Palacio')}
                {renderMontoCell(row.hsbc ?? 0, row.mes, 'HSBC')}
                {renderMontoCell(row.inbursa ?? 0, row.mes, 'Inbursa')}
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
