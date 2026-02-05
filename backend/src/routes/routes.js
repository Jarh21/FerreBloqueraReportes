// Logística
import { obtenerFletesCancelados,obtenerAutosFletes, obtenerAutos,obtenerAutosQueRealizaronFletes,guardarFletesSeleccionados,obtenerAutosSiace,guardarVehiculo,obtenerTotalFletesPorVehiculo, obtenerDetalleFacturasPorVehiculo } from "../modules/logistica/logistica.controller.js"

import express from "express"
// NUEVOS IMPORTS PARA ARCHIVOS
import multer from "multer"
import path from "path"

// Auth
import { registro, login, logout, me } from "../modules/auth/auth.controller.js"
import { authMiddleware, adminMiddleware } from "../middleware/auth.js"
// Empresas
import { obtenerEmpresas, obtenerTodasEmpresas, crearEmpresa, actualizarEmpresa, obtenerEmpresasPorUsuario } from "../modules/empresas/empresas.controller.js"
// Finanzas
import {obtenerCatalogoTipoMoneda,obtenerHistorialTasaTipoMoneda,registrarHistorialTasaTipoMoneda,editarHistorialTasaTipoMoneda,obtenerTodosTipoMoneda,obtenerContContable,obtenerFinanzas,crearFinanza,listaAsesores,guardarCuadreArqueoCerrado,exportarAlFlujoEfectivoSiace,obtenerGastosPorFecha,obtenerTasaDiaSiace,obtenerTodoEfectivoDetallado,obtenerTodoEfectivoEgresos,listarArqueosCerrados,obtenerModosPagoDetalle,obtenerDenominaciones,eliminarCuadreArqueoEgreso,guardarDenominacionesCuadre,guardarCuadreArqueoIngreso,obtenerCuadreEfectivoDetallado,eliminarCuadreEfectivoDetallado,obtenerDatosArqueoAsesor,obtenerConceptosContables,guardarCuadreArqueoGasto,obtenerCuadreArqueoEgresos,obtenerSumatoriaModosPagoAsesor,guardarObservacionGeneralCuadreAsesor,obtenerObservacionGeneralCaudreAsesor,listarObservacionesGeneralCuadreAsesor,listarObservacionesGeneralCuadre,editarGastosAsesor,obtenerTotalEfectivoMovPagos,obtenerTotalEfectivoYGastosAgrupadosPorAsesor,eliminarObservacionGeneralCaudreAsesor,buscarFlujoEfectivoSiacePorFecha} from "../modules/finanzas/finanzas.controller.js"
// Reportes
import { obtenerEstadoProveedores, obtenerVentas, obtenerSaldos, totalSaldoEmpresa } from "../modules/reportes/reportes.controller.js"
// Usuarios
import { obtenerUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario, editarUsuarios, obtenerRoles} from "../modules/usuarios/usuarios.controller.js"
// Solicitudes - Entidades
import { ObtenerEntidades} from "../modules/solicitudes/entidades.controller.js"
// Solicitudes - Controller (Agregado ProcesarPago aquí)
import { CrearSolicitud, ObtenerSolicitudes, BuscarBeneficiarios, ProcesarPago, AnularSolicitud } from "../modules/solicitudes/solicitudes.controller.js";
//chatbot
import { obtenerRespuestaChatbot } from "../modules/chatbot/chatbot.controller.js";
// --- CONFIGURACIÓN DE MULTER (CARGA DE IMÁGENES) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // La carpeta debe existir en tu servidor: 'public/uploads/comprobantes'
        cb(null, 'public/uploads/comprobantes'); 
    },
    filename: (req, file, cb) => {
        // Generamos nombre único: timestamp + aleatorio + extensión original
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });
// ----------------------------------------------------

const router = express.Router()

// Auth
router.post("/auth/registro", registro)
router.post("/auth/login", login)
router.post("/auth/logout", logout)
router.get("/auth/me", authMiddleware, me)

