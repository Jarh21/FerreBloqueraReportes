name: skill-react-node
descripcion: lineamientos para desarrollo React + Node.js

objetivo:
	- construir funcionalidades en React y Node.js con código simple, legible y mantenible

reglas_generales:
	- usar nombres en español para variables, funciones y componentes
	- evitar nombres de 1 o 2 letras
	- priorizar soluciones sencillas y fáciles de leer
	- cambios mínimos, sin reescribir archivos completos

estilo_de_trabajo:
	- explicar poco y ser directo
	- antes de crear archivos o dependencias, preguntar

convenciones_frontend_react:
	- componentes en PascalCase (Ej: ListaProveedores)
	- funciones en camelCase (Ej: cargarReporteVentas)
	- estados con nombres claros (Ej: listaSolicitudes, estaCargando)
	- separar lógica de UI cuando sea posible

convenciones_backend_node:
	- controladores, servicios y rutas con nombres descriptivos
	- validar entrada antes de procesar
	- manejar errores con mensajes claros

no_hacer:
	- no agregar dependencias sin preguntar
	- no cambiar formato global si no es necesario
	- no crear archivos nuevos sin confirmación

validaciones:
	- ejecutar lint/build solo si se solicita

