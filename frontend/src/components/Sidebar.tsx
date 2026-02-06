"use client"

import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

interface SidebarProps {
  open: boolean
}

export default function Sidebar({ open }: SidebarProps) {
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["Inicio"])
  const location = useLocation()
  const { validarModulo } = useAuth()

  //funcion para validar menu
  //some devuelve true si al menos un elemento cumple la condicion


  const toggleMenu = (menu: string) => {
    setExpandedMenus((prev) => (prev.includes(menu) ? prev.filter((m) => m !== menu) : [...prev, menu]))
  }

  const menuItems = [
    {
      label: "Inicio",
      href: "/dashboard",
      icon: "🏠",
      submenu: [],
    },
    ...(validarModulo("Finanzas")
      ? [
          {
            label: "Finanzas",
            href: "#",
            icon: "💰",
            submenu: [
              { label: "Arqueo", href: "/dashboard/finanzas/calendar" },
              ...(validarModulo("Finanzas.Informe_Efectivo") ? [{ label: "Informe de Efectivo", href: "/dashboard/finanzas/informe-efectivo" }] : []),
              { label: "Buscar Flujo de Efectivo", href: "/dashboard/finanzas/buscar-informe-efectivo" },
            ],
          },
        ]
      : []),
    ...(validarModulo("Logistica") ? [
      {
        label: "Logistica",
        href:"#",
        icon: "🚛",
        submenu: [
          { label: "Pago Fletes", href: "/dashboard/logistica/fletes" },
          { label: "Reporte de Fletes", href: "/dashboard/logistica/reporte-fletes" },
          { label: "Estadisticas Fletes", href: "/dashboard/logistica/estadistica-fletes",icon: "🚛" },
        ],
      }
    ] : [] ),  
    ...(validarModulo("Reportes")
      ? [
          {
            label: "Reportes",
            href: "#",
            icon: "📊",
            submenu: [
              { label: "Estado de Cuenta Proveedores", href: "/dashboard/reportes/proveedores" },
              { label: "Ventas", href: "/dashboard/reportes/ventas" },
              { label: "Saldos en Cuentas", href: "/dashboard/reportes/saldos" },
              { label: "Ejemplo", href: "/dashboard/reportes/ejemplo" }
            ],
          },
        ]
      : []),
    ...(validarModulo("Solicitudes")
    ? [
        {
          label: "Solicitudes",
          href: "#",
          icon: "🧾",
          submenu: [
            { label: "Crear solicitud", href: "/dashboard/solicitudes/crear" },
            
            { label: "Estado de solicitudes", href: "/dashboard/solicitudes/consulta" },
            
          ],
        },
      ]
    : []),
      
    { 
      label: "Preguntale a la IA",
      href: "/dashboard/chatbot/chatbotgpt", 
      icon: "🤖", 
      submenu: [] 
    },
         
      
    ...(validarModulo("Configuracion")
      ? [
          {
            label: "Configuración",
            href: "#",
            icon: "⚙️",
            submenu: [
              { label: "Usuarios", href: "/dashboard/configuracion/usuarios" },
              { label: "Roles", href: "/dashboard/configuracion/roles" },
              { label: "Empresas", href: "/dashboard/configuracion/empresas" },
            ],
          },
        ]
      : []),
  ]

  return (
    <aside
  className={`${open ? "w-72" : "w-20"} bg-red-700 min-h-screen transition-all duration-300 ease-in-out shadow-2xl flex flex-col border-r-4 border-yellow-300`}
>
  {/* Header del Sidebar */}
  <div className="p-6 mb-4">
    <div className={`h-8 flex items-center ${open ? "justify-start" : "justify-center"}`}>
      {/* Icono del Logo: Ahora en Amarillo para resaltar sobre el Rojo */}
      <div className="w-8 h-8 bg-yellow-300 rounded-lg flex-shrink-0 shadow-lg shadow-black/20"></div>
      {open && (
        <span className="ml-3 text-white font-extrabold tracking-wider text-xl italic drop-shadow-md">
          En Dios Confiamos
        </span>
      )}
    </div>
  </div>

  <nav className="flex-1 px-2 space-y-1 overflow-y-auto custom-scrollbar">
    {menuItems.map((item) => (
      <div key={item.label} className="py-1">
        {item.submenu.length === 0 ? (
          <Link
            to={item.href}
            className={`flex items-center px-2 py-2 rounded-xl transition-all duration-200 group ${
              location.pathname === item.href
                ? "bg-yellow-300 text-black shadow-lg" // Item activo: Fondo amarillo, texto negro
                : "text-red-100 hover:bg-red-700 hover:text-white" // Inactivo: Texto blanquecino sobre rojo
            }`}
          >
            <span className="flex-shrink-0 text-xl">
              <div className={`w-6 h-6 flex items-center justify-center rounded font-bold ${
                location.pathname === item.href ? "text-black" : "text-yellow-300 group-hover:text-white"
              }`}> 
                {item.icon}               
              </div>
            </span>
            {open && <span className="ml-4 font-semibold transition-opacity duration-300">{item.label}</span>}
          </Link>
        ) : (
          <>
            <button
              onClick={() => toggleMenu(item.label)}
              className={`w-full flex items-center justify-between px-2 py-2 rounded-xl transition-all duration-200 group ${
                expandedMenus.includes(item.label)
                  ? "text-yellow-300 bg-red-700/50"
                  : "text-red-100 hover:bg-red-700 hover:text-white"
              }`}
            >
              <div className="flex items-center">
                <span className={`flex-shrink-0 w-6 h-6 flex items-center justify-center font-bold ${
                  expandedMenus.includes(item.label) ? "text-yellow-300" : "text-yellow-300/80 group-hover:text-yellow-300"
                }`}>
                  {item.icon}
                </span>
                {open && <span className="ml-4 font-semibold">{item.label}</span>}
              </div>
              {open && (
                <svg 
                  className={`w-4 h-2 transition-transform duration-300 ${expandedMenus.includes(item.label) ? "rotate-180 text-yellow-300" : "text-red-300"}`} 
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>

            {expandedMenus.includes(item.label) && open && (
              <div className="ml-10 mt-2 space-y-1 border-l-2 border-yellow-300/30">
                {item.submenu.map((subitem) => (
                  <Link
                    key={subitem.href}
                    to={subitem.href}
                    className={`block px-2 py-0 text-sm transition-all duration-200 ${
                      location.pathname === subitem.href
                        ? "text-yellow-300 font-bold"
                        : "text-red-200 hover:text-white hover:bg-red-700/30 rounded-lg"
                    }`}
                  >
                    {subitem.label}
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    ))}
  </nav>
</aside>
  )
}