// Empresas
router.get("/empresas/",authMiddleware, obtenerEmpresas)
router.get("/empresas/todas",  obtenerTodasEmpresas)
router.get("/empresas/usuario/mis-empresas", authMiddleware, obtenerEmpresasPorUsuario)
router.post("/empresas/", authMiddleware, adminMiddleware, crearEmpresa)
router.put("/empresas/:id", authMiddleware, adminMiddleware, actualizarEmpresa)

// Finanzas
router.post("/finanzas/", authMiddleware, crearFinanza)
router.get("/finanzas/lista-asesores/:empresaId/:fecha",authMiddleware,listaAsesores)
router.get("/finanzas/tipos-pago-detalle",  obtenerModosPagoDetalle)
router.get("/finanzas/denominaciones/:tipo_moneda", authMiddleware, obtenerDenominaciones)
router.post("/finanzas/cuadre-denominacion", authMiddleware, guardarDenominacionesCuadre)
router.post("/finanzas/cuadre-arqueo-ingreso", authMiddleware, guardarCuadreArqueoIngreso)
router.get("/finanzas/cuadre-efectivo-detallado/:codusua", authMiddleware, obtenerCuadreEfectivoDetallado)
router.delete("/finanzas/cuadre-efectivo-detallado/:id", authMiddleware, eliminarCuadreEfectivoDetallado)
// ... Resto de rutas de finanzas restauradas del corte ...
//router.get("/finanzas/cuadre-stream/:empresaId/:codusua", authMiddleware, sseSubscribeCuadre)
router.get("/finanzas/datos-arqueo-asesor/:empresaId/:fecha/:codusua", authMiddleware, obtenerDatosArqueoAsesor)
router.get("/finanzas/conceptos-contables/:empresaId", authMiddleware, obtenerConceptosContables)
router.post("/finanzas/cuadre-arqueo-gasto", authMiddleware, guardarCuadreArqueoGasto)
router.get("/finanzas/cuadre-arqueo-egresos/:codusua", authMiddleware, obtenerCuadreArqueoEgresos)
router.delete("/finanzas/cuadre-arqueo-egresos/:id", authMiddleware, eliminarCuadreArqueoEgreso)
router.get("/finanzas/cuadre-movimientos-pagos-asesor/:empresaId/:fecha/:codusua", authMiddleware,obtenerSumatoriaModosPagoAsesor)
router.post("/finanzas/cuadre-arqueo-cerrado", authMiddleware, guardarCuadreArqueoCerrado)
router.get("/finanzas/cuadre-listar-arqueo-cerrado/:empresaId/:fecha",authMiddleware,listarArqueosCerrados)
router.get("/finanzas/cuadre-listar-todo-efectivo-detallado/:empresaId/:fecha",authMiddleware,obtenerTodoEfectivoDetallado)
router.get("/finanzas/cuadre-listar-todo-efectivo-egresos/:empresaId/:fecha",authMiddleware,obtenerTodoEfectivoEgresos)
router.get("/finanzas/cuadre-obtener-gastos-conceptos/:empresaId/:fecha",authMiddleware,obtenerGastosPorFecha)
router.get("/finanzas/cuadre-obtener-tasa-siace/:empresaId/:fecha",authMiddleware,obtenerTasaDiaSiace)
router.post("/finanzas/cuadre-arqueo-observacion", authMiddleware, guardarObservacionGeneralCuadreAsesor)
router.get("/finanzas/cuadre-arqueo-observacion/:empresaId/:fecha/:codusua", authMiddleware, obtenerObservacionGeneralCaudreAsesor)
router.get("/finanzas/cuadre-arqueo-observaciones/:empresaId/:fecha/:codusua", authMiddleware, listarObservacionesGeneralCuadreAsesor)
router.get("/finanzas/cuadre-arqueo-observaciones-general/:empresaId/:fecha", authMiddleware, listarObservacionesGeneralCuadre)
router.delete("/finanzas/cuadre-arqueo-observaciones/:id", authMiddleware, eliminarObservacionGeneralCaudreAsesor)
router.put("/finanzas/cuadre-editar-gastos/:id",authMiddleware,editarGastosAsesor)
router.get("/finanzas/cuadre-total-efectivo-mov-pagos/:empresaId/:fecha",authMiddleware,obtenerTotalEfectivoMovPagos)
router.get("/finanzas/cuadre-total-efectivo-egresos/:empresaId/:fecha",authMiddleware,obtenerTotalEfectivoYGastosAgrupadosPorAsesor)
router.get("/finanzas/exportar-flujo-efectivo-siace/:empresaId/:fecha", authMiddleware, exportarAlFlujoEfectivoSiace)
router.get("/finanzas/:empresaId", authMiddleware, obtenerFinanzas)
router.post("/finanzas/flujo-efectivo-siace", authMiddleware, buscarFlujoEfectivoSiacePorFecha)
router.get("/finanzas/contable-cuenta/:empresaId",authMiddleware, obtenerContContable)
router.get("/finanzas/tipo-moneda/:empresaId",authMiddleware, obtenerTodosTipoMoneda)
router.get("/finanzas/tipo-moneda-catalogo/:empresaId", authMiddleware, obtenerCatalogoTipoMoneda)
router.get("/finanzas/tipo-moneda-historial/:empresaId", authMiddleware, obtenerHistorialTasaTipoMoneda)
router.post("/finanzas/tipo-moneda-historial", authMiddleware, registrarHistorialTasaTipoMoneda)
router.put("/finanzas/tipo-moneda-historial/:id", authMiddleware, editarHistorialTasaTipoMoneda)

