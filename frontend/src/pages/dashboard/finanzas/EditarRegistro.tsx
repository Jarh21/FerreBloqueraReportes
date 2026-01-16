import React, { useState } from 'react';

interface Props {
  item: any;
  onClose: () => void;
  onSave: (updated: any) => void;
}

const EditarRegistro: React.FC<Props> = ({ item, onClose, onSave }) => {
  const [form, setForm] = useState<any>({ ...item });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((s: any) => ({ ...s, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl p-6 w-full max-w-xl shadow-lg border border-blue-100">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2">
            <span className="inline-block bg-blue-100 text-blue-700 rounded-full px-2 py-1 text-base">✏️</span>
            Editar registro
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-blue-600 text-lg font-bold">×</button>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción</label>
            <textarea name="descripcion" value={form.descripcion || ''} onChange={handleChange} className="border border-gray-300 rounded-md p-2 w-full min-h-[60px]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Referencia</label>
            <input name="referencia" value={form.referencia || ''} onChange={handleChange} className="border border-gray-300 rounded-md p-2 w-full" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Débito</label>
            <input name="debito" value={form.debito ?? ''} onChange={handleChange} className="border border-gray-300 rounded-md p-2 w-full" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Crédito</label>
            <input name="credito" value={form.credito ?? ''} onChange={handleChange} className="border border-gray-300 rounded-md p-2 w-full" />
          </div>
          <div className="md:col-span-2 flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold">Cancelar</button>
            <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow font-semibold hover:bg-blue-700 transition-colors">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditarRegistro;
