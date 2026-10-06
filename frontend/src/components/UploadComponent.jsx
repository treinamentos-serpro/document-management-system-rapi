import { useState } from 'react';

export default function UploadComponent({ onUpload, isUploading }) {
  const [selectedFile, setSelectedFile] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selectedFile || isUploading) return;

    const form = event.currentTarget;
    try {
      await onUpload(selectedFile);
      form.reset();
      setSelectedFile(null);
    } catch {
      // O componente pai apresenta o erro da API.
    }
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <label className="file-picker">
        <span>{selectedFile ? selectedFile.name : 'Escolher um arquivo'}</span>
        <input
          type="file"
          onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
          aria-label="Selecionar arquivo para envio"
        />
      </label>
      <button className="primary-button" type="submit" disabled={!selectedFile || isUploading}>
        {isUploading ? 'Enviando...' : 'Enviar arquivo'}
      </button>
    </form>
  );
}