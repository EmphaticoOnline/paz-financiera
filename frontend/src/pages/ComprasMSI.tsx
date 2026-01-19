import { useEffect, useState } from "react";
import { useMediaQuery, useTheme } from "@mui/material";
import {
  Container,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  Stack,
  Tooltip,
  InputAdornment,
  Checkbox
} from "@mui/material";
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import ClearIcon from '@mui/icons-material/Clear';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ListAltIcon from '@mui/icons-material/ListAlt';

interface Tarjeta {
  id: string;
  nombre: string;
  dia_corte: number;
  dia_pago: number;
}

interface Compra {
  id: string;
  tarjeta_id: string;
  tarjeta?: string;
  comercio: string;
  concepto: string;
  monto: number | string;
  meses: number;
  fecha_compra: string;
  meses_pagados?: number;
  meses_restantes?: number;
  saldo_restante?: number | string;
  fecha_fin?: string;
}

interface Mensualidad {
  id: string;
  compra_id: string;
  tarjeta: string;
  numero_mensualidad: number;
  monto: number | string;
  pagada: boolean;
  fecha_pago: string | null;
  mes: string;
}

const ComprasMSI = () => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [vistaActual, setVistaActual] = useState<'cards' | 'table'>(isDesktop ? 'table' : 'cards');
  const [tarjetaFiltro, setTarjetaFiltro] = useState<string>("todas");
  const [busqueda, setBusqueda] = useState<string>("");
  const [mostrarSaldoCero, setMostrarSaldoCero] = useState<boolean>(false);
  const [orderBy, setOrderBy] = useState<keyof Compra>(() => {
    const saved = localStorage.getItem('comprasMSI_orderBy');
    return (saved as keyof Compra) || 'fecha_compra';
  });
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>(() => {
    const saved = localStorage.getItem('comprasMSI_orderDirection');
    return (saved as 'asc' | 'desc') || 'desc';
  });
  
  // Modal estados
  const [openModal, setOpenModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [compraActual, setCompraActual] = useState<Compra | null>(null);
  const [formData, setFormData] = useState({
    tarjeta_id: "",
    comercio: "",
    concepto: "",
    monto: "",
    meses: "",
    fecha_compra: ""
  });
  const [montoDisplay, setMontoDisplay] = useState(""); // Para mostrar formato visual

  // Modal confirmación eliminar
  const [openConfirm, setOpenConfirm] = useState(false);
  const [compraAEliminar, setCompraAEliminar] = useState<string | null>(null);

  // Modal confirmación recalcular
  const [openConfirmRecalcular, setOpenConfirmRecalcular] = useState(false);
  const [compraARecalcular, setCompraARecalcular] = useState<string | null>(null);
  const [openConfirmRecalcularTodas, setOpenConfirmRecalcularTodas] = useState(false);

  // Modal mensualidades
  const [openMensualidades, setOpenMensualidades] = useState(false);
  const [mensualidades, setMensualidades] = useState<Mensualidad[]>([]);
  const [compraSeleccionada, setCompraSeleccionada] = useState<Compra | null>(null);
  const [orderByMens, setOrderByMens] = useState<keyof Mensualidad>(() => {
    const saved = localStorage.getItem('comprasMSI_mensualidades_orderBy');
    return (saved as keyof Mensualidad) || 'mes';
  });
  const [orderDirectionMens, setOrderDirectionMens] = useState<'asc' | 'desc'>(() => {
    const saved = localStorage.getItem('comprasMSI_mensualidades_orderDirection');
    return (saved as 'asc' | 'desc') || 'asc';
  });

  const cargarDatos = async () => {
    setLoading(true);
    setError("");
    try {
      const [tarjetasRes, comprasRes] = await Promise.all([
        fetch("http://localhost:4000/tarjetas"),
        fetch("http://localhost:4000/compras")
      ]);
      const tarjetasData = await tarjetasRes.json();
      const comprasData = await comprasRes.json();
      setTarjetas(tarjetasData);
      setCompras(comprasData.sort((a: Compra, b: Compra) => 
        new Date(b.fecha_compra).getTime() - new Date(a.fecha_compra).getTime()
      ));
    } catch (err) {
      setError("Error al cargar datos");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    localStorage.setItem('comprasMSI_orderBy', orderBy);
    localStorage.setItem('comprasMSI_orderDirection', orderDirection);
  }, [orderBy, orderDirection]);

  useEffect(() => {
    localStorage.setItem('comprasMSI_mensualidades_orderBy', orderByMens);
    localStorage.setItem('comprasMSI_mensualidades_orderDirection', orderDirectionMens);
  }, [orderByMens, orderDirectionMens]);

  const handleNuevaCompra = () => {
    setModoEdicion(false);
    setCompraActual(null);
    // Inicializar fecha con la fecha actual LOCAL (no UTC)
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    const fechaHoy = `${year}-${month}-${day}`;
    
    setFormData({
      tarjeta_id: "",
      comercio: "",
      concepto: "",
      monto: "",
      meses: "",
      fecha_compra: fechaHoy
    });
    setMontoDisplay("");
    setOpenModal(true);
  };

  const handleEditarCompra = (compra: Compra) => {
    setModoEdicion(true);
    setCompraActual(compra);
    const montoNum = typeof compra.monto === 'string' ? parseFloat(compra.monto) : compra.monto;
    const montoStr = montoNum.toFixed(2);
    setFormData({
      tarjeta_id: compra.tarjeta_id,
      comercio: compra.comercio,
      concepto: compra.concepto,
      monto: montoStr,
      meses: compra.meses.toString(),
      fecha_compra: compra.fecha_compra
    });
    // Formatear como moneda para display inicial
    const formatted = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(montoNum);
    setMontoDisplay(formatted);
    setOpenModal(true);
  };

  const handleCerrarModal = () => {
    setOpenModal(false);
    setCompraActual(null);
    setFormData({
      tarjeta_id: "",
      comercio: "",
      concepto: "",
      monto: "",
      meses: "",
      fecha_compra: ""
    });
    setMontoDisplay("");
  };

  const handleMontoChange = (value: string) => {
    // Permitir escribir libremente: números, punto decimal, y borrar
    // Remover símbolos de moneda y comas para trabajar con el valor
    const cleaned = value.replace(/[$,]/g, '');
    
    // Permitir números, punto decimal y string vacío
    if (cleaned === '' || /^\d*\.?\d*$/.test(cleaned)) {
      // Actualizar display directamente con lo que escribe
      setMontoDisplay(cleaned);
      // Guardar valor limpio en formData
      setFormData({ ...formData, monto: cleaned });
    }
  };

  const handleMontoBlur = () => {
    // Al perder el foco, formatear como moneda
    if (formData.monto === '' || formData.monto === '.') {
      setMontoDisplay('');
      setFormData({ ...formData, monto: '' });
      return;
    }
    
    const num = parseFloat(formData.monto);
    if (!isNaN(num)) {
      // Formatear como moneda mexicana
      const formatted = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(num);
      
      setMontoDisplay(formatted);
      // Mantener el valor numérico limpio en formData
      setFormData({ ...formData, monto: num.toFixed(2) });
    }
  };

  const handleMontoFocus = () => {
    // Al hacer focus, mostrar el valor sin formato para facilitar edición
    if (formData.monto) {
      setMontoDisplay(formData.monto);
    }
  };

  const handleGuardar = async () => {
    try {
      // Validar que todos los campos requeridos estén llenos
      if (!formData.tarjeta_id || !formData.comercio || !formData.concepto || 
          !formData.monto || !formData.meses || !formData.fecha_compra) {
        setError("Todos los campos son requeridos");
        return;
      }

      const body = {
        tarjeta_id: formData.tarjeta_id,
        comercio: formData.comercio,
        concepto: formData.concepto,
        monto: parseFloat(formData.monto),
        meses: parseInt(formData.meses),
        fecha_compra: formData.fecha_compra
      };

      console.log('📤 Enviando datos al backend:', body);

      let response;
      if (modoEdicion && compraActual) {
        response = await fetch(`http://localhost:4000/compras/${compraActual.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
      } else {
        response = await fetch("http://localhost:4000/compras", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
      }

      console.log('📥 Respuesta del backend:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errorData.error || `Error HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Datos guardados exitosamente:', data);

      alert(modoEdicion ? '✅ Compra actualizada exitosamente' : '✅ Compra registrada exitosamente');
      handleCerrarModal();
      cargarDatos();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error al guardar compra";
      setError(errorMsg);
      alert('❌ ' + errorMsg);
      console.error('❌ Error al guardar:', err);
    }
  };

  const handleEliminarClick = (id: string) => {
    setCompraAEliminar(id);
    setOpenConfirm(true);
  };

  const handleConfirmarEliminar = async () => {
    if (!compraAEliminar) return;
    
    try {
      await fetch(`http://localhost:4000/compras/${compraAEliminar}`, {
        method: "DELETE"
      });
      setOpenConfirm(false);
      setCompraAEliminar(null);
      cargarDatos();
    } catch (err) {
      setError("Error al eliminar compra");
      console.error(err);
    }
  };

  const handleRecalcularClick = (id: string) => {
    setCompraARecalcular(id);
    setOpenConfirmRecalcular(true);
  };

  const handleConfirmarRecalcular = async () => {
    if (!compraARecalcular) return;
    
    try {
      setLoading(true);
      await fetch(`http://localhost:4000/compras/${compraARecalcular}/recalcular`, {
        method: "POST"
      });
      setOpenConfirmRecalcular(false);
      setCompraARecalcular(null);
      cargarDatos();
    } catch (err) {
      setError("Error al recalcular mensualidades");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalcularTodasClick = () => {
    setOpenConfirmRecalcularTodas(true);
  };

  const handleConfirmarRecalcularTodas = async () => {
    try {
      setLoading(true);
      await fetch("http://localhost:4000/compras/recalcular-todas", {
        method: "POST"
      });
      setOpenConfirmRecalcularTodas(false);
      cargarDatos();
    } catch (err) {
      setError("Error al recalcular todas las mensualidades");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerMensualidades = async (compra: Compra) => {
    setCompraSeleccionada(compra);
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:4000/mensualidades/${compra.id}`);
      const data = await response.json();
      setMensualidades(data);
      setOpenMensualidades(true);
    } catch (err) {
      setError("Error al cargar mensualidades");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSortMens = (column: keyof Mensualidad) => {
    const isAsc = orderByMens === column && orderDirectionMens === 'asc';
    setOrderDirectionMens(isAsc ? 'desc' : 'asc');
    setOrderByMens(column);
  };

  const mensualidadesOrdenadas = [...mensualidades].sort((a, b) => {
    let aValue = a[orderByMens];
    let bValue = b[orderByMens];

    if ((aValue === undefined || aValue === null) && (bValue === undefined || bValue === null)) return 0;
    if (aValue === undefined || aValue === null) return orderDirectionMens === 'asc' ? 1 : -1;
    if (bValue === undefined || bValue === null) return orderDirectionMens === 'asc' ? -1 : 1;

    if (orderByMens === 'monto') {
      aValue = typeof aValue === 'string' ? parseFloat(aValue as string) : aValue as number;
      bValue = typeof bValue === 'string' ? parseFloat(bValue as string) : bValue as number;
    }

    if (aValue < bValue) {
      return orderDirectionMens === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return orderDirectionMens === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const getNombreTarjeta = (tarjeta_id: string) => {
    const tarjeta = tarjetas.find(t => t.id === tarjeta_id);
    return tarjeta ? tarjeta.nombre : tarjeta_id;
  };

  const formatMonto = (monto: number | string) => {
    const valor = typeof monto === "string" ? parseFloat(monto) : monto;
    return `$${valor.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  // Calcular pago mensual estimado
  const calcularPagoMensual = () => {
    const monto = parseFloat(formData.monto);
    const meses = parseInt(formData.meses);
    if (isNaN(monto) || isNaN(meses) || meses === 0) return null;
    return monto / meses;
  };

  // Calcular fecha del último pago
  const calcularFechaUltimoPago = () => {
    if (!formData.tarjeta_id || !formData.fecha_compra || !formData.meses) return null;
    
    const tarjeta = tarjetas.find(t => t.id === formData.tarjeta_id);
    if (!tarjeta) return null;

    const fechaCompra = new Date(formData.fecha_compra);
    const diaCompra = fechaCompra.getDate();
    const mesCompra = fechaCompra.getMonth(); // 0-11
    const anioCompra = fechaCompra.getFullYear();
    
    // Determinar si alcanzó el corte
    const alcanzaCorte = diaCompra <= tarjeta.dia_corte;
    
    // Calcular primer pago
    let mesPrimerPago = alcanzaCorte ? mesCompra + 1 : mesCompra + 2;
    let anioPrimerPago = anioCompra;
    
    // Ajustar año si el mes se pasa de 11
    if (mesPrimerPago > 11) {
      anioPrimerPago += Math.floor(mesPrimerPago / 12);
      mesPrimerPago = mesPrimerPago % 12;
    }
    
    // Calcular fecha del último pago (primer pago + (meses - 1))
    const meses = parseInt(formData.meses);
    let mesUltimoPago = mesPrimerPago + (meses - 1);
    let anioUltimoPago = anioPrimerPago;
    
    if (mesUltimoPago > 11) {
      anioUltimoPago += Math.floor(mesUltimoPago / 12);
      mesUltimoPago = mesUltimoPago % 12;
    }
    
    // Crear fecha del último pago con dia_pago
    const fechaUltimoPago = new Date(anioUltimoPago, mesUltimoPago, tarjeta.dia_pago);
    return fechaUltimoPago;
  };

  const pagoMensual = calcularPagoMensual();
  const fechaUltimoPago = calcularFechaUltimoPago();

  const handleSort = (column: keyof Compra) => {
    const isAsc = orderBy === column && orderDirection === 'asc';
    setOrderDirection(isAsc ? 'desc' : 'asc');
    setOrderBy(column);
  };

  const comprasFiltradas = compras.filter(c => {
    // Filtro por saldo cero
    if (!mostrarSaldoCero) {
      const saldoRestante = c.saldo_restante !== undefined 
        ? (typeof c.saldo_restante === 'string' ? parseFloat(c.saldo_restante) : c.saldo_restante)
        : null;
      if (saldoRestante !== null && saldoRestante === 0) {
        return false;
      }
    }
    
    // Filtro por tarjeta
    const pasaTarjeta = tarjetaFiltro === "todas" || c.tarjeta_id === tarjetaFiltro;
    
    // Filtro por búsqueda
    if (!busqueda.trim()) {
      return pasaTarjeta;
    }
    
    const terminoBusqueda = busqueda.toLowerCase().trim();
    
    // Buscar en strings
    const nombreTarjeta = (c.tarjeta || getNombreTarjeta(c.tarjeta_id)).toLowerCase();
    const comercio = c.comercio.toLowerCase();
    const concepto = c.concepto.toLowerCase();
    
    const coincideString = nombreTarjeta.includes(terminoBusqueda) ||
                          comercio.includes(terminoBusqueda) ||
                          concepto.includes(terminoBusqueda);
    
    // Buscar en números
    const monto = typeof c.monto === 'string' ? parseFloat(c.monto) : c.monto;
    const saldoRestante = c.saldo_restante !== undefined 
      ? (typeof c.saldo_restante === 'string' ? parseFloat(c.saldo_restante) : c.saldo_restante)
      : null;
    const mesesRestantes = c.meses_restantes;
    
    const numerosBusqueda = parseFloat(terminoBusqueda);
    const coincideNumero = !isNaN(numerosBusqueda) && (
      monto.toString().includes(terminoBusqueda) ||
      (saldoRestante !== null && saldoRestante.toString().includes(terminoBusqueda)) ||
      (mesesRestantes !== undefined && mesesRestantes.toString().includes(terminoBusqueda))
    );
    
    return pasaTarjeta && (coincideString || coincideNumero);
  });

  const comprasOrdenadas = [...comprasFiltradas].sort((a, b) => {
    let aValue = a[orderBy];
    let bValue = b[orderBy];

    // Manejar valores undefined
    if (aValue === undefined && bValue === undefined) return 0;
    if (aValue === undefined) return orderDirection === 'asc' ? 1 : -1;
    if (bValue === undefined) return orderDirection === 'asc' ? -1 : 1;

    // Convertir valores a números si es monto, saldo_restante o meses_restantes
    if (orderBy === 'monto' || orderBy === 'saldo_restante' || orderBy === 'meses_restantes') {
      aValue = typeof aValue === 'string' ? parseFloat(aValue as string) : aValue as number;
      bValue = typeof bValue === 'string' ? parseFloat(bValue as string) : bValue as number;
    }

    // Comparación
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <h1 style={{ margin: 0, color: '#333', fontSize: '1.6rem' }}>Compras a Meses Sin Intereses</h1>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            size="small"
            placeholder="Buscar..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            sx={{ minWidth: 200 }}
            InputProps={{
              endAdornment: busqueda && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setBusqueda("")}
                    edge="end"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filtrar por tarjeta</InputLabel>
            <Select
              value={tarjetaFiltro}
              onChange={(e) => setTarjetaFiltro(e.target.value)}
              label="Filtrar por tarjeta"
            >
              <MenuItem value="todas">Todas las tarjetas</MenuItem>
              {tarjetas.map(t => (
                <MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <ToggleButtonGroup
            value={vistaActual}
            exclusive
            onChange={(_, newView) => newView && setVistaActual(newView)}
            size="small"
          >
            <ToggleButton value="cards">
              <ViewModuleIcon />
            </ToggleButton>
            <ToggleButton value="table">
              <ViewListIcon />
            </ToggleButton>
          </ToggleButtonGroup>
          <Tooltip title="Nueva Compra">
            <IconButton color="primary" onClick={handleNuevaCompra} sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}>
              <AddIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Recalcular mensualidades">
            <IconButton color="secondary" onClick={handleRecalcularTodasClick} sx={{ bgcolor: 'secondary.main', color: 'white', '&:hover': { bgcolor: 'secondary.dark' } }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={mostrarSaldoCero ? "Ocultar compras pagadas" : "Mostrar compras pagadas"}>
            <IconButton 
              onClick={() => setMostrarSaldoCero(!mostrarSaldoCero)} 
              sx={{ 
                bgcolor: mostrarSaldoCero ? 'action.selected' : 'action.hover',
                '&:hover': { bgcolor: mostrarSaldoCero ? 'action.selected' : 'action.focus' }
              }}
            >
              {mostrarSaldoCero ? <VisibilityIcon /> : <VisibilityOffIcon />}
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      {loading && <Typography>Cargando...</Typography>}

      {/* Vista Cards */}
      {vistaActual === 'cards' && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {comprasOrdenadas.map((compra) => (
            <Box key={compra.id} sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)' } }}>
              <Card>
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="h6" component="div" gutterBottom>
                    {getNombreTarjeta(compra.tarjeta_id)}
                  </Typography>
                  <Typography color="text.secondary" gutterBottom>
                    {compra.comercio}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {compra.concepto}
                  </Typography>
                  <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                    {formatMonto(compra.monto)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {compra.meses} meses • {formatFecha(compra.fecha_compra)}
                  </Typography>
                </CardContent>
                <CardActions sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
                  <IconButton size="small" color="primary" onClick={() => handleEditarCompra(compra)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleEliminarClick(compra.id)}>
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      {/* Vista Tabla */}
      {vistaActual === 'table' && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#003366' }}>
                <TableCell 
                  sx={{ cursor: 'pointer', userSelect: 'none', color: 'white', py: 0.75 }}
                  onClick={() => handleSort('tarjeta_id')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <strong>Tarjeta</strong>
                    {orderBy === 'tarjeta_id' && (
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
                  sx={{ cursor: 'pointer', userSelect: 'none', color: 'white' }}
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
                  align="right"
                  sx={{ cursor: 'pointer', userSelect: 'none', color: 'white' }}
                  onClick={() => handleSort('monto')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                    <strong>Monto Total</strong>
                    {orderBy === 'monto' && (
                      orderDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                    )}
                  </Box>
                </TableCell>
                <TableCell 
                  align="right"
                  sx={{ cursor: 'pointer', userSelect: 'none', color: 'white' }}
                  onClick={() => handleSort('saldo_restante')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                    <strong>Saldo Restante</strong>
                    {orderBy === 'saldo_restante' && (
                      orderDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                    )}
                  </Box>
                </TableCell>
                <TableCell 
                  align="center"
                  sx={{ cursor: 'pointer', userSelect: 'none', color: 'white' }}
                  onClick={() => handleSort('meses_restantes')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
                    <strong>Meses Restantes</strong>
                    {orderBy === 'meses_restantes' && (
                      orderDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                    )}
                  </Box>
                </TableCell>
                <TableCell 
                  sx={{ cursor: 'pointer', userSelect: 'none', color: 'white' }}
                  onClick={() => handleSort('fecha_compra')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <strong>Fecha Compra</strong>
                    {orderBy === 'fecha_compra' && (
                      orderDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                    )}
                  </Box>
                </TableCell>
                <TableCell 
                  sx={{ cursor: 'pointer', userSelect: 'none', color: 'white' }}
                  onClick={() => handleSort('fecha_fin')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <strong>Fecha Fin</strong>
                    {orderBy === 'fecha_fin' && (
                      orderDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                    )}
                  </Box>
                </TableCell>
                <TableCell align="center" sx={{ color: 'white' }}><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {comprasOrdenadas.map((compra) => (
                <TableRow 
                  key={compra.id}
                  sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}
                >
                  <TableCell>{compra.tarjeta || getNombreTarjeta(compra.tarjeta_id)}</TableCell>
                  <TableCell>{compra.comercio}</TableCell>
                  <TableCell>{compra.concepto}</TableCell>
                  <TableCell align="right">{formatMonto(compra.monto)}</TableCell>
                  <TableCell align="right">
                    {compra.saldo_restante !== undefined ? formatMonto(compra.saldo_restante) : '-'}
                  </TableCell>
                  <TableCell align="center">
                    {compra.meses_restantes !== undefined ? compra.meses_restantes : compra.meses}
                  </TableCell>
                  <TableCell>{formatFecha(compra.fecha_compra)}</TableCell>
                  <TableCell>{compra.fecha_fin ? formatFecha(compra.fecha_fin) : '-'}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="Ver mensualidades">
                        <IconButton size="small" onClick={() => handleVerMensualidades(compra)}>
                          <ListAltIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Recalcular">
                        <IconButton size="small" color="secondary" onClick={() => handleRecalcularClick(compra.id)}>
                          <RefreshIcon />
                        </IconButton>
                      </Tooltip>
                      <IconButton size="small" color="primary" onClick={() => handleEditarCompra(compra)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleEliminarClick(compra.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Modal Formulario */}
      <Dialog open={openModal} onClose={handleCerrarModal} maxWidth="sm" fullWidth>
        <DialogTitle>{modoEdicion ? 'Editar Compra' : 'Nueva Compra'}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Tarjeta</InputLabel>
            <Select
              value={formData.tarjeta_id}
              onChange={e => setFormData({ ...formData, tarjeta_id: e.target.value })}
              required
              label="Tarjeta"
            >
              {tarjetas.map(t => (
                <MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            margin="normal"
            label="Comercio"
            value={formData.comercio}
            onChange={e => setFormData({ ...formData, comercio: e.target.value })}
            required
          />

          <TextField
            fullWidth
            margin="normal"
            label="Concepto"
            value={formData.concepto}
            onChange={e => setFormData({ ...formData, concepto: e.target.value })}
            required
          />

          <TextField
            fullWidth
            margin="normal"
            label="Monto"
            type="text"
            value={montoDisplay}
            onChange={e => handleMontoChange(e.target.value)}
            onFocus={handleMontoFocus}
            onBlur={handleMontoBlur}
            placeholder="0.00"
            required
          />

          <TextField
            fullWidth
            margin="normal"
            label="Meses"
            type="number"
            inputProps={{ min: 1, max: 60 }}
            value={formData.meses}
            onChange={e => setFormData({ ...formData, meses: e.target.value })}
            required
          />

          <TextField
            fullWidth
            margin="normal"
            label="Fecha de compra"
            type="date"
            value={formData.fecha_compra}
            onChange={e => setFormData({ ...formData, fecha_compra: e.target.value })}
            required
            InputLabelProps={{ 
              shrink: true 
            }}
            inputProps={{
              max: new Date().toISOString().split('T')[0] // No permitir fechas futuras
            }}
            sx={{
              '& input[type="date"]::-webkit-calendar-picker-indicator': {
                cursor: 'pointer',
                opacity: 1,
                display: 'block'
              }
            }}
          />

          {/* Resumen de cálculos */}
          {pagoMensual !== null && (
            <Box sx={{ mt: 3, p: 2.5, bgcolor: '#E3F2FD', borderRadius: 2, border: '1px solid #90CAF9' }}>
              <Typography variant="body1" sx={{ color: '#1976D2', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <span style={{ fontSize: '1.2rem' }}>💳</span>
                <strong>Pago mensual estimado:</strong> 
                <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                  ${pagoMensual.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </Typography>
              {fechaUltimoPago && (
                <Typography variant="body1" sx={{ color: '#1976D2', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span style={{ fontSize: '1.2rem' }}>📅</span>
                  <strong>Último pago:</strong> 
                  <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {fechaUltimoPago.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCerrarModal}>Cancelar</Button>
          <Button onClick={handleGuardar} variant="contained" color="primary">
            {modoEdicion ? 'Actualizar' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Confirmación Eliminar */}
      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>¿Estás seguro de que deseas eliminar esta compra?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirm(false)}>Cancelar</Button>
          <Button onClick={handleConfirmarEliminar} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Confirmación Recalcular Una */}
      <Dialog open={openConfirmRecalcular} onClose={() => setOpenConfirmRecalcular(false)}>
        <DialogTitle>Confirmar recalcular mensualidades</DialogTitle>
        <DialogContent>
          <Typography>¿Estás seguro de que deseas recalcular las mensualidades de esta compra?</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esto eliminará y regenerará todas las mensualidades asociadas.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmRecalcular(false)}>Cancelar</Button>
          <Button onClick={handleConfirmarRecalcular} color="secondary" variant="contained">
            Recalcular
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Confirmación Recalcular Todas */}
      <Dialog open={openConfirmRecalcularTodas} onClose={() => setOpenConfirmRecalcularTodas(false)}>
        <DialogTitle>Confirmar recalcular TODAS las mensualidades</DialogTitle>
        <DialogContent>
          <Typography color="error" fontWeight="bold">
            ¡ATENCIÓN! Esta acción recalculará las mensualidades de TODAS las compras.
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Esto eliminará todas las mensualidades existentes y las regenerará desde cero.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            ¿Deseas continuar?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmRecalcularTodas(false)}>Cancelar</Button>
          <Button onClick={handleConfirmarRecalcularTodas} color="secondary" variant="contained">
            Sí, Recalcular Todas
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Mensualidades */}
      <Dialog open={openMensualidades} onClose={() => setOpenMensualidades(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Mensualidades - {compraSeleccionada?.comercio} ({compraSeleccionada?.concepto})
        </DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#003366' }}>
                  <TableCell 
                    sx={{ cursor: 'pointer', userSelect: 'none', color: 'white' }}
                    onClick={() => handleSortMens('mes')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <strong>Mes</strong>
                      {orderByMens === 'mes' && (
                        orderDirectionMens === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell 
                    align="center"
                    sx={{ cursor: 'pointer', userSelect: 'none', color: 'white' }}
                    onClick={() => handleSortMens('numero_mensualidad')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
                      <strong>Núm.</strong>
                      {orderByMens === 'numero_mensualidad' && (
                        orderDirectionMens === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell 
                    align="right"
                    sx={{ cursor: 'pointer', userSelect: 'none', color: 'white' }}
                    onClick={() => handleSortMens('monto')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                      <strong>Monto</strong>
                      {orderByMens === 'monto' && (
                        orderDirectionMens === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell 
                    align="center"
                    sx={{ cursor: 'pointer', userSelect: 'none', color: 'white' }}
                    onClick={() => handleSortMens('pagada')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
                      <strong>Pagada</strong>
                      {orderByMens === 'pagada' && (
                        orderDirectionMens === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell 
                    sx={{ cursor: 'pointer', userSelect: 'none', color: 'white' }}
                    onClick={() => handleSortMens('fecha_pago')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <strong>Fecha Pago</strong>
                      {orderByMens === 'fecha_pago' && (
                        orderDirectionMens === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mensualidadesOrdenadas.map((mensualidad) => {
                  // Verificar si la fecha del mes ya pasó
                  const fechaMensualidad = new Date(mensualidad.mes);
                  const fechaActual = new Date();
                  fechaMensualidad.setHours(0, 0, 0, 0);
                  fechaActual.setHours(0, 0, 0, 0);
                  const esFechaPasada = fechaMensualidad <= fechaActual;
                  
                  return (
                    <TableRow 
                      key={mensualidad.id}
                      sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}
                    >
                      <TableCell>{formatFecha(mensualidad.mes)}</TableCell>
                      <TableCell align="center">{mensualidad.numero_mensualidad}</TableCell>
                      <TableCell align="right">{formatMonto(mensualidad.monto)}</TableCell>
                      <TableCell align="center">
                        <Checkbox checked={mensualidad.pagada || esFechaPasada} disabled size="small" />
                      </TableCell>
                      <TableCell>{mensualidad.fecha_pago ? formatFecha(mensualidad.fecha_pago) : '-'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMensualidades(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ComprasMSI;
