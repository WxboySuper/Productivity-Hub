import React from "react";

type SidebarItem = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  variant?: "danger";
};

interface SidebarProps {
  collapsed: boolean;
  onCollapse: () => void;
  items: SidebarItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onCollapse, items }) => (
  <aside className={`phub-sidebar ${collapsed ? "phub-sidebar-collapsed" : ""}`}>
    <button className="phub-sidebar-toggle" onClick={items[0].onClick} style={{ marginBottom: "1rem" }}>
      {items[0].icon} {!collapsed && items[0].label}
    </button>
    <button
      className="phub-sidebar-toggle"
      onClick={onCollapse}
      style={{
        background: "rgba(59, 130, 246, 0.1)",
        fontSize: "0.9rem",
        marginBottom: "1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: collapsed ? "3rem" : "auto",
        minWidth: "3rem",
        padding: collapsed ? "0.75rem" : "0.75rem 1rem",
        border: "1px solid rgba(59, 130, 246, 0.2)",
      }}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      {collapsed ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5">
          <polyline points="9,18 15,12 9,6"></polyline>
        </svg>
      ) : (
        <>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.5"
            style={{ marginRight: "0.5rem" }}
          >
            <polyline points="15,18 9,12 15,6"></polyline>
          </svg>
          <span style={{ color: "#3b82f6", fontSize: "0.875rem", fontWeight: 600 }}>Collapse</span>
        </>
      )}
    </button>
    <nav className="phub-sidebar-nav">
      {items.slice(1).map((item) => (
        <button
          key={item.label}
          className={`phub-sidebar-item ${item.active ? "phub-sidebar-item-active" : ""}`}
          onClick={item.onClick}
          style={
            item.variant === "danger"
              ? {
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  color: "white",
                  border: "1px solid #dc2626",
                }
              : {}
          }
        >
          {item.icon}
          {!collapsed && <span className="phub-sidebar-label">{item.label}</span>}
        </button>
      ))}
    </nav>
  </aside>
);

export default Sidebar;
