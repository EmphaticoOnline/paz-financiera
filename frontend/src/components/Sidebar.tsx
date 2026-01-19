import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: "/flujo", label: "Flujo mensual", icon: "💰" },
    { path: "/compras", label: "Compras MSI", icon: "🛒" },
    { path: "/mensualidades", label: "Mensualidades", icon: "📅" },
    { path: "/tarjetas", label: "Tarjetas", icon: "💳" },
    { path: "/config", label: "Configuración", icon: "⚙️" }
  ];

  return (
    <div style={{
      width: 250,
      height: "100vh",
      backgroundColor: "#1a1a2e",
      color: "#fff",
      position: "fixed",
      left: 0,
      top: 0,
      display: "flex",
      flexDirection: "column",
      padding: "20px 0"
    }}>
      <div style={{ padding: "0 20px", marginBottom: 40 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: "bold" }}>Paz Financiera</h2>
      </div>

      <nav>
        {menuItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "15px 20px",
              color: "#fff",
              textDecoration: "none",
              backgroundColor: location.pathname === item.path ? "#0f3460" : "transparent",
              borderLeft: location.pathname === item.path ? "4px solid #16a085" : "4px solid transparent",
              transition: "all 0.2s"
            }}
            onMouseEnter={e => {
              if (location.pathname !== item.path) {
                e.currentTarget.style.backgroundColor = "#0f3460";
              }
            }}
            onMouseLeave={e => {
              if (location.pathname !== item.path) {
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          >
            <span style={{ marginRight: 12, fontSize: 20 }}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
