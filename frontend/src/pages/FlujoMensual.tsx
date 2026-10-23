import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Container, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Box, Button, Stack } from "@mui/material";
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_URL = import.meta.env.VITE_API_URL;

interface Tarjeta { id: string; nombre: string; }
interface FlujoMensual { mes: string; importes: Record<string, number | string>; suma_total: number | string; }
interface FlujoResponse { tarjetas: Tarjeta[]; flujo: FlujoMensual[]; }

const FlujoMensual = () => {
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([]);
  const [flujo, setFlujo] = useState<FlujoMensual[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/flujo-mensual`)
      .then(async response => { if (!response.ok) throw new Error('Error al cargar flujo mensual'); return response.json() as Promise<FlujoResponse>; })
      .then(data => { setTarjetas(data.tarjetas); setFlujo(data.flujo); })
      .catch(err => { setError("Error al cargar flujo mensual"); console.error(err); })
      .finally(() => setLoading(false));
  }, []);

  const formatMonto = (monto: number | string | undefined) => {
    const valor = typeof monto === "string" ? parseFloat(monto) : monto;
    return `$${(Number.isFinite(valor) ? Number(valor) : 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  const formatFecha = (fecha: string) => {
    const [year, month] = fecha.slice(0, 10).split('-').map(Number);
    if (!year || !month) return '-';
    return new Intl.DateTimeFormat('es-MX', { year: 'numeric', month: 'long', timeZone: 'UTC' })
      .format(new Date(Date.UTC(year, month - 1, 1)));
  };
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const flujoFiltrado = flujo.filter(row => row.mes.slice(0, 7) >= currentMonthKey && Number(row.suma_total) > 0);

  const renderMontoCell = (monto: number | string, mes: string, tarjeta: Tarjeta) => {
    const valor = Number(monto) || 0;
    if (valor === 0) return <TableCell key={tarjeta.id} align="right">$0.00</TableCell>;
    return <TableCell key={tarjeta.id} align="right"><Link to={`/flujo/detalle?mes=${encodeURIComponent(mes)}&tarjeta=${encodeURIComponent(tarjeta.nombre)}`} style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 500 }}>{formatMonto(monto)}</Link></TableCell>;
  };

  const exportToExcel = () => {
    const data = flujoFiltrado.map(row => Object.fromEntries([['Mes', formatFecha(row.mes)], ...tarjetas.map(tarjeta => [tarjeta.nombre, Number(row.importes[tarjeta.id]) || 0]), ['Total', Number(row.suma_total) || 0]]));
    const ws = XLSX.utils.json_to_sheet(data); ws['!cols'] = [{ wch: 20 }, ...tarjetas.map(() => ({ wch: 15 })), { wch: 12 }];
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Flujo Mensual');
    XLSX.writeFile(wb, `flujo-mensual-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const margin = 8;
    const monthWidth = 28;
    const totalWidth = 22;
    const availableWidth = doc.internal.pageSize.getWidth() - (margin * 2);
    const cardWidth = tarjetas.length > 0
      ? Math.max(14, Math.min(20, (availableWidth - monthWidth - totalWidth) / tarjetas.length))
      : 20;
    const columnStyles = Object.fromEntries([
      [0, { cellWidth: monthWidth }],
      ...tarjetas.map((_, index) => [index + 1, { cellWidth: cardWidth, halign: 'right' as const }]),
      [tarjetas.length + 1, { cellWidth: totalWidth, halign: 'right' as const, fontStyle: 'bold' as const, fillColor: [240, 240, 240] }]
    ]);

    doc.setFontSize(16);
    doc.text('Flujo Mensual', margin, 14);
    doc.setFontSize(10);
    doc.text('Proyección de pagos pendientes por mes y tarjeta', margin, 21);
    autoTable(doc, {
      startY: 26,
      margin: { left: margin, right: margin },
      tableWidth: 'auto',
      head: [['Mes', ...tarjetas.map(tarjeta => tarjeta.nombre), 'Total']],
      body: flujoFiltrado.map(row => [formatFecha(row.mes), ...tarjetas.map(tarjeta => formatMonto(row.importes[tarjeta.id] || 0)), formatMonto(row.suma_total)]),
      theme: 'grid',
      headStyles: { fillColor: [0, 51, 102], textColor: 255, fontStyle: 'bold', fontSize: 7, cellPadding: 1.5 },
      styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak', valign: 'middle' },
      columnStyles,
      rowPageBreak: 'avoid'
    });
    doc.save(`flujo-mensual-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return <Container maxWidth={false} sx={{ px: { xs: 1, sm: 2, md: 3 }, width: '100%' }}>
    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}><Box><h1 style={{ margin: 0, color: '#333', fontSize: '1.6rem' }}>Flujo Mensual</h1><Typography variant="body2" color="text.secondary">Proyección de pagos pendientes por mes y tarjeta</Typography></Box><Stack direction="row" spacing={2}><Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={exportToExcel}>Excel</Button><Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={exportToPDF}>PDF</Button></Stack></Box>
    {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}{loading && <Typography>Cargando...</Typography>}
    <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto' }}><Table sx={{ minWidth: 1150 }}><TableHead><TableRow sx={{ bgcolor: '#003366' }}><TableCell sx={{ color: 'white' }}><strong>Mes</strong></TableCell>{tarjetas.map(tarjeta => <TableCell key={tarjeta.id} align="right" sx={{ color: 'white' }}><strong>{tarjeta.nombre}</strong></TableCell>)}<TableCell align="right" sx={{ color: 'white', bgcolor: '#002244' }}><strong>Total</strong></TableCell></TableRow></TableHead><TableBody>{flujoFiltrado.map(row => <TableRow key={row.mes} sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}><TableCell>{formatFecha(row.mes)}</TableCell>{tarjetas.map(tarjeta => renderMontoCell(row.importes[tarjeta.id] || 0, row.mes, tarjeta))}<TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'action.selected' }}>{formatMonto(row.suma_total)}</TableCell></TableRow>)}</TableBody></Table></TableContainer>
  </Container>;
};

export default FlujoMensual;