// ...agrega aquí el resto de rutas de finanzas según tu archivo original

// Reportes
router.get("/reportes/proveedores/:empresaId", authMiddleware, obtenerEstadoProveedores)
router.get("/reportes/ventas/:empresaId", authMiddleware, obtenerVentas)
router.get("/reportes/saldos/:empresaId", authMiddleware, obtenerSaldos)
router.get("/reportes/total-saldo/:empresaId",  totalSaldoEmpresa)

// Pagos - Solicitudes
router.post("/solicitudes/crear",CrearSolicitud);
router.get("/solicitudes/listar/:empresaId", ObtenerSolicitudes);
router.get("/solicitudes/buscar-beneficiario", BuscarBeneficiarios);
router.post('/solicitudes/anular/:id', AnularSolicitud);

// NUEVA RUTA: Procesar Pago (Con middleware Multer)
router.post("/solicitudes/procesar", authMiddleware, upload.single('comprobante'), ProcesarPago);

// Usuarios
router.get("/usuarios", authMiddleware, adminMiddleware, obtenerUsuarios)
router.post("/usuarios", authMiddleware, adminMiddleware, crearUsuario)
router.get("/usuarios/:id", authMiddleware, adminMiddleware, editarUsuarios)
router.put("/usuarios/:id", authMiddleware, adminMiddleware, actualizarUsuario)
router.delete("/usuarios/:id", authMiddleware, adminMiddleware, eliminarUsuario)
router.get("/usuarios/roles/list", authMiddleware, adminMiddleware, obtenerRoles)

// Logística
router.post("/logistica/fletes", authMiddleware, obtenerAutosFletes)
router.get("/logistica/vehiculos/list/:empresaId/:es_vehiculo_externo", authMiddleware, obtenerAutos)
router.post("/logistica/vehiculos/list-quehizo-flete", authMiddleware, obtenerAutosQueRealizaronFletes)
router.get("/logistica/vehiculos-siace/list/:empresaId",  obtenerAutosSiace)
router.post("/logistica/fletes/seleccionados", authMiddleware, guardarFletesSeleccionados)
router.post("/logistica/fletes/guardar-vehiculo", authMiddleware, guardarVehiculo)
router.post("/logistica/fletes/total-por-vehiculo", authMiddleware, obtenerTotalFletesPorVehiculo);
router.post("/logistica/fletes/detalle-por-vehiculo", authMiddleware, obtenerDetalleFacturasPorVehiculo);
router.post("/logistica/fletes-cancelados", authMiddleware, obtenerFletesCancelados)

// Solicitudes - Entidades
router.get("/solicitudes/entidades",  ObtenerEntidades)

//chatbot
router.post("/chatbot/obtener-respuesta", authMiddleware, obtenerRespuestaChatbot);

export default router