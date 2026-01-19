import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Tarjetas from "./pages/Tarjetas";
import ComprasMSI from "./pages/ComprasMSI";
import Mensualidades from "./pages/Mensualidades";
import FlujoMensual from "./pages/FlujoMensual";
import DetalleMensualidades from "./pages/DetalleMensualidades";
import Configuracion from "./pages/Configuracion";

function App() {
  return (
    <Router>
      <div style={{ minHeight: "100vh" }}>
        <Navbar />
        
        <main style={{
          marginTop: 64,
          padding: 40,
          backgroundColor: "#f9f9f9",
          minHeight: "calc(100vh - 64px)"
        }}>
          <Routes>
            <Route path="/" element={<FlujoMensual />} />
            <Route path="/tarjetas" element={<Tarjetas />} />
            <Route path="/compras" element={<ComprasMSI />} />
            <Route path="/mensualidades" element={<Mensualidades />} />
            <Route path="/flujo" element={<FlujoMensual />} />
            <Route path="/flujo/detalle" element={<DetalleMensualidades />} />
            <Route path="/config" element={<Configuracion />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
