const HistorialDolar = () => {
return 
<div>
    <>
        <style>{`
            .hd-modal-toggle{position:absolute;opacity:0;pointer-events:none;}
            .hd-btn{padding:.5rem .75rem;border:1px solid #ccc;border-radius:.5rem;background:#fff;cursor:pointer;display:inline-block}
            .hd-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);display:none;align-items:center;justify-content:center;padding:1rem;z-index:9999}
            .hd-modal{background:#fff;border-radius:.75rem;max-width:520px;width:100%;box-shadow:0 10px 30px rgba(0,0,0,.25);overflow:hidden}
            .hd-header{padding:1rem 1rem .5rem;font-weight:600}
            .hd-body{padding:0 1rem 1rem;color:#333}
            .hd-actions{padding:0 1rem 1rem;display:flex;gap:.5rem;justify-content:flex-end}
            .hd-modal-toggle:checked ~ .hd-overlay{display:flex;}
        `}</style>

        <input id="hd-modal" className="hd-modal-toggle" type="checkbox" />

        <label className="hd-btn" htmlFor="hd-modal">
            Abrir modal
        </label>

        <div className="hd-overlay" role="dialog" aria-modal="true" aria-labelledby="hd-title">
            <div className="hd-modal">
                <div className="hd-header" id="hd-title">
                    Historial del dólar
                </div>

                <div className="hd-body">
                    Aquí puedes colocar el contenido del modal (tabla, formulario, etc.).
                </div>

                <div className="hd-actions">
                    <label className="hd-btn" htmlFor="hd-modal">
                        Cerrar
                    </label>
                </div>
            </div>
        </div>
    </>
</div>
};

export default HistorialDolar;