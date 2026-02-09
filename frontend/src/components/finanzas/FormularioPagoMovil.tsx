import React, { useEffect, useState } from "react";
import axios from "axios";
import { buildApiUrl } from "../../config/api";

type PagoMovilFormData = {
    numeroReferencia: string;
	montoOperacion: string;
	nacionalidadDestino: string;
	cedulaDestino: string;
	telefonoDestino: string;
	bancoDestino: string;
	moneda: string;
	conceptoPago: string;
};

const defaultFormData: PagoMovilFormData = {
	numeroReferencia:"6111121716",
    montoOperacion: "1.21",
	nacionalidadDestino: "V",
	cedulaDestino: "15404774",
	telefonoDestino: "04123963208",
	bancoDestino: "0102",
	moneda: "VES",
	conceptoPago: "Prueba Api Vuelto"
};

const FormularioPagoMovil: React.FC = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [formData, setFormData] = useState<PagoMovilFormData>(defaultFormData);
	const [loading, setLoading] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);

	const openModal = () => {
		setIsOpen(true);
		setErrorMsg(null);
		setSuccessMsg(null);
	};

	const closeModal = () => setIsOpen(false);

	useEffect(() => {
		if (!isOpen) return;

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") closeModal();
		};

		document.addEventListener("keydown", onKeyDown);
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		return () => {
			document.removeEventListener("keydown", onKeyDown);
			document.body.style.overflow = previousOverflow;
		};
	}, [isOpen]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setLoading(true);
		setErrorMsg(null);
		setSuccessMsg(null);

		try {
			const response = await axios.post(
				buildApiUrl("/bancos/bdv/pago-movil"),
				{ ...formData },
				{ withCredentials: true }
			);
            console.log("Respuesta Pago Movil:", response.data);
			if (response?.data?.code === 1000) {
				setSuccessMsg("Pago movil procesado correctamente.");
				closeModal();
			} else {
				setErrorMsg(response?.data?.message + " (Código: " + response?.data?.code + ")" || "No se pudo procesar el pago movil.");
			}
		} catch (error: any) {
			const apiMessage = error?.response?.data?.message;
			const apiCodigo = error?.response?.data?.code;
			setErrorMsg(apiMessage + " (Código: " + apiCodigo + ")" || "No se pudo procesar el pago movil.");
		} finally {
			setLoading(false);
		}
	};

	const inputClass = "w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-700 outline-none transition-all";
	const labelClass = "text-[10px] font-bold text-slate-400 uppercase ml-1";

	return (
		<div className="inline-flex">
			<button
				type="button"
				onClick={openModal}
				className="bg-red-700 text-white px-3 py-2 rounded-lg font-bold hover:bg-red-800 shadow-lg shadow-red-100 transition-all flex items-center gap-1 active:scale-95 text-xs"
			>
				Pago Movil BDV
			</button>

			{isOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center">
					<div
						className="absolute inset-0 bg-black/40"
						onClick={closeModal}
						aria-hidden="true"
					/>

					<div
						role="dialog"
						aria-modal="true"
						aria-labelledby="pago-movil-title"
						className="relative z-10 w-full max-w-2xl rounded-xl bg-white shadow-lg border border-slate-200 mx-4 flex flex-col max-h-[90vh]"
					>
						<div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
							<h2 id="pago-movil-title" className="text-2xl font-black text-slate-800 tracking-tight">
								Pago Movil BDV
							</h2>
							<button
								type="button"
								onClick={closeModal}
								className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-700"
								aria-label="Cerrar"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 20 20"
									fill="currentColor"
									className="h-5 w-5"
								>
									<path
										fillRule="evenodd"
										d="M4.22 4.22a.75.75 0 0 1 1.06 0L10 8.94l4.72-4.72a.75.75 0 1 1 1.06 1.06L11.06 10l4.72 4.72a.75.75 0 1 1-1.06 1.06L10 11.06l-4.72 4.72a.75.75 0 1 1-1.06-1.06L8.94 10 4.22 5.28a.75.75 0 0 1 0-1.06Z"
										clipRule="evenodd"
									/>
								</svg>
							</button>
						</div>

						<div className="px-6 py-5 flex-1 overflow-y-auto">
							<form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-1">
									<label className={labelClass}>Monto Operacion</label>
									<input
										name="montoOperacion"
										type="number"
										step="0.01"
										value={formData.montoOperacion}
										onChange={handleChange}
										className={inputClass}
									/>
								</div>
								<div className="space-y-1">
									<label className={labelClass}>Nacionalidad Destino</label>
									<select
										name="nacionalidadDestino"
										value={formData.nacionalidadDestino}
										onChange={handleChange}
										className={inputClass}
									>
										<option value="V">V</option>
										<option value="E">E</option>
									</select>
								</div>
								<div className="space-y-1">
									<label className={labelClass}>Cedula Destino</label>
									<input
										name="cedulaDestino"
										value={formData.cedulaDestino}
										onChange={handleChange}
										className={inputClass}
									/>
								</div>
								<div className="space-y-1">
									<label className={labelClass}>Telefono Destino</label>
									<input
										name="telefonoDestino"
										value={formData.telefonoDestino}
										onChange={handleChange}
										className={inputClass}
									/>
								</div>
								<div className="space-y-1">
									<label className={labelClass}>Banco Destino</label>
									<input
										name="bancoDestino"
										value={formData.bancoDestino}
										onChange={handleChange}
										className={inputClass}
									/>
								</div>
								<div className="space-y-1">
									<label className={labelClass}>Moneda</label>
									<input
										name="moneda"
										value={formData.moneda}
										onChange={handleChange}
										className={inputClass}
									/>
								</div>
								<div className="space-y-1 md:col-span-2">
									<label className={labelClass}>Concepto Pago</label>
									<input
										name="conceptoPago"
										value={formData.conceptoPago}
										onChange={handleChange}
										className={inputClass}
									/>
								</div>

								{errorMsg && (
									<div className="md:col-span-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
										{errorMsg}
									</div>
								)}
								{successMsg && (
									<div className="md:col-span-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-2">
										{successMsg}
									</div>
								)}

								<div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
									<button
										type="button"
										onClick={closeModal}
										className="px-4 py-2 rounded-lg font-bold text-slate-600 hover:bg-slate-100"
									>
										Cancelar
									</button>
									<button
										type="submit"
										disabled={loading}
										className="bg-red-700 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-800 shadow-lg shadow-red-100 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-60"
									>
										{loading ? "Enviando..." : "Enviar"}
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default FormularioPagoMovil;
