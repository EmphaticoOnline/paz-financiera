import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from "@mui/material";

type Tarjeta = {
  id: string;
  nombre: string;
  ultimos4: string;
  ultimos4_digital: string;
  dia_corte: number;
  dia_pago: number;
};

const Tarjetas = () => {
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    ultimos4: "",
    ultimos4_digital: "",
    dia_corte: "",
    dia_pago: ""
  });

  const cargarTarjetas = async () => {
    const response = await fetch("http://localhost:4000/tarjetas");
    const data = await response.json();
    setTarjetas(data);
  };

  useEffect(() => {
    cargarTarjetas();
  }, []);

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setFormData({
      nombre: "",
      ultimos4: "",
      ultimos4_digital: "",
      dia_corte: "",
      dia_pago: ""
    });
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch("http://localhost:4000/tarjetas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          ultimos4: formData.ultimos4,
          ultimos4_digital: formData.ultimos4_digital,
          dia_corte: parseInt(formData.dia_corte),
          dia_pago: parseInt(formData.dia_pago)
        })
      });

      if (response.ok) {
        handleCloseModal();
        cargarTarjetas();
      }
    } catch (error) {
      console.error("Error al guardar tarjeta:", error);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
        <h1 style={{ margin: 0, color: '#222' }}>Tarjetas</h1>
        <Button variant="contained" color="primary" onClick={handleOpenModal}>
          Nueva tarjeta
        </Button>
      </div>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#003366' }}>
              <TableCell sx={{ py: 0.75, color: 'white' }}><strong>Nombre</strong></TableCell>
              <TableCell sx={{ py: 0.75, color: 'white' }}><strong>Últimos 4</strong></TableCell>
              <TableCell sx={{ py: 0.75, color: 'white' }}><strong>Últimos 4 Digital</strong></TableCell>
              <TableCell sx={{ py: 0.75, color: 'white' }}><strong>Día de corte</strong></TableCell>
              <TableCell sx={{ py: 0.75, color: 'white' }}><strong>Día de pago</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tarjetas.map((tarjeta) => (
              <TableRow key={tarjeta.id}>
                <TableCell sx={{ py: 0.5 }}>{tarjeta.nombre}</TableCell>
                <TableCell sx={{ py: 0.5 }}>{tarjeta.ultimos4 || '-'}</TableCell>
                <TableCell sx={{ py: 0.5 }}>{tarjeta.ultimos4_digital || '-'}</TableCell>
                <TableCell sx={{ py: 0.5 }}>{tarjeta.dia_corte}</TableCell>
                <TableCell sx={{ py: 0.5 }}>{tarjeta.dia_pago}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>Nueva Tarjeta</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            style={{ marginBottom: 16, marginTop: 8 }}
          />
          <TextField
            margin="dense"
            label="Últimos 4 dígitos"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.ultimos4}
            onChange={(e) => setFormData({ ...formData, ultimos4: e.target.value })}
            style={{ marginBottom: 16 }}
            inputProps={{ maxLength: 4 }}
          />
          <TextField
            margin="dense"
            label="Últimos 4 dígitos (Digital)"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.ultimos4_digital}
            onChange={(e) => setFormData({ ...formData, ultimos4_digital: e.target.value })}
            style={{ marginBottom: 16 }}
            inputProps={{ maxLength: 4 }}
          />
          <TextField
            margin="dense"
            label="Día de corte"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.dia_corte}
            onChange={(e) => setFormData({ ...formData, dia_corte: e.target.value })}
            style={{ marginBottom: 16 }}
          />
          <TextField
            margin="dense"
            label="Día de pago"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.dia_pago}
            onChange={(e) => setFormData({ ...formData, dia_pago: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Tarjetas;
